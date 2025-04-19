const sentimentAnalyzer = require('../../src/services/newsAnalysis/sentimentAnalyzer');

describe('Sentiment Analyzer', () => {
  describe('analyze()', () => {
    it('should return positive sentiment for bullish text', async () => {
      const text = 'Bitcoin is looking extremely bullish now, expecting a rally to new ATH soon!';
      const result = await sentimentAnalyzer.analyze(text);
      
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('confidence');
      expect(result.category).toBe('positive');
      expect(result.score).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
    
    it('should return negative sentiment for bearish text', async () => {
      const text = 'The market is crashing, Bitcoin might dump even further. Massive selloff incoming!';
      const result = await sentimentAnalyzer.analyze(text);
      
      expect(result.category).toBe('negative');
      expect(result.score).toBeLessThan(0);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
    
    it('should return neutral sentiment for neutral text', async () => {
      const text = 'Bitcoin price is currently at $50,000, trading sideways with low volume.';
      const result = await sentimentAnalyzer.analyze(text);
      
      expect(result.category).toBe('neutral');
      expect(result.score).toBeCloseTo(0, 1);
    });
    
    it('should handle empty text', async () => {
      const text = '';
      const result = await sentimentAnalyzer.analyze(text);
      
      expect(result.category).toBe('neutral');
      expect(result.score).toBe(0);
      expect(result.confidence).toBeLessThan(0.5);
    });
  });
  
  describe('analyzeTokenSentiment()', () => {
    // Mock News model
    beforeEach(() => {
      jest.mock('../../src/models/News', () => ({
        find: jest.fn().mockResolvedValue([
          {
            source: 'twitter',
            content: 'ETH looking very bullish today!',
            sentiment: {
              score: 0.8,
              category: 'positive',
              confidence: 0.9
            },
            impactLevel: 'high',
            publishedAt: new Date(),
            author: { name: 'Vitalik' }
          },
          {
            source: 'twitter',
            content: 'Mixed feelings about ETH price action',
            sentiment: {
              score: 0.1,
              category: 'neutral',
              confidence: 0.6
            },
            impactLevel: 'medium',
            publishedAt: new Date(),
            author: { name: 'CryptoAnalyst' }
          }
        ])
      }));
    });
    
    it('should return sentiment analysis for a token', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      
      // This is just a mock test since we've mocked the News model
      // In a real test, you'd set up test data in the database
      const result = await sentimentAnalyzer.analyzeTokenSentiment('ETH', startDate, endDate);
      
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('distribution');
      expect(result).toHaveProperty('sources');
      expect(result).toHaveProperty('newsCount');
      expect(result.token).toBe('ETH');
    });
  });
}); 