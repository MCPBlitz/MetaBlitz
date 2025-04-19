const { TwitterApi } = require('twitter-api-v2');
const News = require('../../models/News');
const sentimentAnalyzer = require('./sentimentAnalyzer');
const entityExtractor = require('./entityExtractor');
const signalGenerator = require('./signalGenerator');

// Initialize Twitter client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

const client = twitterClient.readOnly;

/**
 * List of popular crypto KOLs to track
 */
const DEFAULT_KOLS = [
  { id: '1526649889384277000', name: 'Vitalik Buterin', handle: 'VitalikButerin' },
  { id: '1060885250325061000', name: 'CZ Binance', handle: 'cz_binance' },
  { id: '867106811525210000', name: 'Charles Hoskinson', handle: 'IOHK_Charles' },
  { id: '951329744840818000', name: 'Justin Sun', handle: 'justinsuntron' },
  { id: '1224083161724350000', name: 'Hayden Adams', handle: 'haydenzadams' },
  { id: '1187859458742260000', name: 'Sam Bankman-Fried', handle: 'SBF_FTX' },
  { id: '1257269693516410000', name: 'Su Zhu', handle: 'zhusu' },
  { id: '1069285806583900000', name: 'Arthur Hayes', handle: 'CryptoHayes' },
  { id: '1177453584361120000', name: 'Do Kwon', handle: 'stablekwon' },
  { id: '1173302194540960000', name: 'Coin Bureau', handle: 'coinbureau' }
];

/**
 * Get tweets from a specific KOL by ID
 * @param {string} kolId - Twitter user ID
 * @param {number} limit - Maximum number of tweets to fetch
 * @returns {Promise<Array>} - Processed tweets
 */
exports.getTweetsByKOL = async (kolId, limit = 10) => {
  try {
    // Fetch tweets
    const timeline = await client.v2.userTimeline(kolId, {
      max_results: limit,
      'tweet.fields': ['created_at', 'public_metrics', 'entities', 'context_annotations'],
      'user.fields': ['profile_image_url', 'verified', 'public_metrics'],
      'expansions': ['author_id']
    });
    
    const tweets = timeline.data.data || [];
    const users = timeline.data.includes?.users || [];
    
    // Get author info
    const author = users.find(user => user.id === kolId);
    
    if (!tweets.length || !author) {
      return [];
    }
    
    // Process tweets
    const processedTweets = await Promise.all(tweets.map(async tweet => {
      // Analyze sentiment
      const sentimentResult = await sentimentAnalyzer.analyze(tweet.text);
      
      // Extract entities
      const entities = await entityExtractor.extract(tweet.text);
      
      // Generate trading signal
      const tradingSignal = await signalGenerator.generateSignal(
        tweet.text, 
        sentimentResult,
        entities,
        author.public_metrics.followers_count
      );
      
      // Save to database
      const newNews = new News({
        source: 'twitter',
        sourceId: tweet.id,
        author: {
          name: author.name,
          id: author.id,
          profileUrl: `https://twitter.com/${author.username}`,
          followerCount: author.public_metrics.followers_count,
          isVerified: author.verified
        },
        content: tweet.text,
        publishedAt: new Date(tweet.created_at),
        sentiment: sentimentResult,
        entities,
        tradingSignal,
        impactLevel: determineImpactLevel(author.public_metrics.followers_count, tweet.public_metrics.like_count),
        engagementMetrics: {
          likes: tweet.public_metrics.like_count,
          comments: tweet.public_metrics.reply_count,
          shares: tweet.public_metrics.retweet_count,
          views: tweet.public_metrics.impression_count || 0
        }
      });
      
      // Check if already exists
      const existingNews = await News.findOne({ 
        source: 'twitter',
        sourceId: tweet.id
      });
      
      if (!existingNews) {
        await newNews.save();
      }
      
      return newNews;
    }));
    
    return processedTweets;
    
  } catch (error) {
    console.error(`Error fetching tweets from KOL ${kolId}:`, error);
    return [];
  }
};

/**
 * Get news from popular KOLs
 * @param {number} limit - Maximum number of tweets to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} - Tweets from popular KOLs
 */
exports.getPopularKOLNews = async (limit = 20, offset = 0) => {
  try {
    // Get from database
    const popularNews = await News.find({
      source: 'twitter',
      'author.id': { $in: DEFAULT_KOLS.map(kol => kol.id) }
    })
    .sort({ publishedAt: -1 })
    .skip(parseInt(offset))
    .limit(parseInt(limit));
    
    // If not enough in database, fetch from Twitter
    if (popularNews.length < limit) {
      const fetchPromises = DEFAULT_KOLS.map(kol => 
        exports.getTweetsByKOL(kol.id, Math.ceil(limit / DEFAULT_KOLS.length))
      );
      
      await Promise.all(fetchPromises);
      
      // Re-fetch from database
      return await News.find({
        source: 'twitter',
        'author.id': { $in: DEFAULT_KOLS.map(kol => kol.id) }
      })
      .sort({ publishedAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));
    }
    
    return popularNews;
    
  } catch (error) {
    console.error('Error getting popular KOL news:', error);
    return [];
  }
};

/**
 * Start streaming tweets from KOLs
 * @returns {Object} - Twitter stream object
 */
exports.startKOLStream = async () => {
  try {
    const stream = await client.v2.searchStream({
      'tweet.fields': ['created_at', 'public_metrics', 'entities', 'context_annotations'],
      'user.fields': ['profile_image_url', 'verified', 'public_metrics'],
      'expansions': ['author_id']
    });
    
    stream.on('data', async data => {
      const tweet = data.data;
      const user = data.includes?.users?.[0];
      
      // Check if from a tracked KOL or has crypto keywords
      const isFromKOL = DEFAULT_KOLS.some(kol => kol.id === user?.id);
      const hasCryptoKeywords = containsCryptoKeywords(tweet.text);
      
      if (isFromKOL || hasCryptoKeywords) {
        // Analyze sentiment
        const sentimentResult = await sentimentAnalyzer.analyze(tweet.text);
        
        // Extract entities
        const entities = await entityExtractor.extract(tweet.text);
        
        // Generate trading signal
        const tradingSignal = await signalGenerator.generateSignal(
          tweet.text, 
          sentimentResult,
          entities,
          user?.public_metrics.followers_count || 0
        );
        
        // Save to database
        const newNews = new News({
          source: 'twitter',
          sourceId: tweet.id,
          author: {
            name: user?.name || 'Unknown',
            id: user?.id || 'unknown',
            profileUrl: user ? `https://twitter.com/${user.username}` : null,
            followerCount: user?.public_metrics.followers_count || 0,
            isVerified: user?.verified || false
          },
          content: tweet.text,
          publishedAt: new Date(tweet.created_at),
          sentiment: sentimentResult,
          entities,
          tradingSignal,
          impactLevel: determineImpactLevel(
            user?.public_metrics.followers_count || 0, 
            tweet.public_metrics.like_count || 0
          ),
          engagementMetrics: {
            likes: tweet.public_metrics.like_count || 0,
            comments: tweet.public_metrics.reply_count || 0,
            shares: tweet.public_metrics.retweet_count || 0,
            views: tweet.public_metrics.impression_count || 0
          }
        });
        
        await newNews.save();
        
        console.log(`Saved tweet from ${user?.name || 'Unknown'}: ${tweet.text.substring(0, 50)}...`);
      }
    });
    
    stream.on('error', error => {
      console.error('Twitter stream error:', error);
    });
    
    return stream;
    
  } catch (error) {
    console.error('Error starting Twitter stream:', error);
    throw error;
  }
};

/**
 * Search for tweets containing specific keywords
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of tweets to fetch
 * @returns {Promise<Array>} - Matching tweets
 */
exports.searchTweets = async (query, limit = 20) => {
  try {
    const result = await client.v2.search(query, {
      max_results: limit,
      'tweet.fields': ['created_at', 'public_metrics', 'entities', 'context_annotations'],
      'user.fields': ['profile_image_url', 'verified', 'public_metrics'],
      'expansions': ['author_id']
    });
    
    const tweets = result.data.data || [];
    const users = result.data.includes?.users || [];
    
    if (!tweets.length) {
      return [];
    }
    
    // Process tweets
    const processedTweets = await Promise.all(tweets.map(async tweet => {
      const author = users.find(user => user.id === tweet.author_id);
      
      if (!author) {
        return null;
      }
      
      // Analyze sentiment
      const sentimentResult = await sentimentAnalyzer.analyze(tweet.text);
      
      // Extract entities
      const entities = await entityExtractor.extract(tweet.text);
      
      // Generate trading signal
      const tradingSignal = await signalGenerator.generateSignal(
        tweet.text, 
        sentimentResult,
        entities,
        author.public_metrics.followers_count
      );
      
      // Save to database
      const newNews = new News({
        source: 'twitter',
        sourceId: tweet.id,
        author: {
          name: author.name,
          id: author.id,
          profileUrl: `https://twitter.com/${author.username}`,
          followerCount: author.public_metrics.followers_count,
          isVerified: author.verified
        },
        content: tweet.text,
        publishedAt: new Date(tweet.created_at),
        sentiment: sentimentResult,
        entities,
        tradingSignal,
        impactLevel: determineImpactLevel(author.public_metrics.followers_count, tweet.public_metrics.like_count),
        engagementMetrics: {
          likes: tweet.public_metrics.like_count,
          comments: tweet.public_metrics.reply_count,
          shares: tweet.public_metrics.retweet_count,
          views: tweet.public_metrics.impression_count || 0
        }
      });
      
      // Check if already exists
      const existingNews = await News.findOne({ 
        source: 'twitter',
        sourceId: tweet.id
      });
      
      if (!existingNews) {
        await newNews.save();
      }
      
      return newNews;
    }));
    
    return processedTweets.filter(Boolean);
    
  } catch (error) {
    console.error(`Error searching tweets with query "${query}":`, error);
    return [];
  }
};

/**
 * Determine impact level based on follower count and engagement
 * @param {number} followerCount - Author's follower count
 * @param {number} likeCount - Tweet like count
 * @returns {string} - Impact level (high, medium, low)
 */
function determineImpactLevel(followerCount, likeCount) {
  if (followerCount > 1000000 || likeCount > 10000) {
    return 'high';
  } else if (followerCount > 100000 || likeCount > 1000) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Check if text contains crypto keywords
 * @param {string} text - Text to check
 * @returns {boolean} - Whether text contains crypto keywords
 */
function containsCryptoKeywords(text) {
  const cryptoKeywords = [
    'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'blockchain', 'defi', 
    'nft', 'altcoin', 'token', 'binance', 'coinbase', 'mining', 'wallet',
    'hodl', 'bullish', 'bearish', 'pump', 'dump', 'moon', 'dip', 'ath',
    'stablecoin', 'usdt', 'usdc', 'smart contract', 'solana', 'polygon',
    'avalanche', 'polkadot', 'cardano', 'ripple', 'xrp', 'defi', 'gamefi',
    'metaverse', 'web3', 'dao', 'yield farming', 'staking', 'airdrop'
  ];
  
  const lowerText = text.toLowerCase();
  return cryptoKeywords.some(keyword => lowerText.includes(keyword));
} 