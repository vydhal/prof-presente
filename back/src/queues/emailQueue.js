const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const EMAIL_QUEUE = "email";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let queue = null;

const createRedisConnection = () => new IORedis(REDIS_URL, { maxRetriesPerRequest: null });

const getEmailQueue = () => {
  if (!queue) {
    queue = new Queue(EMAIL_QUEUE, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 8,
        backoff: { type: "exponential", delay: 60000 },
        removeOnComplete: 500,
        removeOnFail: 1000,
      },
    });
  }
  return queue;
};

const enqueueEmail = async ({ attachments, ...options }) => {
  const serializedAttachments = attachments?.map((attachment) =>
    Buffer.isBuffer(attachment.content)
      ? { ...attachment, content: attachment.content.toString("base64"), encoding: "base64" }
      : attachment
  );

  await getEmailQueue().add("send-email", { ...options, attachments: serializedAttachments });
};

module.exports = { EMAIL_QUEUE, REDIS_URL, createRedisConnection, enqueueEmail };
