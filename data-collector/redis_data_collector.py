import websocket
import json
import threading
import time
import logging
import redis
import sqlite3
from datetime import datetime, timezone
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

# === LOAD ENV ===
load_dotenv()

# === CONFIGURATION ===
SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT"]
WS_URL = "wss://socket.delta.exchange"
REDIS_HOST = CONFIG.get("redis_host", "localhost")
REDIS_PORT = CONFIG.get("redis_port", 6379)
REDIS_MAXLEN = 5000

# === LOGGING ===
logging.basicConfig(format='[%(asctime)s] [%(levelname)s] %(message)s', level=logging.INFO)

# === CONNECTIONS ===
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
db_file_path = CONFIG.get("sqlite_path", "delta_data.db")
conn = sqlite3.connect(db_file_path, check_same_thread=False)
db_lock = threading.Lock()

def init_db():
    with db_lock:
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS tickers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            symbol TEXT,
            mark_price REAL,
            spot_price REAL,
            best_bid REAL,
            best_ask REAL,
            high_24h REAL,
            low_24h REAL,
            volume_24h REAL,
            funding_rate REAL,
            open_interest REAL,
            liquidation_price REAL
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS trades (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            symbol TEXT,
            price REAL,
            side TEXT,
            size REAL
        )
        """)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS footprint_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT,
            ts TEXT,
            price_level REAL,
            bid_volume REAL,
            ask_volume REAL,
            delta REAL,
            imbalance REAL
        )
        """)
        conn.commit()

class DeltaDataCollector:
    def __init__(self):
        self.ws = None
        self.running = True
        self.last_trade_timestamps = {s: 0 for s in SYMBOLS}
        self.trade_buffers = {s: deque(maxlen=2000) for s in SYMBOLS}
        
    def save_to_sql(self, table, data):
        try:
            with db_lock:
                cursor = conn.cursor()
                if table == "tickers":
                    cursor.execute("""
                    INSERT INTO tickers (timestamp, symbol, mark_price, spot_price, best_bid, best_ask, 
                                        high_24h, low_24h, volume_24h, funding_rate, open_interest, liquidation_price)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (data['timestamp'], data['symbol'], data['mark_price'], data['spot_price'], 
                          data['best_bid'], data['best_ask'], data['high_24h'], data['low_24h'], 
                          data['volume_24h'], data.get('funding_rate', 0), data.get('open_interest', 0), 
                          data.get('liquidation_price', 0)))
                elif table == "trades":
                    cursor.execute("INSERT INTO trades (timestamp, symbol, price, side, size) VALUES (?, ?, ?, ?, ?)",
                                 (data['timestamp'], data['symbol'], data['price'], data['side'], data['size']))
                conn.commit()
        except Exception as e:
            logging.error(f"[SQL ERROR] {e}")

    def on_message(self, ws, message):
        try:
            data = json.loads(message)
            msg_type = data.get("type")
            symbol = data.get("symbol")
            if not symbol or symbol not in SYMBOLS: return

            if msg_type == "v2/ticker":
                ts = datetime.now(timezone.utc).isoformat()
                entry = {
                    "symbol": symbol, "timestamp": ts,
                    "mark_price": float(data.get("mark_price") or 0),
                    "spot_price": float(data.get("spot_price") or 0),
                    "best_bid": float(data.get("best_bid") or 0),
                    "best_ask": float(data.get("best_ask") or 0),
                    "high_24h": float(data.get("high") or 0),
                    "low_24h": float(data.get("low") or 0),
                    "volume_24h": float(data.get("volume") or 0),
                    "open_interest": float(data.get("open_interest") or 0),
                    "liquidation_price": float(data.get("liquidation_price") or 0)
                }
                r.xadd("delta_tickers", entry, maxlen=100)
                self.save_to_sql("tickers", entry)

            elif msg_type in ("v2/trades", "all_trades"):
                for trade in (data.get("data") or []):
                    if trade["timestamp"] <= self.last_trade_timestamps[symbol]: continue
                    ts = datetime.fromtimestamp(trade["timestamp"] / 1_000_000, tz=timezone.utc).isoformat()
                    trade_data = {
                        "symbol": symbol, "timestamp": ts, "price": float(trade.get("price") or 0),
                        "side": "buy" if trade.get("buyer_role") == "taker" else "sell",
                        "size": float(trade.get("size") or 0)
                    }
                    r.xadd("delta_trades", trade_data, maxlen=REDIS_MAXLEN)
                    self.save_to_sql("trades", trade_data)
                    self.last_trade_timestamps[symbol] = trade["timestamp"]
                    self.trade_buffers[symbol].append(trade_data)

                if len(self.trade_buffers[symbol]) >= 5:
                    fp = compute_footprint(self.trade_buffers[symbol])
                    if fp:
                        for row in fp:
                            r.xadd("delta_footprint", {"symbol": symbol, "ts": ts, **row}, maxlen=REDIS_MAXLEN)

        except Exception as e:
            logging.error(f"[WS ERROR] {e}")

    def on_open(self, ws):
        sub = {"type": "subscribe", "payload": {"channels": [{"name": "v2/ticker", "symbols": SYMBOLS}, {"name": "v2/trades", "symbols": SYMBOLS}]}}
        ws.send(json.dumps(sub))
        logging.info(f"Subscribed to REAL API for: {', '.join(SYMBOLS)}")

    def start_history_recorder(self):
        def record():
            while self.running:
                try:
                    for symbol in SYMBOLS:
                        # Get latest price from Redis stream or current state
                        ticker = r.xrevrange("delta_tickers", "+", "-", count=1)
                        if ticker:
                            data = ticker[0][1]
                            price = data.get('mark_price')
                            if price:
                                # Store in a list for the last 60 minutes
                                key = f"history:{symbol}:price"
                                r.lpush(key, f"{datetime.now(timezone.utc).isoformat()}|{price}")
                                r.ltrim(key, 0, 59) # Keep 60 minutes
                    time.sleep(60)
                except Exception as e:
                    logging.error(f"[HISTORY ERROR] {e}")
                    time.sleep(10)
        
        threading.Thread(target=record, daemon=True).start()

    def run(self):
        self.start_history_recorder()
        while self.running:
            try:
                self.ws = websocket.WebSocketApp(WS_URL, on_open=self.on_open, on_message=self.on_message)
                self.ws.run_forever()
            except: time.sleep(5)

if __name__ == "__main__":
    init_db()
    collector = DeltaDataCollector()
    collector.run()
