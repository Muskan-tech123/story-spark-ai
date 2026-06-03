import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  lazyConnect: true,
  enableOfflineQueue: false,
  retryStrategy: () => null, // stop retrying — just fail silently
});

redis.on("error", () => {
  // suppress connection errors — review caching will fall back to DB
});

export default redis;
