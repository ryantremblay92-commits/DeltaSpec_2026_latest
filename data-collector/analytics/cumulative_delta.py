def compute_cumulative_delta(trades):
    """
    Compute cumulative delta from trade data.
    Returns list of (timestamp, cumulative_delta, interval_delta) tuples.
    """
    if not trades:
        return []

    # Sort trades by timestamp
    sorted_trades = sorted(trades, key=lambda x: x['timestamp'])

    cumulative_delta = 0
    results = []

    for trade in sorted_trades:
        price = float(trade['price'])
        size = float(trade['size'])
        side = trade['side']  # 'buy' or 'sell'

        # Delta: buys - sells (positive = buying pressure)
        delta = size if side == 'buy' else -size
        cumulative_delta += delta

        results.append((
            trade['timestamp'],
            float(cumulative_delta),
            float(delta)  # interval delta
        ))

    return results