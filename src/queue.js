import { Queue } from "bullmq";

import { redisOptions } from "./redis.js";

/* Queues */
export const rechargeQueue = new Queue("rechargeQueue", {
  connection: redisOptions,
});

