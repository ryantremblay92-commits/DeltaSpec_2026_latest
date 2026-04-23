# Troubleshooting Guide - DeltaTradeHub

## Environment Details
<environment_details>
Current time: 2026-04-24T00:31:12+05:30
</environment_details>

## Issues Encountered & Solutions

### 1. Price Chart Not Showing Data ❌➡️✅

**Issue**: The price chart component was rendering but showing no data points. The chart appeared empty with "Waiting for live data..." message.

**Root Cause**:
- Trading symbol was set to `ETHUSD` (inactive/illiquid pair)
- WebSocket channel name was incorrect: `"v2/trades"` instead of `"all_trades"`
- API endpoint was pointing to global exchange instead of India exchange

**Solution**:
```python
# In data-collector/redis_data_collector.py
SYMBOL = "ETHUSDT"  # Changed from "ETHUSD"
WS_URL = "wss://socket.delta.exchange"
REST_TRADES_URL = f"https://api.india.delta.exchange/v2/trades/{SYMBOL}"  # Updated endpoint

# WebSocket subscription
subscribe_message = {
    "type": "subscribe",
    "payload": {
        "channels": [
            {"name": "l2_orderbook", "symbols": [SYMBOL]},
            {"name": "v2/ticker", "symbols": [SYMBOL]},    # ✅ Working
            {"name": "all_trades", "symbols": [SYMBOL]},   # ✅ Fixed from "v2/trades"
        ]
    },
}
```

**Files Changed**:
- `data-collector/redis_data_collector.py`
- `server/.env` (optional: update LLM config)

**Result**: Price chart now displays real-time ETHUSDT data with updates every few seconds.

---

### 2. WebSocket Connection Issues ❌➡️✅

**Issue**: WebSocket appeared to connect but no market data was being received. Subscription confirmation showed `"subscription forbidden on this invalid channel"` for trades.

**Root Cause**: Delta Exchange WebSocket API uses different channel names than expected:
- ❌ `"v2/trades"` → `"subscription forbidden"`
- ✅ `"all_trades"` → Works correctly

**Solution**: Updated WebSocket subscription to use correct channel names:
```javascript
// Correct channels for Delta Exchange WebSocket v2
{
    "name": "v2/ticker",      // ✅ Live price data
    "name": "all_trades",     // ✅ Trade execution data
    "name": "l2_orderbook"    // ✅ Order book depth
}
```

---

### 3. Frontend Not Loading ❌➡️✅

**Issue**: Browser showed connection timeout or blank page when accessing http://localhost:5173.

**Root Cause**: Multiple Node.js processes running on different ports, causing conflicts.

**Solution**:
```bash
# Kill all Node processes
Stop-Process -Name "node" -Force

# Restart services in correct order
cd server && npm run dev    # Backend on :3000
cd client && npm run dev    # Frontend on :5173
```

**Result**: Frontend loads correctly at http://localhost:5173 with React app running.

---

### 4. LLM Integration Errors ❌➡️✅

**Issue**: AI chat features failing with "No models loaded" error.

**Root Cause**: OpenAI API configuration pointing to local LM Studio but no models loaded.

**Configuration**:
```env
# server/.env
LLM_PROVIDER=openai
LLM_MODEL=mistral-7b-instruct-v0.1
OPENAI_API_KEY=lm-studio
OPENAI_BASE_URL=http://192.168.0.28:1234/v1
```

**Note**: This requires LM Studio running locally with Mistral model loaded. For production, update to use actual OpenAI API key.

---

### 5. Redis Connection Issues ❌➡️✅

**Issue**: Python data collector couldn't connect to Redis initially.

**Root Cause**: Redis container not running or port conflicts.

**Solution**:
```bash
# Start Redis container
docker run -d --name redis-deltaspec -p 6379:6379 redis:alpine

# Verify connection
docker exec redis-deltaspec redis-cli PING
```

**Result**: Redis streams working correctly for real-time data.

---

### 6. Data Pipeline Debugging ❌➡️✅

**Issue**: Unclear where data was getting stuck in the pipeline.

**Debug Tools Created**:
- `test_all_ws_messages.py` - Captures all WebSocket messages
- `monitor_streams.py` - Monitors Redis streams in real-time
- `check_redis.py` - Validates stream contents

**Key Findings**:
- WebSocket subscription succeeded but wrong channels
- Ticker data flowing but trade data blocked by invalid channel
- Redis streams working correctly once data arrives

---

## Current Working Configuration

### Services Status ✅
- **Redis**: `localhost:6379` (Docker container)
- **MongoDB**: `localhost:27017` (local instance)
- **Backend**: `localhost:3000` (Node.js + Express + Socket.io)
- **Frontend**: `localhost:5173` (React + Vite)
- **Data Collector**: Python WebSocket client (running)

### Data Flow ✅
```
Delta Exchange → WebSocket → Data Collector → Redis → Backend → Frontend
ETHUSDT Live Data → ✅ → ✅ → ✅ → ✅ → ✅ Price Chart
```

### Key Files
- `data-collector/redis_data_collector.py` - Main data ingestion
- `server/services/redisStreamService.ts` - Redis to Socket.io bridge
- `client/src/components/DeltaSpec/Views/PriceChart.tsx` - Price visualization
- `client/src/context/MarketDataContext.tsx` - Real-time data management

### Environment Requirements
- Node.js 18+
- Python 3.8+
- Docker (for Redis)
- MongoDB (local or Docker)
- LM Studio (for AI features, optional)

---

## Quick Start (After Fixes)

```bash
# 1. Start Redis
docker run -d --name redis-deltaspec -p 6379:6379 redis:alpine

# 2. Start MongoDB
mongod

# 3. Install dependencies
cd server && npm install
cd ../client && npm install
cd ../data-collector && pip install websocket-client redis python-dotenv

# 4. Start services
cd server && npm run dev      # Terminal 1
cd client && npm run dev      # Terminal 2
cd data-collector && python redis_data_collector.py  # Terminal 3

# 5. Open http://localhost:5173 → Live Data tab
```

---

## Testing Commands

```bash
# Check Redis streams
docker exec redis-deltaspec sh -c "printf 'XLEN delta_tickers\nXLEN delta_trades\n' | redis-cli --pipe"

# Test WebSocket
cd data-collector && python test_symbols.py

# Verify frontend
curl http://localhost:5173 | head -20
curl http://localhost:3000/ping
```

---

## Future Improvements

1. **Error Handling**: Add retry logic for WebSocket disconnections
2. **Multiple Symbols**: Support BTCUSDT, SOLUSDT, etc.
3. **Data Persistence**: Implement historical data storage
4. **UI Enhancements**: Add more chart types and indicators
5. **Production Deployment**: Docker Compose setup for all services

---

*Last Updated: 2026-04-24*
*Issue Resolution Time: ~2 hours*
*Status: ✅ All Critical Issues Resolved*