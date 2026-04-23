import redis
import time

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

print("Monitoring Delta Exchange data streams...")
print("=" * 60)

start = time.time()
ticker_seen = False
trade_count = 0

while time.time() - start < 30:
    # Check tickers
    ticker_len = r.xlen('delta_tickers')
    if ticker_len > 0 and not ticker_seen:
        ticker_seen = True
        latest = r.xrange('delta_tickers', count=1)
        print(f"\n[TICKER] First ticker received!")
        print(f"  Entry: {latest[0][1]}")

    # Check trades
    trade_len = r.xlen('delta_trades')
    if trade_len > trade_count:
        new_trades = trade_len - trade_count
        latest = r.xrange('delta_trades', count=new_trades)
        print(f"\n[TRADES] {new_trades} new trade(s) (total: {trade_len})")
        for entry_id, fields in latest:
            print(f"  {entry_id}: price={fields.get('price')}, side={fields.get('side')}, size={fields.get('size')}")
        trade_count = trade_len

    time.sleep(1)

print("\n" + "=" * 60)
print(f"Final: delta_tickers={r.xlen('delta_tickers')} entries, delta_trades={r.xlen('delta_trades')} entries")
