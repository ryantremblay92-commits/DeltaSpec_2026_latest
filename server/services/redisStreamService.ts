import Redis from 'ioredis';
import { Server as SocketIOServer } from 'socket.io';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379');

// Redis client for reading streams
const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
});

const STREAMS = [
    'delta_tickers',
    'delta_trades',
    'delta_orderbook',
    'delta_orderbook_pressure',
    'delta_cumulative_delta',
    'delta_footprint',
    'delta_volume_imbalance',
];

export class RedisStreamService {
    private io: SocketIOServer;
    private lastIds: Record<string, string> = {};
    private isRunning: boolean = false;

    constructor(io: SocketIOServer) {
        this.io = io;
        // Initialize last IDs to '$' (only new messages) or '0' (all messages)
        // Using '$' to start listening from now
        STREAMS.forEach((stream) => {
            this.lastIds[stream] = '$';
        });
    }

    public async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('Starting Redis Stream Service...');
        this.readStreams();
    }

    private async readStreams() {
        while (this.isRunning) {
            try {
                // Construct XREAD arguments
                // STREAMS key1 key2 ... id1 id2 ...
                const args: any[] = ['BLOCK', 1000, 'STREAMS', ...STREAMS];
                STREAMS.forEach((stream) => {
                    args.push(this.lastIds[stream]);
                });

                // @ts-ignore - ioredis types might be slightly off for xread with array spread
                const results = await redis.xread(...args);

                if (results) {
                    for (const [stream, messages] of results) {
                        for (const [id, fields] of messages) {
                            this.lastIds[stream] = id;

                            // Parse fields (array of strings) into object
                            // fields: ['key1', 'val1', 'key2', 'val2', ...]
                            const data: Record<string, any> = {};
                            for (let i = 0; i < fields.length; i += 2) {
                                data[fields[i]] = fields[i + 1];
                            }

                            // Broadcast to WebSocket
                            // Map stream name to event name
                            const eventName = this.getEventName(stream);
                            this.io.emit(eventName, data);
                        }
                    }
                }
            } catch (error) {
                console.error('Error reading Redis streams:', error);
                // Wait a bit before retrying to avoid tight loop on error
                await new Promise((resolve) => setTimeout(resolve, 5000));
            }
        }
    }

    private getEventName(stream: string): string {
        // Remove 'delta_' prefix
        return stream.replace('delta_', '');
    }

    public stop() {
        this.isRunning = false;
        redis.disconnect();
    }
}
