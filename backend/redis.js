import IORedis from 'ioredis';

// The connection string from Upstash

const REDIS_URL="rediss://default:AWRLAAIncDJiNmQ2MjYyZDgxNjg0N2I1YTA1MTQwZDk2YmZkMzhlNnAyMjU2NzU@primary-phoenix-25675.upstash.io:6379";

// Create a new Redis client instance
export const redisClient = new IORedis(REDIS_URL, {
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
