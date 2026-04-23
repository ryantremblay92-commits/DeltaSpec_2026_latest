"""
Try different symbol formats to see which ones work.
"""
import asyncio, json

async def test_symbol(symbol):
    import websockets
    url = "wss://socket.delta.exchange"
    async with websockets.connect(url) as ws:
        sub = {
            "type": "subscribe",
            "payload": {
                "channels": [
                    {"name": "all_trades", "symbols": [symbol]},
                    {"name": "v2/ticker", "symbols": [symbol]},
                ]
            }
        }
        await ws.send(json.dumps(sub))
        print(f"Subscribed for {symbol}. Waiting 20s...")

        received = []
        for _ in range(50):
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=20)
                data = json.loads(msg)
                received.append(data.get("type"))
                print(f"  Received: {data.get('type')} - keys: {list(data.keys())}")
                if data.get("type") in ("v2/ticker", "all_trades"):
                    print(f"    DATA: {str(data)[:300]}")
            except asyncio.TimeoutError:
                break

        return received

async def main():
    for symbol in ["ETHUSD", "ETHUSDT", "BTCUSD", "BTCUSDT"]:
        print(f"\n{'='*60}")
        print(f"Testing symbol: {symbol}")
        msgs = await test_symbol(symbol)
        print(f"  Message types received: {msgs}")

if __name__ == "__main__":
    asyncio.run(main())
