import mongoose, { Schema, Document } from 'mongoose';

// LLM Guidance Document interface
export interface ILLMGuidance extends Document {
  userId: mongoose.Types.ObjectId;
  symbol: string;
  analysis: {
    sentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    summary: string;
    keyPoints: string[];
  };
  recommendations: {
    action: 'buy' | 'sell' | 'hold';
    entryPrice?: number;
    stopLoss?: number;
    takeProfit?: number;
    positionSize?: string;
    reasoning: string;
  };
  risks: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// LLM Guidance Schema
const LLMGuidanceSchema = new Schema<ILLMGuidance>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  symbol: {
    type: String,
    required: true,
    index: true,
  },
  analysis: {
    sentiment: {
      type: String,
      enum: ['bullish', 'bearish', 'neutral'],
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    summary: {
      type: String,
      required: true,
    },
    keyPoints: [String],
  },
  recommendations: {
    action: {
      type: String,
      enum: ['buy', 'sell', 'hold'],
      required: true,
    },
    entryPrice: Number,
    stopLoss: Number,
    takeProfit: Number,
    positionSize: String,
    reasoning: {
      type: String,
      required: true,
    },
  },
  risks: {
    level: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: true,
    },
    factors: [String],
  },
}, {
  timestamps: true,
});

// Compound index for user and symbol queries
LLMGuidanceSchema.index({ userId: 1, symbol: 1, createdAt: -1 });

export const LLMGuidance = mongoose.model<ILLMGuidance>('LLMGuidance', LLMGuidanceSchema);
