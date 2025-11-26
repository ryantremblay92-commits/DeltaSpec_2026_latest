from collections import defaultdict

def save_aggregated_footprint(trades, ts):
    pass

def save_footprint_snapshot(fp, imb, ts):
    pass

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