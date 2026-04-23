# DeltaTradeHub - Real-Time Crypto Trading Analytics

## 🚀 Latest Update (2026-04-24)

### ✅ Price Chart Fixed - Now Working!
- **Symbol**: Changed from ETHUSD to ETHUSDT (ETHUSD produces no data)
- **WebSocket Channel**: Fixed from 'v2/trades' to 'all_trades'
- **API Endpoint**: Updated to india.delta.exchange
- **Result**: Price chart now displays real-time ETHUSDT data!

### 🏗️ Architecture
- **Frontend**: React + TypeScript + Vite (localhost:5173)
- **Backend**: Node.js + Express + Socket.io (localhost:3000)
- **Database**: MongoDB + Redis
- **Data Collector**: Python WebSocket client

### 📊 Features
- **Live Data**: Real-time ETHUSDT price charts
- **Trading Analytics**: Delta analysis, volume profiles, order flow
- **AI Integration**: LLM-powered trading guidance
- **Multi-View Dashboard**: Live Data, Delta Analysis, Signals, LLM Guidance

### 🔧 Services Status
- ✅ Redis (Docker): localhost:6379
- ✅ MongoDB: localhost:27017
- ✅ Backend API: localhost:3000
- ✅ Frontend App: localhost:5173
- ✅ Data Collector: Active

### 🚀 Quick Start
```bash
# 1. Start Redis
docker run -d --name redis-deltaspec -p 6379:6379 redis:alpine

# 2. Start MongoDB
mongod

# 3. Start Backend
cd server && npm run dev

# 4. Start Data Collector
cd data-collector && python redis_data_collector.py

# 5. Start Frontend
cd client && npm run dev

# 6. Open http://localhost:5173
```

### 🎯 Live Demo
Visit **http://localhost:5173** → "Live Data" tab to see real-time price charts!

## 📈 Real-Time Data Pipeline
Delta Exchange → WebSocket → Data Collector → Redis → Backend → Frontend

## 🔄 Recent Commits
- fix: Update symbol from ETHUSD to ETHUSDT and fix WebSocket channels
- feat: Implement real-time market data streaming and analysis
- docs: Add comprehensive project documentation
- style(vscode): Format launch.json with a newline

---

**Repository**: https://github.com/ryantremblay92-commits/DeltaSpec_2026_latest