const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate user requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Set user on request object
    req.user = user;
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Middleware to check if user has admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Unauthorized access: Admin privileges required' });
  }
};

/**
 * Middleware to check if user has paid subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.hasPaidSubscription = (req, res, next) => {
  // In Year 1, all features are free according to business plan
  const currentYear = new Date().getFullYear();
  const launchYear = 2025; // Adjust based on your actual launch year
  
  if (currentYear - launchYear < 1) {
    // First year all features are free
    return next();
  }
  
  if (req.user && (req.user.subscription.status === 'active' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ error: 'Subscription required for this feature' });
  }
}; 