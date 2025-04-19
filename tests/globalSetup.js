// This file runs once before all tests
require('dotenv').config({ path: '.env.test' });

module.exports = async () => {
  console.log('\nSetting up test environment...');
  
  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret';
  process.env.JWT_EXPIRATION = '1h';
  
  // Set mock Twitter API keys
  process.env.TWITTER_API_KEY = 'test_api_key';
  process.env.TWITTER_API_SECRET = 'test_api_secret';
  process.env.TWITTER_ACCESS_TOKEN = 'test_access_token';
  process.env.TWITTER_ACCESS_SECRET = 'test_access_secret';

  console.log('Test environment setup complete');
}; 