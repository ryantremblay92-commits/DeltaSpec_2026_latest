"""
Extended WebSocket test - watch for ANY message from Delta Exchange for 60s.
"""
import asyncio, json

async def test():
    import websockets
    url = "wss://socket.delta.exchange"
    print(f"Connecting to {url}...")
    async with websockets.connect(url) as ws:
        sub = {
            "type": "subscribe",
            "payload": {
                "channels": [
                    {"name": "v2/ticker", "symbols": ["ETHUSD"]},
                    {"name": "all_trades", "symbols": ["ETHUSD"]},
                    {"name": "l2_orderbook", "symbols": ["ETHUSD"]},
                ]
            }
        }
        await ws.send(json.dumps(sub))
        print("Subscribed. Listening 60s for ANY message...")
        print("-" * 60)

        for i in range(100):
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=60)
                data = json.loads(msg)
                msg_type = data.get("type", "NO-TYPE")
                print(f"\n[{i+1}] Type: {msg_type}")
                print(f"  Keys: {list(data.keys())}")

                # Show ticker-relevant fields if present
                if any(k in data for k in ['mark_price', 'last_price', 'symbol']):
                    print(f"  mark_price={data.get('mark_price')}, last_price={data.get('last_price')}, symbol={data.get('symbol')}")

            except asyncio.TimeoutError:
                print("\n[Timeout] No messages for 60s")
                break
            except Exception as e:
                print(f"[Error] {e}")
                break

if __name__ == "__main__":
    asyncio.run(test())
