const { Worker, UnrecoverableError } = require("bullmq");
const { sendEmail } = require("../utils/email");
const { EMAIL_QUEUE, createRedisConnection } = require("../queues/emailQueue");

const isPermanentError = (error) => error.responseCode >= 500 && error.responseCode < 600;

const deserializeAttachments = (attachments) =>
  attachments?.map((attachment) =>
    attachment.encoding === "base64"
      ? { ...attachment, content: Buffer.from(attachment.content, "base64"), encoding: undefined }
      : attachment
  );

const startEmailJobWorker = () => {
  const worker = new Worker(
    EMAIL_QUEUE,
    async (job) => {
      const { attachments, ...options } = job.data;
      try {
        await sendEmail({ ...options, attachments: deserializeAttachments(attachments) });
      } catch (error) {
        if (isPermanentError(error)) throw new UnrecoverableError(error.message);
        throw error;
      }
    },
    { connection: createRedisConnection() }
  );

  worker.on("failed", (job, error) => {
    console.error(
      `[EMAIL-QUEUE] Job ${job?.id} falhou (tentativa ${job?.attemptsMade} de ${job?.opts?.attempts}): ${error.message}`
    );
  });

  return worker;
};

module.exports = { startEmailJobWorker };
