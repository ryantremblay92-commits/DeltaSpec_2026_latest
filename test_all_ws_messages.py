"""
Capture ALL Delta Exchange WebSocket messages to see what data is flowing.
Run with: python test_all_ws_messages.py
"""
import asyncio
import json
import sys

async def test():
    try:
        import websockets
    except ImportError:
        import subprocess; subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets"])
        import websockets

    url = "wss://socket.delta.exchange"
    print(f"[INFO] Connecting to {url}...")
    async with websockets.connect(url) as ws:
        sub = {
            "type": "subscribe",
            "payload": {
                "channels": [
                    {"name": "l2_orderbook", "symbols": ["ETHUSD"]},
                    {"name": "v2/ticker", "symbols": ["ETHUSD"]},
                    {"name": "v2/trades", "symbols": ["ETHUSD"]},
                ]
            }
        }
        await ws.send(json.dumps(sub))
        print("[INFO] Subscribed. Listening for ALL messages (60s)...")
        print("=" * 80)

        msg_count = 0
        start_time = asyncio.get_event_loop().time()

        while True:
            try:
                elapsed = asyncio.get_event_loop().time() - start_time
                if elapsed > 60:
                    print(f"\n[INFO] 60s timeout. Total messages: {msg_count}")
                    break

                msg = await asyncio.wait_for(ws.recv(), timeout=60)
                msg_count += 1

                try:
                    data = json.loads(msg)
                    msg_type = data.get("type", "UNKNOWN")

                    # Count by type
                    print(f"\n[{msg_count}] Type: {msg_type}")

                    # Show full structure for ticker/trades, summary for others
                    if msg_type in ("v2/ticker", "v2/trades", "l2_orderbook"):
                        print(f"  Full data: {json.dumps(data, indent=2)[:1000]}")
                        if msg_type == "v2/ticker":
                            print(f"  -> mark_price: {data.get('mark_price')}, symbol: {data.get('symbol')}")
                        elif msg_type == "v2/trades":
                            trades = data.get("data") or data.get("trades") or []
                            print(f"  -> {len(trades)} trades. Sample: {trades[0] if trades else 'none'}")
                        elif msg_type == "l2_orderbook":
                            buys = len(data.get("buy", []))
                            sells = len(data.get("sell", []))
                            print(f"  -> bids: {buys}, asks: {sells}")
                    else:
                        # Show full for other types too
                        print(f"  Data: {json.dumps(data, indent=2)[:800]}")

                except json.JSONDecodeError:
                    print(f"[WARN] Non-JSON message: {msg[:200]}")

            except asyncio.TimeoutError:
                print("\n[INFO] Timeout - no messages for 60s")
                break

if __name__ == "__main__":
    asyncio.run(test())
