import dotenv from 'dotenv';
import express from 'express';
import { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import basicRoutes from './routes/index';
import authRoutes from './routes/authRoutes';
import llmRoutes from './routes/llmRoutes';
import dataRoutes from './routes/dataRoutes';
import { connectDB } from './config/database';
import cors from 'cors';
import { RedisStreamService } from './services/redisStreamService';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL variables in .env missing.");
  process.exit(-1);
}

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;

// Pretty-print JSON responses
app.enable('json spaces');
// We want to be consistent with URL paths, so we enable strict routing
app.enable('strict routing');

app.use(cors({}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for now, restrict in production
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start Redis Stream Service
const redisStreamService = new RedisStreamService(io);
redisStreamService.start().catch(err => {
  console.error('Failed to start Redis Stream Service:', err);
});

// Basic Routes
app.use(basicRoutes);
// Authentication Routes
app.use('/api/auth', authRoutes);
// LLM Routes
app.use('/api/llm', llmRoutes);
// Data Routes
app.use('/api/data', dataRoutes);

// If no routes handled the request, it's a 404
app.use((req: Request, res: Response) => {
  res.status(404).send("Page not found.");
});

// Error handling
app.use((err: Error, req: Request, res: Response) => {
  console.error(`Unhandled application error: ${err.message}`);
  console.error(err.stack);
  res.status(500).send("There was an error serving your request.");
});

httpServer.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});