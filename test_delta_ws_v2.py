"""
Test script to inspect raw Delta Exchange WebSocket v2/trades payload format.
Run with: python test_delta_ws.py
"""
import asyncio
import json
import sys

async def test():
    try:
        import websockets
    except ImportError:
        print("websockets not available, installing...")
        import subprocess; subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets"])
        import websockets

    url = "wss://socket.delta.exchange"
    print(f"Connecting to {url}...")
    async with websockets.connect(url) as ws:
        sub = {
            "type": "subscribe",
            "payload": {
                "channels": [
                    {"name": "v2/trades", "symbols": ["BTCUSDT"]},
                    {"name": "v2/ticker", "symbols": ["BTCUSDT"]},
                ]
            }
        }
        await ws.send(json.dumps(sub))
        print("Subscribed. Waiting for messages (up to 30s)...")

        for i in range(50):
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=10)
            except asyncio.TimeoutError:
                print("Timeout waiting for next message.")
                break

            data = json.loads(msg)
            t = data.get("type")
            print(f"[{i}] Received type: {t}")

            if t == "v2/trades":
                print("\n=== v2/trades TOP-LEVEL KEYS ===")
                print(list(data.keys()))
                trade_list = data.get("data") or data.get("trades") or []
                if trade_list:
                    print(f"\nTrade count: {len(trade_list)}")
                    print("\n=== FIRST TRADE KEYS ===")
                    print(list(trade_list[0].keys()))
                    print("\n=== FIRST TRADE SAMPLE ===")
                    print(json.dumps(trade_list[0], indent=2))
                else:
                    print("Trade list EMPTY. Full message:")
                    print(json.dumps(data, indent=2)[:800])
                break
            elif t == "v2/ticker":
                print("\n=== TICKER SAMPLE ===")
                print(json.dumps(data, indent=2)[:800])
                # Don't break - keep listening for trades too

if __name__ == "__main__":
    asyncio.run(test())
