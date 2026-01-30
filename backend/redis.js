import IORedis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();
// The connection string from Upstash

const REDIS_URL = process.env.REDIS_URL;
// Create a new Redis client instance
console.log('🔄 Connecting to Redis...',REDIS_URL);
export const redisClient = new IORedis(REDIS_URL, {
  tls: {},
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

// Check if the Redis client is connected and handle errors
redisClient.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('ready', () => {
  console.log('✅ Redis is ready to use');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

redisClient.on('close', () => {
  console.log('❗ Redis connection closed');
});

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

redisClient.on('end', () => {
  console.log('🔴 Redis connection ended');
});

export const redisConfig = {
  url: REDIS_URL,
};
