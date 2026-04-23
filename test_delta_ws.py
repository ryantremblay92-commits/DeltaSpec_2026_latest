"""
Quick test script to inspect raw Delta Exchange WebSocket v2/trades payload format.
Run with: python test_delta_ws.py
"""
import asyncio
import json
import sys

PYTHON_PATH = r"C:\Users\varun\OneDrive\Desktop\Delta_trader_bot_04_23\backend\venv\Scripts\python.exe"

async def test():
    try:
        import websockets
    except ImportError:
        print("websockets not available in this env, using sys.path trick")
        sys.path.insert(0, r"C:\Users\varun\OneDrive\Desktop\Delta_trader_bot_04_23\backend\venv\Lib\site-packages")
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
        print("Subscribed. Waiting for v2/trades message (up to 30s)...")

        for _ in range(50):
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=10)
            except asyncio.TimeoutError:
                print("Timeout waiting for next message.")
                break

            data = json.loads(msg)
            t = data.get("type")
            print(f"  → Received type: {t}")

            if t == "v2/trades":
                print("\n=== v2/trades TOP-LEVEL KEYS ===")
                print(list(data.keys()))
                trade_list = data.get("data") or data.get("trades") or []
                if trade_list:
                    print("\n=== FIRST TRADE KEYS ===")
                    print(list(trade_list[0].keys()))
                    print("\n=== FIRST TRADE SAMPLE ===")
                    print(json.dumps(trade_list[0], indent=2))
                else:
                    print("Trade list is EMPTY — all keys in message:")
                    print(json.dumps(data, indent=2)[:800])
                break

asyncio.run(test())
