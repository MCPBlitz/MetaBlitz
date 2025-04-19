const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false
  },
  walletAddress: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profilePicture: {
    type: String,
    default: 'default-profile.png'
  },
  subscription: {
    type: {
      type: String,
      enum: ['none', 'basic', 'pro', 'enterprise'],
      default: 'none'
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['inactive', 'active', 'cancelled', 'expired'],
      default: 'inactive'
    },
    paymentMethod: {
      type: String,
      enum: ['none', 'crypto', 'card', 'blzToken'],
      default: 'none'
    }
  },
  followedKOLs: [{
    platform: {
      type: String,
      enum: ['twitter', 'weibo', 'discord', 'telegram'],
      required: true
    },
    kolId: {
      type: String,
      required: true
    },
    kolName: {
      type: String,
      required: true
    }
  }],
  newsFilters: {
    keywords: [String],
    tokens: [String],
    sources: [String],
    sentiment: {
      type: String,
      enum: ['all', 'positive', 'negative', 'neutral'],
      default: 'all'
    }
  },
  tradingPreferences: {
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    tradeSize: {
      type: Number,
      default: 100 // in USD
    },
    autoBuy: {
      type: Boolean,
      default: false
    },
    autoArbitrage: {
      type: Boolean,
      default: false
    }
  },
  blzTokenBalance: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Encrypt password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to check if password matches
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate token
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION || '1d' }
  );
};

// Method to update last login
UserSchema.methods.updateLastLogin = async function() {
  this.lastLogin = Date.now();
  return this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('User', UserSchema); 