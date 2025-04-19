const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['twitter', 'forbes', 'coindesk', 'cointelegraph', 'bloomberg', 'wsj', 'reuters', 'reddit', 'discord', 'telegram', 'weibo', 'wechat'],
    required: true
  },
  sourceId: {
    type: String,
    required: true
  },
  author: {
    name: {
      type: String,
      required: true
    },
    id: String,
    profileUrl: String,
    followerCount: Number,
    isVerified: Boolean
  },
  content: {
    type: String,
    required: true
  },
  title: String,
  url: String,
  publishedAt: {
    type: Date,
    required: true
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  },
  sentiment: {
    score: {
      type: Number, // -1 to 1, negative to positive
      required: true
    },
    category: {
      type: String,
      enum: ['positive', 'negative', 'neutral'],
      required: true
    },
    confidence: {
      type: Number, // 0 to 1
      required: true
    }
  },
  entities: [{
    name: String,
    type: {
      type: String,
      enum: ['token', 'person', 'organization', 'event']
    },
    sentiment: {
      type: Number, // -1 to 1
      default: 0
    }
  }],
  tradingSignal: {
    type: {
      type: String,
      enum: ['buy', 'sell', 'hold', 'none'],
      default: 'none'
    },
    token: String,
    confidence: {
      type: Number, // 0 to 1
      default: 0
    },
    suggestedAction: String,
    autoExecuted: {
      status: {
        type: Boolean,
        default: false
      },
      executedAt: Date,
      transactionId: String
    }
  },
  impactLevel: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'low'
  },
  tags: [String],
  engagementMetrics: {
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    views: {
      type: Number,
      default: 0
    }
  },
  relatedNews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'News'
  }]
}, {
  timestamps: true
});

// Index for efficient queries
NewsSchema.index({ source: 1, publishedAt: -1 });
NewsSchema.index({ 'sentiment.category': 1 });
NewsSchema.index({ 'entities.name': 1 });
NewsSchema.index({ 'tradingSignal.type': 1 });
NewsSchema.index({ 'author.name': 1 });

module.exports = mongoose.model('News', NewsSchema); 