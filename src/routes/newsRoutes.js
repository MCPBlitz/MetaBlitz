const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const newsController = require('../controllers/newsController');

/**
 * @route   GET /api/news/trending
 * @desc    Get trending news from all sources
 * @access  Private
 */
router.get('/trending', authenticate, newsController.getTrendingNews);

/**
 * @route   GET /api/news/twitter
 * @desc    Get news from Twitter based on followed KOLs
 * @access  Private
 */
router.get('/twitter', authenticate, newsController.getTwitterNews);

/**
 * @route   GET /api/news/media
 * @desc    Get news from mainstream media sources
 * @access  Private
 */
router.get('/media', authenticate, newsController.getMediaNews);

/**
 * @route   GET /api/news/sentiment
 * @desc    Get market sentiment analysis
 * @access  Private
 */
router.get('/sentiment', authenticate, newsController.getSentimentAnalysis);

/**
 * @route   GET /api/news/signals
 * @desc    Get trading signals based on news analysis
 * @access  Private
 */
router.get('/signals', authenticate, newsController.getTradingSignals);

/**
 * @route   POST /api/news/kol/follow
 * @desc    Follow a KOL to get their news
 * @access  Private
 */
router.post('/kol/follow', authenticate, newsController.followKOL);

/**
 * @route   POST /api/news/kol/unfollow
 * @desc    Unfollow a KOL
 * @access  Private
 */
router.post('/kol/unfollow', authenticate, newsController.unfollowKOL);

/**
 * @route   GET /api/news/kol/list
 * @desc    Get list of followed KOLs
 * @access  Private
 */
router.get('/kol/list', authenticate, newsController.getFollowedKOLs);

/**
 * @route   POST /api/news/filter
 * @desc    Set news filter preferences
 * @access  Private
 */
router.post('/filter', authenticate, newsController.setNewsFilters);

module.exports = router; 