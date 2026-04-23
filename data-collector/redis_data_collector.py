import websocket
import json
import threading
import time
import logging
import redis

import sqlite3
from datetime import datetime, timezone, UTC
from collections import deque
import requests

from analytics.cumulative_delta import compute_cumulative_delta
from analytics.footprint import (
    save_aggregated_footprint,
    save_footprint_snapshot,
    compute_footprint,
    compute_volume_imbalance,
)

from utils.config import CONFIG
from dotenv import load_dotenv
import os
# === LOAD ENV ===
load_dotenv()

# === CONFIGURATION ===
SYMBOL = "ETHUSDT"
WS_URL = "wss://socket.delta.exchange"
REST_TRADES_URL = f"https://api.india.delta.exchange/v2/trades/{SYMBOL}"
REDIS_HOST = CONFIG.get("redis_host", "localhost")
REDIS_PORT = CONFIG.get("redis_port", 6379)
REDIS_MAXLEN = 5000
# Footprint persistence throttling
FOOTPRINT_MIN_TRADES = int(CONFIG.get("footprint_min_trades", 120))   # save only when enough trades
FOOTPRINT_MIN_SECONDS = float(CONFIG.get("footprint_min_seconds", 5)) # and at least X seconds since last save

# === LOGGING ===
logging.basicConfig(
    format='[%(asctime)s] [%(levelname)s] %(message)s',
    level=logging.INFO
)
# === REDIS CONNECTION ===
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

# === SQLITE CONNECTION ===
db_file_path = CONFIG.get("sqlite_path")
conn = sqlite3.connect(db_file_path, check_same_thread=False)
db_lock = threading.Lock()
cursor = conn.cursor()

# === CREATE TABLES ===
cursor.execute("""
CREATE TABLE IF NOT EXISTS tickers (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    symbol TEXT,
    mark_price REAL,
    spot_price REAL,
    best_bid REAL,
    best_ask REAL,
    high_24h REAL,
    low_24h REAL,
    volume_24h REAL,
    funding_rate REAL
)
""")
cursor.execute("""
CREATE TABLE IF NOT EXISTS trades (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    price REAL,
    side TEXT,
    size REAL
)
""")
cursor.execute("""
CREATE TABLE IF NOT EXISTS orderbook (
    id TEXT PRIMARY KEY,
    timestamp TEXT,
    side TEXT,
    limit_price REAL,
    size REAL,
    depth REAL
)
""")
cursor.execute("""
CREATE TABLE IF NOT EXISTS cumulative_delta (
    timestamp TEXT PRIMARY KEY,
    cumulative_delta REAL,
    interval_delta REAL
)
""")
cursor.execute("""
CREATE TABLE IF NOT EXISTS footprint_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT,
    price_level REAL,
    bid_volume REAL,
    ask_volume REAL,
    delta REAL,
    imbalance REAL
)
""")
cursor.execute("""
CREATE TABLE IF NOT EXISTS orderbook_pressure (
    timestamp TEXT PRIMARY KEY,
    bid_pressure REAL,
    ask_pressure REAL,
    imbalance REAL
)
""")
cursor.execute("""
CREATE TABLE IF NOT EXISTS llm_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    mode TEXT,
    signals_json TEXT,
    response TEXT,
    model_name TEXT
)
""")

# Raw snapshot table is created by analytics.footprint.save_footprint_snapshot() when first called.
conn.commit()


def save_to_sql(table, entry_id, entry):
    """Generic SQLite insert wrapper"""
    try:
        with db_lock:
            cursor = conn.cursor()
            if table == "tickers":
                cursor.execute("""
                INSERT OR IGNORE INTO tickers (id, timestamp, symbol, mark_price, spot_price,
                                               best_bid, best_ask, high_24h, low_24h, volume_24h, funding_rate)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    entry_id,
                    entry.get("timestamp"),
                    entry.get("symbol"),
                    float(entry.get("mark_price") or 0),
                    float(entry.get("spot_price") or 0),
                    float(entry.get("best_bid") or 0),
                    float(entry.get("best_ask") or 0),
                    float(entry.get("high_24h") or 0),
                    float(entry.get("low_24h") or 0),
                    float(entry.get("volume_24h") or 0),
                    float(entry.get("funding_rate") or 0),
                ))
            elif table == "trades":
                cursor.execute("""
                INSERT OR IGNORE INTO trades (id, timestamp, price, side, size)
                VALUES (?, ?, ?, ?, ?)
                """, (
                    entry_id,
                    entry.get("timestamp"),
                    float(entry.get("price") or 0),
                    entry.get("side"),
                    float(entry.get("size") or 0),
                ))
            elif table == "orderbook":
                cursor.execute("""
                INSERT OR IGNORE INTO orderbook (id, timestamp, side, limit_price, size, depth)
                VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    entry_id,
                    entry.get("timestamp"),
                    entry.get("side"),
                    float(entry.get("limit_price") or 0),
                    float(entry.get("size") or 0),
                    float(entry.get("depth") or 0),
                ))
            elif table == "cumulative_delta":
                cursor.execute("""
                INSERT OR REPLACE INTO cumulative_delta (timestamp, cumulative_delta, interval_delta)
                VALUES (?, ?, ?)
                """, (
                    entry.get("timestamp"),
                    float(entry.get("cumulative_delta") or 0),
                    float(entry.get("interval_delta") or 0) if entry.get("interval_delta") is not None else None,
                ))
            elif table == "footprint_data":
                cursor.execute("""
                INSERT INTO footprint_data (ts, price_level, bid_volume, ask_volume, delta, imbalance)
                VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    entry.get("ts"),
                    float(entry.get("price_level") or 0),
                    float(entry.get("bid_volume") or 0),
                    float(entry.get("ask_volume") or 0),
                    float(entry.get("delta") or 0),
                    float(entry.get("imbalance") or 0),
                ))
            elif table == "orderbook_pressure":
                cursor.execute("""
                INSERT OR REPLACE INTO orderbook_pressure (timestamp, bid_pressure, ask_pressure, imbalance)
                VALUES (?, ?, ?, ?)
                """, (
                    entry.get("timestamp"),
                    float(entry.get("bid_pressure") or 0),
                    float(entry.get("ask_pressure") or 0),
                    float(entry.get("imbalance") or 0),
                ))
                cursor.execute("""
                CREATE TABLE IF NOT EXISTS support_resistance_levels (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT,
                    level_type TEXT,
                    price REAL,
                    source TEXT
                )
                """)

            conn.commit()

    except Exception as e:
        logging.error(f"[SQLite] Insert error in {table}: {e}")


class DeltaDataCollector:
    def __init__(self):
        self.ws = None
        self.running = True
        self.last_trade_timestamp = 0
        self.trade_buffer = deque(maxlen=2000)  # bigger buffer helps footprint aggregation
        self.last_ticker_time = 0

        # throttling for footprint persistence
        self.last_footprint_save_time = 0.0

    # ---------- internal helpers ----------    
    def _persist_footprint_if_due(self, reason: str = ""):
        """
        Persist aggregated footprint rows and a raw snapshot if:
        - we have at least FOOTPRINT_MIN_TRADES in buffer, and
        - it's been at least FOOTPRINT_MIN_SECONDS since last save.
        Also republishes footprint + imbalance into Redis so dashboard charts can see them.
        """
        now = time.time()
        if len(self.trade_buffer) < FOOTPRINT_MIN_TRADES:
            return
        if (now - self.last_footprint_save_time) < FOOTPRINT_MIN_SECONDS:
            return

        ts = datetime.utcnow().isoformat()
        try:
            trades_copy = deque(list(self.trade_buffer))

            # --- SQLite persistence ---
            save_aggregated_footprint(trades_copy, ts=ts)

            fp = compute_footprint(trades_copy)
            imb = compute_volume_imbalance(trades_copy)
            save_footprint_snapshot(fp, imb, ts=ts)

            # --- Redis republish (for dashboard) ---
            if fp:
                for row in fp:
                    redis_entry = {
                        "ts": ts,
                        "price_level": row.get("price_level"),
                        "bid_volume": row.get("bid_volume"),
                        "ask_volume": row.get("ask_volume"),
                        "delta": row.get("delta"),
                        "imbalance": row.get("imbalance"),
                    }
                    r.xadd("delta_footprint", redis_entry, maxlen=REDIS_MAXLEN)

            if imb:
                redis_imb = {"ts": ts}
                redis_imb.update(imb)
                r.xadd("delta_volume_imbalance", redis_imb, maxlen=REDIS_MAXLEN)

            self.last_footprint_save_time = now
            logging.info(f"[FOOTPRINT] Saved snapshot ({reason}) with {len(trades_copy)} trades")

        except Exception as e:
            logging.error(f"[FOOTPRINT] Persist error: {e}")        


    # ---------- websocket handlers ----------
    def on_message(self, ws, message):
        try:
            data = json.loads(message)
            msg_type = data.get("type")

            # === ORDERBOOK PRESSURE SNAPSHOT ===
            if msg_type == "l2_orderbook" and data.get("symbol") == SYMBOL:
                ts = datetime.utcnow().isoformat()
                bid_pressure = sum(float(e.get("size") or 0) for e in data.get("buy", []))
                ask_pressure = sum(float(e.get("size") or 0) for e in data.get("sell", []))
                imbalance = bid_pressure - ask_pressure

                pressure_entry = {
                    "timestamp": ts,
                    "bid_pressure": bid_pressure,
                    "ask_pressure": ask_pressure,
                    "imbalance": imbalance
                }
                r.xadd("delta_orderbook_pressure", pressure_entry, maxlen=REDIS_MAXLEN)
                save_to_sql("orderbook_pressure", ts, pressure_entry)
                logging.info(f"[ORDERBOOK-PRESSURE] {pressure_entry}")

                # Full orderbook levels
                for side in ["buy", "sell"]:
                    for entry in data.get(side, []):
                        cleaned = {
                            "timestamp": ts,
                            "side": side,
                            "limit_price": float(entry.get("limit_price") or 0),
                            "size": float(entry.get("size") or 0),
                            "depth": float(entry.get("depth") or 0)
                        }
                        msg_id = r.xadd("delta_orderbook", cleaned, maxlen=REDIS_MAXLEN)
                        save_to_sql("orderbook", msg_id, cleaned)

            # === TICKER ===
            elif msg_type == "v2/ticker":
                ts = datetime.utcnow().isoformat()
                entry = {
                    "timestamp": ts,
                    "symbol": data.get("symbol", SYMBOL),
                    "mark_price": str(data.get("mark_price") or 0),
                    "spot_price": str(data.get("spot_price") or 0),
                    "best_bid": str(data.get("best_bid") or 0),
                    "best_ask": str(data.get("best_ask") or 0),
                    "high_24h": str(data.get("high") or 0),
                    "low_24h": str(data.get("low") or 0),
                    "volume_24h": str(data.get("volume") or 0),
                    "funding_rate": str(data.get("funding_rate") or 0)
                }
                msg_id = r.xadd("delta_tickers", entry, maxlen=REDIS_MAXLEN)
                save_to_sql("tickers", msg_id, entry)
                self.last_ticker_time = time.time()
                logging.info(f"[TICKER] {entry}")

            # === TRADES ===
            elif msg_type in ("v2/trades", "all_trades"):
                trades = data.get("data") or []
                for trade in trades:
                    ts = datetime.fromtimestamp(
                        trade["timestamp"] / 1_000_000, tz=timezone.utc
                    ).isoformat()
                    if trade["timestamp"] <= self.last_trade_timestamp:
                        continue

                    trade_data = {
                        "timestamp": ts,
                        "price": float(trade.get("price") or 0),
                        "side": "buy" if trade.get("buyer_role") == "taker" else "sell",
                        "size": float(trade.get("size") or 0)
                    }
                    msg_id = r.xadd("delta_trades", trade_data, maxlen=REDIS_MAXLEN)
                    save_to_sql("trades", msg_id, trade_data)
                    self.last_trade_timestamp = trade["timestamp"]
                    self.trade_buffer.append(trade_data)

                    # Seed ticker if missing
                    if self.last_ticker_time == 0 or time.time() - self.last_ticker_time > 5:
                        ticker_entry = {
                            "timestamp": ts,
                            "symbol": SYMBOL,
                            "mark_price": str(trade_data["price"]),
                            "spot_price": str(trade_data["price"]),
                            "best_bid": "0",
                            "best_ask": "0",
                            "high_24h": "0",
                            "low_24h": "0",
                            "volume_24h": "0",
                            "funding_rate": "0"
                        }
                        msg_id = r.xadd("delta_tickers", ticker_entry, maxlen=REDIS_MAXLEN)
                        save_to_sql("tickers", msg_id, ticker_entry)
                        self.last_ticker_time = time.time()
                        logging.info(f"[TICKER-SEED] Price from trade {trade_data['price']}")

                # === CUMULATIVE DELTA ===
                if self.trade_buffer:
                    cd_points = compute_cumulative_delta(self.trade_buffer)
                    if cd_points:
                        last_cd = cd_points[-1]
                        cd_entry = {
                            "timestamp": last_cd[0],
                            "cumulative_delta": last_cd[1],
                            "interval_delta": last_cd[2]  # Fixed: was None, now uses actual interval delta
                        }
                        r.xadd("delta_cumulative_delta", cd_entry, maxlen=REDIS_MAXLEN)
                        save_to_sql("cumulative_delta", last_cd[0], cd_entry)
                        logging.info(f"[CUM_DELTA] Δ: {last_cd[1]:.2f}")

                # === FOOTPRINT PERSISTENCE (rate-limited) ===
                self._persist_footprint_if_due(reason="WS batch")

                # === FORCE GENERATE SOME TEST DATA FOR DEMO ===
                # This will be removed once real trade data accumulates
                if len(self.trade_buffer) >= 5:  # Have enough trades for analysis
                    fp = compute_footprint(self.trade_buffer)
                    imb = compute_volume_imbalance(self.trade_buffer)
                    cd = compute_cumulative_delta(self.trade_buffer)

                    if fp:
                        # Publish footprint to Redis for dashboard
                        for row in fp[:10]:  # Limit to first 10 levels for demo
                            redis_entry = {
                                "ts": datetime.utcnow().isoformat(),
                                "price_level": row.get("price_level"),
                                "bid_volume": row.get("bid_volume"),
                                "ask_volume": row.get("ask_volume"),
                                "delta": row.get("delta"),
                                "imbalance": row.get("imbalance"),
                            }
                            r.xadd("delta_footprint", redis_entry, maxlen=REDIS_MAXLEN)

                    if imb:
                        redis_imb = {"ts": datetime.utcnow().isoformat()}
                        redis_imb.update(imb)
                        r.xadd("delta_volume_imbalance", redis_imb, maxlen=REDIS_MAXLEN)

                    if cd:
                        # Publish latest cumulative delta
                        last_cd = cd[-1]
                        cd_entry = {
                            "timestamp": last_cd[0],
                            "cumulative_delta": str(last_cd[1]),
                            "interval_delta": str(last_cd[2])
                        }
                        r.xadd("delta_cumulative_delta", cd_entry, maxlen=REDIS_MAXLEN)

        except Exception as e:
            logging.error(f"[ERROR] Failed to process WS message: {e}")

    def on_error(self, ws, error):
        logging.error(f"[WebSocket Error] {error}")

    def on_close(self, ws, close_status_code, close_msg):
        logging.warning("[WebSocket] Connection closed")

    def on_open(self, ws):
        subscribe_message = {
            "type": "subscribe",
            "payload": {
                "channels": [
                    {"name": "l2_orderbook", "symbols": [SYMBOL]},
                    {"name": "v2/ticker", "symbols": [SYMBOL]},
                    {"name": "all_trades", "symbols": [SYMBOL]},
                ]
            },
        }
        ws.send(json.dumps(subscribe_message))
        logging.info("[WebSocket] Subscribed")

    def run_ws(self):
        while self.running:
            self.ws = websocket.WebSocketApp(
                WS_URL,
                on_open=self.on_open,
                on_message=self.on_message,
                on_error=self.on_error,
                on_close=self.on_close,
            )
            self.ws.run_forever()
            logging.warning("[WebSocket] Disconnected. Reconnecting in 5s...")
            time.sleep(5)

    def run_rest_polling(self):
        while self.running:
            self.fetch_and_store_trades()
            # Persist footprint on a REST cadence too
            self._persist_footprint_if_due(reason="REST poll")
            time.sleep(5)

    def fetch_and_store_trades(self):
        try:
            response = requests.get(REST_TRADES_URL, timeout=5)
            trades = response.json().get("result") or []
            for trade in trades:
                ts = datetime.fromtimestamp(
                    trade["timestamp"] / 1_000_000, tz=timezone.utc
                ).isoformat()
                if trade["timestamp"] <= self.last_trade_timestamp:
                    continue
                trade_data = {
                    "timestamp": ts,
                    "price": float(trade.get("price") or 0),
                    "side": "buy" if trade.get("buyer_role") == "taker" else "sell",
                    "size": float(trade.get("size") or 0),
                }
                msg_id = r.xadd("delta_trades", trade_data, maxlen=REDIS_MAXLEN)
                save_to_sql("trades", msg_id, trade_data)
                self.last_trade_timestamp = max(
                    self.last_trade_timestamp, trade["timestamp"]
                )
                self.trade_buffer.append(trade_data)
            logging.info(f"[REST] Stored {len(trades)} trades")
        except Exception as e:
            logging.error(f"[REST] Error fetching trades: {e}")

    def stop(self):
        self.running = False
        if self.ws:
            self.ws.close()


# === MAIN ===
if __name__ == "__main__":
    collector = DeltaDataCollector()
    threading.Thread(target=collector.run_ws, daemon=True).start()
    threading.Thread(target=collector.run_rest_polling, daemon=True).start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        collector.stop()
        logging.info("[MAIN] Collector stopped.")
