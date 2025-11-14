import mongoose, { Schema, Document } from 'mongoose';

// LLM Message interface
export interface ILLMMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    symbol?: string;
    confidence?: number;
    sentiment?: 'bullish' | 'bearish' | 'neutral';
    tags?: string[];
  };
}

// LLM Conversation Document interface
export interface ILLMConversation extends Document {
  userId: mongoose.Types.ObjectId;
  symbol?: string;
  messages: ILLMMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// LLM Message Schema
const LLMMessageSchema = new Schema<ILLMMessage>({
  id: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    symbol: String,
    confidence: Number,
    sentiment: {
      type: String,
      enum: ['bullish', 'bearish', 'neutral'],
    },
    tags: [String],
  },
}, { _id: false });

// LLM Conversation Schema
const LLMConversationSchema = new Schema<ILLMConversation>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  symbol: {
    type: String,
    default: 'BTCUSDT',
  },
  messages: [LLMMessageSchema],
}, {
  timestamps: true,
});

// Indexes for performance
LLMConversationSchema.index({ userId: 1, updatedAt: -1 });
LLMConversationSchema.index({ userId: 1, symbol: 1 });

export const LLMConversation = mongoose.model<ILLMConversation>('LLMConversation', LLMConversationSchema);
