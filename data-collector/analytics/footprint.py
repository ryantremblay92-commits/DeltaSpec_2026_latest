from collections import defaultdict

def save_aggregated_footprint(trades, ts):
    """
    Save aggregated footprint data to SQLite.
    """
    import sqlite3
    from utils.config import CONFIG

    db_file_path = CONFIG.get("sqlite_path")
    conn = sqlite3.connect(db_file_path)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS footprint_data (
            ts TEXT,
            price_level REAL,
            bid_volume REAL,
            ask_volume REAL,
            delta REAL,
            imbalance REAL,
            PRIMARY KEY (ts, price_level)
        )
    """)
    # Save each footprint level
    for trade in trades:
        cursor.execute("""
            INSERT OR REPLACE INTO footprint_data
            (ts, price_level, bid_volume, ask_volume, delta, imbalance)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            ts,
            trade.get('price_level', 0),
            trade.get('bid_volume', 0),
            trade.get('ask_volume', 0),
            trade.get('delta', 0),
            trade.get('imbalance', 0)
        ))

    conn.commit()
    conn.close()

def save_footprint_snapshot(fp, imb, ts):
    """
    Save footprint snapshot to SQLite.
    """
    import sqlite3
    from utils.config import CONFIG

    db_file_path = CONFIG.get("sqlite_path")
    conn = sqlite3.connect(db_file_path)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS footprint_snapshots (
            timestamp TEXT PRIMARY KEY,
            footprint_data TEXT,
            imbalance_data TEXT
        )
    """)
    # Save raw footprint snapshot (could be JSON or structured data)
    cursor.execute("""
        INSERT OR REPLACE INTO footprint_snapshots
        (timestamp, footprint_data, imbalance_data)
        VALUES (?, ?, ?)
    """, (
        ts,
        str(fp) if fp else None,
        str(imb) if imb else None
    ))

    conn.commit()
    conn.close()

def compute_footprint(trades):
    """
    Aggregates trades into footprint data (price levels with bid/ask volume).
    """
    if not trades:
        return []

    levels = defaultdict(lambda: {"bid_volume": 0.0, "ask_volume": 0.0})

    for trade in trades:
        price = float(trade['price'])
        size = float(trade['size'])
        side = trade['side']  # 'buy' or 'sell'

        if side == 'buy':
            levels[price]["ask_volume"] += size
        else:
            levels[price]["bid_volume"] += size

    footprint_data = []
    for price, data in levels.items():
        bid_vol = data["bid_volume"]
        ask_vol = data["ask_volume"]
        delta = ask_vol - bid_vol
        
        # Simple imbalance (ratio)
        imbalance = 0
        if bid_vol > 0 and ask_vol > 0:
            if ask_vol > bid_vol:
                imbalance = ask_vol / bid_vol
            else:
                imbalance = -(bid_vol / ask_vol)
        
        footprint_data.append({
            "price_level": price,
            "bid_volume": bid_vol,
            "ask_volume": ask_vol,
            "delta": delta,
            "imbalance": imbalance
        })

    # Sort by price descending
    footprint_data.sort(key=lambda x: x["price_level"], reverse=True)

    return footprint_data

def compute_volume_imbalance(trades):
    """
    Computes volume imbalance from trades.
    """
    if not trades:
        return {}
        
    buy_vol = sum(float(t['size']) for t in trades if t['side'] == 'buy')
    sell_vol = sum(float(t['size']) for t in trades if t['side'] == 'sell')
    
    return {
        "bid_imbalance": sell_vol,
        "ask_imbalance": buy_vol,
        "total_imbalance": buy_vol - sell_vol
    }