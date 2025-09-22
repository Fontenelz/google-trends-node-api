import { createClient } from "redis";

const client = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

client.on("error", (err) => console.error("Redis Client Error", err));
client.connect();

export default client;