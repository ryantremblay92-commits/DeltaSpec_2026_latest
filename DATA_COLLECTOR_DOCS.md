# DeltaSpec Data Collector Documentation

The Data Collector is a standalone Python service responsible for ingesting real-time market data from the Delta Exchange, processing it, and distributing it to the rest of the DeltaSpec system.

## Overview

The collector connects to Delta Exchange via WebSocket for real-time updates and REST API for polling/backfilling. It normalizes this data and publishes it to **Redis Streams** for immediate consumption by the backend server, while simultaneously persisting it to a **SQLite** database for historical analysis.

### Key Features
- **Real-time Ingestion:** Maintains a persistent WebSocket connection to Delta Exchange.
- **Hybrid Data Fetching:** Uses WebSocket for low-latency updates and REST polling for reliability.
- **Dual Persistence:**
  - **Redis Streams:** High-performance message bus for real-time dashboard updates.
  - **SQLite:** Local database for historical data storage and complex queries.
- **Advanced Analytics:** Computes Order Flow, Footprint charts, and Cumulative Delta in real-time.

---

## Data Pipeline

1. **Ingestion Sources:**
   - **WebSocket:** `l2_orderbook`, `v2/ticker`, `v2/trades` channels.
   - **REST API:** `GET /v2/trades/{symbol}` for trade backfilling.

2. **Processing:**
   - **Normalization:** Converts raw exchange JSON into standardized internal formats.
   - **Buffering:** Maintains a rolling buffer of recent trades (`deque`) for analytics.
   - **Throttling:** Smart rate-limiting for expensive operations like Footprint snapshots.

3. **Output Channels:**
   - **Redis Streams:**
     - `delta_trades`: Individual trade executions.
     - `delta_tickers`: Price and volume updates.
     - `delta_orderbook`: Level 2 order book updates.
     - `delta_orderbook_pressure`: Aggregated bid/ask pressure and imbalance.
     - `delta_footprint`: Aggregated price-level volume data.
     - `delta_cumulative_delta`: CVD metrics.
   - **SQLite Tables:**
     - `trades`, `tickers`, `orderbook`, `cumulative_delta`, `footprint_data`, `orderbook_pressure`.

---

## Analytics Modules

### 1. Footprint Charts (`analytics/footprint.py`)
Aggregates trades by price level to visualize buying vs. selling pressure within specific candles.
- **Metrics:** Bid Volume, Ask Volume, Delta (Ask - Bid), Imbalance.
- **Persistence:** Snapshots are saved to SQLite and republished to Redis every ~5 seconds (configurable) or after a batch of trades.

### 2. Cumulative Volume Delta (`analytics/cumulative_delta.py`)
Tracks the cumulative difference between buying and selling volume over time.
- **Usage:** Identifies divergence between price and order flow (e.g., price rising but CVD falling).

### 3. Order Book Pressure
Calculates the imbalance between total bid size and total ask size in the L2 order book.
- **Usage:** Predicts short-term price direction based on liquidity walls.

---

## Configuration

Configuration is managed via `utils/config.py` and environment variables.

| Variable | Default | Description |
|----------|---------|-------------|
| `SYMBOL` | `ETHUSD` | Trading pair to monitor. |
| `WS_URL` | `wss://socket.delta.exchange` | WebSocket endpoint. |
| `REDIS_HOST` | `localhost` | Redis server hostname. |
| `REDIS_PORT` | `6379` | Redis server port. |
| `FOOTPRINT_MIN_TRADES` | `120` | Min trades to trigger a footprint snapshot. |
| `FOOTPRINT_MIN_SECONDS` | `5` | Min seconds between footprint snapshots. |

---

## Running the Collector

The collector is designed to run as a background service.

### Prerequisites
- Python 3.8+
- Redis Server running
- Virtual environment with dependencies installed

### Installation
```bash
cd data-collector
pip install -r requirements.txt
```

### Execution
```bash
python redis_data_collector.py
```

### Monitoring
The service logs to `stdout`. Watch for:
- `[WebSocket] Subscribed`: Successful connection.
- `[REST] Stored X trades`: Successful polling.
- `[FOOTPRINT] Saved snapshot`: Analytics generation success.