const express = require('express');
const router = express.Router();

// Import route modules
const newsRoutes = require('./newsRoutes');
const smartBuyRoutes = require('./smartBuyRoutes');
const arbitrageRoutes = require('./arbitrageRoutes');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');

// Mount routes
router.use('/news', newsRoutes);
router.use('/smartbuy', smartBuyRoutes);
router.use('/arbitrage', arbitrageRoutes);
router.use('/users', userRoutes);
router.use('/auth', authRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    name: 'MCPBlitz API',
    version: '1.0.0',
    description: 'Web3 Intelligent Cryptocurrency Trading Tool API',
    endpoints: [
      '/api/news',
      '/api/smartbuy',
      '/api/arbitrage',
      '/api/users',
      '/api/auth'
    ]
  });
});

module.exports = router; 