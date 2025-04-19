const axios = require('axios');

/**
 * Dictionary of crypto-related terms and their sentiment values
 * Values range from -1 (very negative) to 1 (very positive)
 */
const CRYPTO_SENTIMENT_DICTIONARY = {
  // Positive terms
  'bullish': 0.8,
  'moon': 0.9,
  'mooning': 0.9,
  'ath': 0.7,
  'all-time high': 0.7,
  'rally': 0.6,
  'surge': 0.7,
  'pump': 0.6,
  'gains': 0.6,
  'profit': 0.7,
  'buy': 0.5,
  'buying': 0.5,
  'adoption': 0.6,
  'integrating': 0.5,
  'partnership': 0.6,
  'breakthrough': 0.7,
  'innovation': 0.6,
  'progress': 0.5,
  'launching': 0.6,
  'release': 0.5,
  'update': 0.4,
  'upgrade': 0.6,
  'success': 0.7,
  'growing': 0.5,
  'growth': 0.5,
  'institutional': 0.5,
  'accumulation': 0.6,
  'hodl': 0.6,
  'hodling': 0.6,
  'staking': 0.5,
  'yield': 0.5,
  'reward': 0.6,
  'airdrop': 0.7,
  
  // Negative terms
  'bearish': -0.8,
  'crash': -0.9,
  'dump': -0.8,
  'dumping': -0.8,
  'sell': -0.5,
  'selling': -0.5,
  'dip': -0.4,
  'correction': -0.5,
  'drop': -0.6,
  'falling': -0.6,
  'loss': -0.7,
  'losing': -0.7,
  'scam': -0.9,
  'hack': -0.8,
  'hacked': -0.8,
  'exploit': -0.8,
  'vulnerability': -0.7,
  'ban': -0.8,
  'regulation': -0.6,
  'sec': -0.5,
  'lawsuit': -0.7,
  'investigation': -0.6,
  'fraud': -0.9,
  'ponzi': -0.9,
  'rug pull': -0.9,
  'rugpull': -0.9,
  'bankruptcy': -0.9,
  'liquidation': -0.8,
  'liquidated': -0.8,
  'fear': -0.7,
  'panic': -0.8,
  'bubble': -0.7,
  'risk': -0.5,
  'volatile': -0.4,
  'volatility': -0.4
};

/**
 * Analyze sentiment of a text
 * @param {string} text - Text to analyze
 * @returns {Object} - Sentiment analysis result
 */
exports.analyze = async (text) => {
  try {
    // For production, we would use a proper NLP service like Google Cloud NLP
    // or a pre-trained model, but for this implementation we'll use
    // a simple dictionary-based approach and simulate a more advanced analysis
    
    // Convert to lowercase for comparison
    const lowerText = text.toLowerCase();
    
    // Calculate sentiment score
    let sentimentScore = 0;
    let matchCount = 0;
    let matchedTerms = [];
    
    // Check for dictionary terms
    for (const [term, value] of Object.entries(CRYPTO_SENTIMENT_DICTIONARY)) {
      if (lowerText.includes(term)) {
        sentimentScore += value;
        matchCount++;
        matchedTerms.push(term);
      }
    }
    
    // Normalize score between -1 and 1
    let normalizedScore = 0;
    if (matchCount > 0) {
      normalizedScore = sentimentScore / matchCount;
    } else {
      // If no terms matched, perform a more basic analysis
      normalizedScore = basicSentimentAnalysis(lowerText);
    }
    
    // Determine sentiment category
    let category;
    if (normalizedScore > 0.1) {
      category = 'positive';
    } else if (normalizedScore < -0.1) {
      category = 'negative';
    } else {
      category = 'neutral';
    }
    
    // Calculate confidence based on match count and text length
    // More matches and longer text generally mean higher confidence
    const textLength = text.length;
    let confidence = Math.min(0.4 + (matchCount * 0.1) + (textLength / 1000), 0.95);
    
    // Return sentiment analysis result
    return {
      score: parseFloat(normalizedScore.toFixed(2)),
      category,
      confidence: parseFloat(confidence.toFixed(2))
    };
    
  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    
    // Return a neutral sentiment as fallback
    return {
      score: 0,
      category: 'neutral',
      confidence: 0.5
    };
  }
};

/**
 * Basic sentiment analysis when no crypto terms match
 * @param {string} text - Lowercase text to analyze
 * @returns {number} - Sentiment score between -1 and 1
 */
function basicSentimentAnalysis(text) {
  // List of positive and negative general words
  const positiveWords = [
    'good', 'great', 'excellent', 'amazing', 'awesome', 'nice', 'happy',
    'positive', 'success', 'successful', 'win', 'winning', 'better',
    'best', 'improve', 'improved', 'up', 'higher', 'rise', 'rising',
    'opportunity', 'opportunities', 'potential', 'promising', 'excited',
    'exciting', 'optimistic', 'confidence', 'confident', 'support',
    'supported', 'like', 'love', 'impressive', 'impressed', 'strong',
    'stronger', 'strength', 'benefit', 'benefits', 'advantage', 'advantages'
  ];
  
  const negativeWords = [
    'bad', 'terrible', 'awful', 'poor', 'horrible', 'sad', 'unhappy',
    'negative', 'fail', 'failed', 'failure', 'lose', 'losing', 'worse',
    'worst', 'decline', 'declined', 'down', 'lower', 'fall', 'falling',
    'problem', 'problems', 'issue', 'issues', 'risk', 'risks', 'risky',
    'concerned', 'concern', 'concerns', 'worry', 'worried', 'worrying',
    'disappointed', 'disappointing', 'disappointment', 'weak', 'weaker',
    'weakness', 'difficulty', 'difficult', 'challenge', 'challenging',
    'trouble', 'troubled', 'unfortunate', 'unfortunately', 'anxious'
  ];
  
  // Count occurrences of positive and negative words
  let positiveCount = 0;
  let negativeCount = 0;
  
  // Check for words with spaces around them to avoid partial matches
  const words = text.split(/\s+/);
  
  for (const word of words) {
    const cleanWord = word.replace(/[.,!?;:"']/g, ''); // Remove punctuation
    if (positiveWords.includes(cleanWord)) {
      positiveCount++;
    } else if (negativeWords.includes(cleanWord)) {
      negativeCount++;
    }
  }
  
  // Calculate basic sentiment score
  const totalCount = positiveCount + negativeCount;
  if (totalCount === 0) {
    return 0; // Neutral if no sentiment words found
  }
  
  return (positiveCount - negativeCount) / totalCount;
}

/**
 * Analyze token-specific sentiment in news
 * @param {string} token - Token symbol or name
 * @param {Date} startDate - Start date for analysis
 * @param {Date} endDate - End date for analysis
 * @returns {Object} - Token sentiment analysis
 */
exports.analyzeTokenSentiment = async (token, startDate, endDate) => {
  try {
    // Query database for news mentioning the token
    const News = require('../../models/News');
    
    const tokenNews = await News.find({
      publishedAt: { $gte: startDate, $lte: endDate },
      $or: [
        { 'entities.name': token, 'entities.type': 'token' },
        { content: { $regex: token, $options: 'i' } },
        { title: { $regex: token, $options: 'i' } }
      ]
    });
    
    if (tokenNews.length === 0) {
      return {
        token,
        period: {
          start: startDate,
          end: endDate
        },
        sentiment: {
          average: 0,
          category: 'neutral',
          confidence: 0
        },
        sources: [],
        newsCount: 0
      };
    }
    
    // Calculate average sentiment score
    let totalScore = 0;
    let totalConfidence = 0;
    const sources = new Set();
    
    tokenNews.forEach(news => {
      totalScore += news.sentiment.score;
      totalConfidence += news.sentiment.confidence;
      sources.add(news.source);
    });
    
    const averageScore = totalScore / tokenNews.length;
    const averageConfidence = totalConfidence / tokenNews.length;
    
    // Determine overall sentiment category
    let category;
    if (averageScore > 0.1) {
      category = 'positive';
    } else if (averageScore < -0.1) {
      category = 'negative';
    } else {
      category = 'neutral';
    }
    
    // Count news by sentiment category
    const sentimentDistribution = {
      positive: tokenNews.filter(news => news.sentiment.category === 'positive').length,
      neutral: tokenNews.filter(news => news.sentiment.category === 'neutral').length,
      negative: tokenNews.filter(news => news.sentiment.category === 'negative').length
    };
    
    // Analyze sentiment trend
    const dayGroups = {};
    tokenNews.forEach(news => {
      const dateKey = news.publishedAt.toISOString().split('T')[0];
      if (!dayGroups[dateKey]) {
        dayGroups[dateKey] = [];
      }
      dayGroups[dateKey].push(news);
    });
    
    const trend = Object.keys(dayGroups).sort().map(date => {
      const dayNews = dayGroups[date];
      const dayAvg = dayNews.reduce((sum, news) => sum + news.sentiment.score, 0) / dayNews.length;
      return {
        date,
        sentiment: parseFloat(dayAvg.toFixed(2)),
        newsCount: dayNews.length
      };
    });
    
    // Return comprehensive sentiment analysis
    return {
      token,
      period: {
        start: startDate,
        end: endDate
      },
      sentiment: {
        average: parseFloat(averageScore.toFixed(2)),
        category,
        confidence: parseFloat(averageConfidence.toFixed(2))
      },
      distribution: sentimentDistribution,
      sources: Array.from(sources),
      newsCount: tokenNews.length,
      trend,
      impactNews: tokenNews
        .filter(news => news.impactLevel === 'high')
        .sort((a, b) => b.publishedAt - a.publishedAt)
        .slice(0, 5)
        .map(news => ({
          id: news._id,
          source: news.source,
          author: news.author.name,
          content: news.content.substring(0, 100) + (news.content.length > 100 ? '...' : ''),
          sentiment: news.sentiment,
          publishedAt: news.publishedAt
        }))
    };
    
  } catch (error) {
    console.error(`Error analyzing sentiment for token ${token}:`, error);
    throw error;
  }
}; 