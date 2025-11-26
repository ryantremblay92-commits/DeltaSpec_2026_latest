# DeltaSpec - Real-Time Crypto Order Flow Analysis

DeltaSpec is a comprehensive real-time cryptocurrency trading analysis platform that provides advanced order flow metrics, delta analysis, and AI-powered trading guidance. Built with React, Node.js, and Python, it offers a complete solution for traders who want to understand market microstructure.

## 🚀 Features

### Core Analysis Tools
- **Live Order Flow Analysis** - Real-time bid/ask pressure, imbalance tracking
- **Cumulative Volume Delta (CVD)** - Track buying vs. selling pressure over time  
- **Footprint Charts** - Price-level volume distribution with heatmap visualization
- **Volume Profile** - Point of Control (POC), Value Area High/Low (VAH/VAL), VWAP
- **Trading Signals** - AI-powered market signals with win rate tracking

### AI-Powered Features
- **Smart Chat Assistant** - Conversational AI for trading guidance and market analysis
- **Automated Analysis** - Comprehensive market analysis with sentiment and confidence
- **Risk Assessment** - AI-generated risk factors and position sizing recommendations
- **Quick Insights** - Dynamic market insights based on recent activity

### Advanced Visualizations
- **Real-time Charts** - Interactive price charts with multiple timeframes
- **Order Book Visualization** - Live depth chart with spread analysis
- **Heatmaps** - Visual representation of buying/selling pressure
- **Responsive Dashboard** - Professional trading interface with dark/light themes

## 🏗️ Architecture

DeltaSpec is built using a modern microservices architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React SPA     │    │   Node.js API    │    │  Python Data    │
│   (Frontend)    │◄──►│    (Backend)     │◄──►│   Collector     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────▼────────┐              │
         └──────────────►│   MongoDB       │◄─────────────┘
                        │   (Database)    │
                        └─────────────────┘
                                │
                       ┌────────▼────────┐
                       │     Redis       │
                       │  (Real-time)    │
                       └─────────────────┘
```

### Components
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + Socket.io
- **Data Collector**: Python + WebSocket + SQLite + Redis
- **Database**: MongoDB (User data, AI history) + Redis (Real-time streams)
- **AI Integration**: OpenAI GPT / Anthropic Claude

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.8+
- **Redis** Server 6+
- **MongoDB** 5.0+
- **Git** for version control

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd DeltaTradeHub-6517e37
```

### 2. Backend Setup
```bash
cd server
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start backend server
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install

# Start development server
npm run dev
```

### 4. Data Collector Setup
```bash
cd data-collector
pip install -r requirements.txt

# Configure environment
# Edit utils/config.py or set environment variables

# Start data collector
python redis_data_collector.py
```

## 🔧 Configuration

### Backend Environment Variables
Create a `server/.env` file:
```env
# Database
DATABASE_URL=mongodb://localhost:27017/deltaspec
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Tokens
ACCESS_TOKEN_SECRET=your-access-token-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret

# AI Configuration (Optional)
LLM_PROVIDER=openai
LLM_MODEL=gpt-3.5-turbo
OPENAI_API_KEY=your-openai-api-key

# OR for Anthropic
# LLM_PROVIDER=anthropic
# LLM_MODEL=claude-3-sonnet-20240229
# ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Data Collector Configuration
Edit `data-collector/utils/config.py`:
```python
CONFIG = {
    "redis_host": "localhost",
    "redis_port": 6379,
    "sqlite_path": "./delta_data.db",
    "footprint_min_trades": 120,
    "footprint_min_seconds": 5,
}
```

## 📖 Documentation

Comprehensive documentation is available in the project:

- **[API Documentation](API_DOCUMENTATION.md)** - Complete API endpoint reference
- **[Backend Architecture](BACKEND_ARCHITECTURE.md)** - Backend system design and components
- **[Frontend Architecture](FRONTEND_ARCHITECTURE.md)** - Frontend structure and technologies
- **[Data Collector Documentation](DATA_COLLECTOR_DOCS.md)** - Data ingestion and processing
- **[LLM Integration Guide](LLM_INTEGRATION_INSTRUCTIONS.md)** - AI features implementation
- **[Implementation Guide](IMPLEMENTATION_GUIDE.md)** - Frontend development overview

## 🚀 Quick Start

1. **Start Services:**
   ```bash
   # Terminal 1: Redis
   redis-server
   
   # Terminal 2: MongoDB
   mongod
   
   # Terminal 3: Backend
   cd server && npm run dev
   
   # Terminal 4: Data Collector
   cd data-collector && python redis_data_collector.py
   
   # Terminal 5: Frontend
   cd client && npm run dev
   ```

2. **Access the Application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Health Check: http://localhost:3000/ping

3. **Login/Register:**
   - Create an account or login with existing credentials
   - Explore the different analysis views
   - Try the AI chat assistant

## 🔍 Key Features Deep Dive

### Real-Time Data Pipeline
The data collector maintains a persistent connection to Delta Exchange via WebSocket, processing:
- **Trades**: Individual trade executions with size and price
- **Order Book**: Level 2 depth with bid/ask levels
- **Ticker Data**: Price updates, volume, 24h metrics

### Order Flow Analysis
- **Delta Calculation**: Ask volume - Bid volume per price level
- **Imbalance Metrics**: Ratio-based pressure indicators
- **Cumulative Volume**: Running total of buying vs. selling pressure

### AI Integration
The platform integrates with state-of-the-art language models to provide:
- **Market Analysis**: Real-time sentiment and confidence scoring
- **Trading Recommendations**: Entry/exit levels with risk assessment
- **Risk Management**: Position sizing and stop-loss guidance
- **Educational Support**: Conversational explanations of concepts

## 🧪 Testing

### Backend Tests
```bash
cd server
npm test
```

### Frontend Tests
```bash
cd client
npm test
```

### Data Collector Tests
```bash
cd data-collector
python -m pytest tests/
```

## 🏃‍♂️ Production Deployment

### Docker Deployment (Recommended)
```bash
# Build and start all services
docker-compose up -d
```

### Manual Deployment
1. **Build Frontend:**
   ```bash
   cd client && npm run build
   ```

2. **Production Backend:**
   ```bash
   cd server && npm run build && npm start
   ```

3. **Systemd Service** (Linux):
   ```bash
   # Create service files for data collector
   sudo systemctl enable deltaspec-collector
   sudo systemctl start deltaspec-collector
   ```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the docs folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Community**: Join our Discord server (link in repo)
- **Email**: support@deltaspec.com

## 🙏 Acknowledgments

- Delta Exchange for providing excellent API access
- OpenAI and Anthropic for AI capabilities
- The open-source community for the amazing libraries used

---

**Built with ❤️ for traders, by traders.**

Ready to analyze the market like a professional? [Get Started](#-quick-start) now!