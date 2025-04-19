// This file will be loaded by Jest before running tests
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const redis = require('redis-mock');
const { promisify } = require('util');
require('dotenv').config({ path: '.env.test' });

let mongoServer;

beforeAll(async () => {
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to in-memory database
  await mongoose.connect(mongoUri);
  
  // Mock Redis client
  global.redisClient = redis.createClient();
  
  // Promisify Redis commands
  global.redisGet = promisify(global.redisClient.get).bind(global.redisClient);
  global.redisSet = promisify(global.redisClient.set).bind(global.redisClient);
  global.redisDel = promisify(global.redisClient.del).bind(global.redisClient);
  
  // Mock Twitter client
  jest.mock('twitter-api-v2', () => {
    return {
      TwitterApi: jest.fn().mockImplementation(() => {
        return {
          readOnly: {
            v2: {
              userTimeline: jest.fn().mockResolvedValue({
                data: {
                  data: [],
                  includes: { users: [] }
                }
              }),
              search: jest.fn().mockResolvedValue({
                data: {
                  data: [],
                  includes: { users: [] }
                }
              }),
              searchStream: jest.fn().mockResolvedValue({
                on: jest.fn()
              })
            }
          }
        };
      })
    };
  });
});

afterAll(async () => {
  // Close MongoDB connection
  await mongoose.disconnect();
  
  // Stop MongoDB Memory Server
  await mongoServer.stop();
  
  // Close Redis client
  global.redisClient.quit();
}); 