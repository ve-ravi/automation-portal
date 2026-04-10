export const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0", 10)
};

export const redisUrl = process.env.REDIS_URL || 
  `redis://${redisConfig.password ? `:${redisConfig.password}@` : ""}${redisConfig.host}:${redisConfig.port}/${redisConfig.db}`;
