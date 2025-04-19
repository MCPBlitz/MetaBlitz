const News = require('../models/News');
const User = require('../models/User');
const twitterService = require('../services/newsAnalysis/twitterService');
const mediaService = require('../services/newsAnalysis/mediaService');
const sentimentService = require('../services/newsAnalysis/sentimentService');
const signalService = require('../services/newsAnalysis/signalService');

/**
 * @desc    Get trending news from all sources
 * @route   GET /api/news/trending
 * @access  Private
 */
exports.getTrendingNews = async (req, res) => {
  try {
    const { limit = 20, offset = 0, source, sentiment } = req.query;
    
    // Build query
    const query = {};
    
    if (source) {
      query.source = source;
    }
    
    if (sentiment) {
      query['sentiment.category'] = sentiment;
    }
    
    // Get trending news with high impact or engagement
    const news = await News.find(query)
      .sort({ 
        'impactLevel': -1, 
        'engagementMetrics.likes': -1, 
        'publishedAt': -1 
      })
      .skip(parseInt(offset))
      .limit(parseInt(limit));
    
    // Get total count
    const total = await News.countDocuments(query);
    
    res.json({
      success: true,
      count: news.length,
      total,
      data: news
    });
    
  } catch (error) {
    console.error('Error getting trending news:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get news from Twitter based on followed KOLs
 * @route   GET /api/news/twitter
 * @access  Private
 */
exports.getTwitterNews = async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    
    // Get KOLs followed by user
    const user = await User.findById(req.user.id);
    const twitterKOLs = user.followedKOLs
      .filter(kol => kol.platform === 'twitter')
      .map(kol => kol.kolId);
    
    // If no KOLs followed, return popular KOLs
    if (twitterKOLs.length === 0) {
      const popularNews = await twitterService.getPopularKOLNews(limit, offset);
      
      return res.json({
        success: true,
        count: popularNews.length,
        isFollowingKOLs: false,
        data: popularNews
      });
    }
    
    // Get tweets from followed KOLs
    const news = await News.find({
      source: 'twitter',
      'author.id': { $in: twitterKOLs }
    })
    .sort({ publishedAt: -1 })
    .skip(parseInt(offset))
    .limit(parseInt(limit));
    
    // Get total count
    const total = await News.countDocuments({
      source: 'twitter',
      'author.id': { $in: twitterKOLs }
    });
    
    res.json({
      success: true,
      count: news.length,
      total,
      isFollowingKOLs: true,
      data: news
    });
    
  } catch (error) {
    console.error('Error getting Twitter news:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get news from mainstream media sources
 * @route   GET /api/news/media
 * @access  Private
 */
exports.getMediaNews = async (req, res) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      source, 
      keyword, 
      token,
      startDate,
      endDate
    } = req.query;
    
    // Build query
    const query = {
      source: { $ne: 'twitter' } // Exclude Twitter
    };
    
    if (source) {
      query.source = source;
    }
    
    if (keyword) {
      query.$or = [
        { content: { $regex: keyword, $options: 'i' } },
        { title: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    if (token) {
      query['entities.name'] = token;
      query['entities.type'] = 'token';
    }
    
    if (startDate && endDate) {
      query.publishedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Get news from media sources
    const news = await News.find(query)
      .sort({ publishedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));
    
    // Get total count
    const total = await News.countDocuments(query);
    
    res.json({
      success: true,
      count: news.length,
      total,
      data: news
    });
    
  } catch (error) {
    console.error('Error getting media news:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get market sentiment analysis
 * @route   GET /api/news/sentiment
 * @access  Private
 */
exports.getSentimentAnalysis = async (req, res) => {
  try {
    const { token, timeframe = '24h' } = req.query;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token parameter is required'
      });
    }
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '6h':
        startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    // Get sentiment analysis for the token
    const sentiment = await sentimentService.analyzeTokenSentiment(token, startDate, now);
    
    res.json({
      success: true,
      data: sentiment
    });
    
  } catch (error) {
    console.error('Error getting sentiment analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get trading signals based on news analysis
 * @route   GET /api/news/signals
 * @access  Private
 */
exports.getTradingSignals = async (req, res) => {
  try {
    const { token, limit = 10, confidence = 0.7 } = req.query;
    
    // Build query
    const query = {
      'tradingSignal.type': { $ne: 'none' },
      'tradingSignal.confidence': { $gte: parseFloat(confidence) }
    };
    
    if (token) {
      query['tradingSignal.token'] = token;
    }
    
    // Get trading signals
    const signals = await News.find(query)
      .sort({ 
        'tradingSignal.confidence': -1, 
        publishedAt: -1 
      })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      count: signals.length,
      data: signals
    });
    
  } catch (error) {
    console.error('Error getting trading signals:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Follow a KOL to get their news
 * @route   POST /api/news/kol/follow
 * @access  Private
 */
exports.followKOL = async (req, res) => {
  try {
    const { platform, kolId, kolName } = req.body;
    
    if (!platform || !kolId || !kolName) {
      return res.status(400).json({
        success: false,
        error: 'Platform, KOL ID, and KOL name are required'
      });
    }
    
    // Check if already following
    const user = await User.findById(req.user.id);
    const isAlreadyFollowing = user.followedKOLs.some(
      kol => kol.platform === platform && kol.kolId === kolId
    );
    
    if (isAlreadyFollowing) {
      return res.status(400).json({
        success: false,
        error: 'Already following this KOL'
      });
    }
    
    // Add KOL to followed list
    user.followedKOLs.push({
      platform,
      kolId,
      kolName
    });
    
    await user.save();
    
    res.json({
      success: true,
      message: `Now following ${kolName} on ${platform}`,
      data: user.followedKOLs
    });
    
  } catch (error) {
    console.error('Error following KOL:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Unfollow a KOL
 * @route   POST /api/news/kol/unfollow
 * @access  Private
 */
exports.unfollowKOL = async (req, res) => {
  try {
    const { platform, kolId } = req.body;
    
    if (!platform || !kolId) {
      return res.status(400).json({
        success: false,
        error: 'Platform and KOL ID are required'
      });
    }
    
    // Find user and remove KOL
    const user = await User.findById(req.user.id);
    const initialLength = user.followedKOLs.length;
    
    user.followedKOLs = user.followedKOLs.filter(
      kol => !(kol.platform === platform && kol.kolId === kolId)
    );
    
    if (initialLength === user.followedKOLs.length) {
      return res.status(400).json({
        success: false,
        error: 'Not following this KOL'
      });
    }
    
    await user.save();
    
    res.json({
      success: true,
      message: `Unfollowed KOL on ${platform}`,
      data: user.followedKOLs
    });
    
  } catch (error) {
    console.error('Error unfollowing KOL:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get list of followed KOLs
 * @route   GET /api/news/kol/list
 * @access  Private
 */
exports.getFollowedKOLs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      count: user.followedKOLs.length,
      data: user.followedKOLs
    });
    
  } catch (error) {
    console.error('Error getting followed KOLs:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Set news filter preferences
 * @route   POST /api/news/filter
 * @access  Private
 */
exports.setNewsFilters = async (req, res) => {
  try {
    const { keywords, tokens, sources, sentiment } = req.body;
    
    // Validate input
    if (!keywords && !tokens && !sources && !sentiment) {
      return res.status(400).json({
        success: false,
        error: 'At least one filter parameter is required'
      });
    }
    
    // Update user's news filters
    const user = await User.findById(req.user.id);
    
    if (keywords) user.newsFilters.keywords = keywords;
    if (tokens) user.newsFilters.tokens = tokens;
    if (sources) user.newsFilters.sources = sources;
    if (sentiment) user.newsFilters.sentiment = sentiment;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'News filters updated successfully',
      data: user.newsFilters
    });
    
  } catch (error) {
    console.error('Error setting news filters:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
}; 