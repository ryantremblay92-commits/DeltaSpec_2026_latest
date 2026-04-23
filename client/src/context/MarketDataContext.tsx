import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface OrderBookEntry {
    price: number;
    size: number;
}

interface OrderBookState {
    bids: Map<number, number>; // price -> size
    asks: Map<number, number>; // price -> size
}

interface MarketDataState {
    ticker: any;
    trades: any[];
    orderbook: OrderBookState;
    orderbookPressure: any;
    cumulativeDelta: any;
    footprint: any;
    volumeImbalance: any;
    isConnected: boolean;
    currentSymbol: string;
    setSymbol: (symbol: string) => void;
}

const initialState: MarketDataState = {
    ticker: null,
    trades: [],
    orderbook: { bids: new Map(), asks: new Map() },
    orderbookPressure: null,
    cumulativeDelta: null,
    footprint: null,
    volumeImbalance: null,
    isConnected: false,
    currentSymbol: 'BTCUSDT',
    setSymbol: () => {},
};

export const MarketDataContext = createContext<MarketDataState>(initialState);

export const MarketDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<MarketDataState>(initialState);
    const [socket, setSocket] = useState<Socket | null>(null);

    const setSymbol = (symbol: string) => {
        setState(prev => ({
            ...prev,
            currentSymbol: symbol,
            // Clear data buffers on symbol swap
            trades: [],
            ticker: null,
            orderbook: { bids: new Map(), asks: new Map() },
            footprint: null,
            cumulativeDelta: null
        }));
    };

    useEffect(() => {
        const newSocket = io('http://localhost:3000');

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket server');
            setState((prev) => ({ ...prev, isConnected: true }));
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
            setState((prev) => ({ ...prev, isConnected: false }));
        });

        newSocket.on('tickers', (data) => {
            setState((prev) => {
                // Only update if symbol matches
                if (data.symbol !== prev.currentSymbol) return prev;
                return { ...prev, ticker: data };
            });
        });

        newSocket.on('trades', (data) => {
            setState((prev) => {
                // Only update if symbol matches
                if (data.symbol !== prev.currentSymbol) return prev;
                return {
                    ...prev,
                    trades: [data, ...prev.trades].slice(0, 100),
                };
            });
        });

        newSocket.on('orderbook', (data) => {
            setState((prev) => {
                if (data.symbol !== prev.currentSymbol) return prev;
                
                const price = parseFloat(data.limit_price);
                const size = parseFloat(data.size);
                
                let newBids = new Map(prev.orderbook.bids);
                let newAsks = new Map(prev.orderbook.asks);

                if (data.side === 'buy') {
                    if (size === 0) newBids.delete(price);
                    else newBids.set(price, size);
                } else {
                    if (size === 0) newAsks.delete(price);
                    else newAsks.set(price, size);
                }

                return {
                    ...prev,
                    orderbook: { bids: newBids, asks: newAsks }
                };
            });
        });

        newSocket.on('orderbook_pressure', (data) => {
            setState((prev) => {
                if (data.symbol !== prev.currentSymbol) return prev;
                return { ...prev, orderbookPressure: data };
            });
        });

        newSocket.on('cumulative_delta', (data) => {
            setState((prev) => {
                if (data.symbol !== prev.currentSymbol) return prev;
                return { ...prev, cumulativeDelta: data };
            });
        });

        newSocket.on('footprint', (data) => {
            setState((prev) => {
                if (data.symbol !== prev.currentSymbol) return prev;
                return { ...prev, footprint: data };
            });
        });

        newSocket.on('volume_imbalance', (data) => {
            setState((prev) => {
                if (data.symbol !== prev.currentSymbol) return prev;
                return { ...prev, volumeImbalance: data };
            });
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    return (
        <MarketDataContext.Provider value={{ ...state, setSymbol }}>
            {children}
        </MarketDataContext.Provider>
    );
};
