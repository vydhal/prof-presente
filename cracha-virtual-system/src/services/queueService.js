const amqp = require('amqplib');

let connection = null;
let channel = null;

const connectRabbitMQ = async () => {
  if (connection && channel) return channel;

  try {
    const amqpUrl = process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672';
    console.log(`Connecting to RabbitMQ at ${amqpUrl}...`);
    
    connection = await amqp.connect(amqpUrl);
    channel = await connection.createChannel();
    
    console.log('RabbitMQ Connected Successfully');
    
    // Setup queues
    await channel.assertQueue('email_queue', { durable: true });
    
    connection.on('error', (err) => {
      console.error('RabbitMQ connection error', err);
      connection = null;
      channel = null;
    });

    return channel;
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    // Retry logic could be added here, but for now we let it fail so pm2/docker restarts
    return null;
  }
};

const publishToQueue = async (queue, message) => {
  try {
    if (!channel) await connectRabbitMQ();
    if (!channel) throw new Error('RabbitMQ channel not available');

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true
    });
    console.log(`Message sent to queue ${queue}`);
    return true;
  } catch (error) {
    console.error(`Error publishing to queue ${queue}:`, error);
    return false;
  }
};

const consumeQueue = async (queue, callback) => {
  try {
    if (!channel) await connectRabbitMQ();
    if (!channel) throw new Error('RabbitMQ channel not available');

    await channel.consume(queue, async (msg) => {
      if (msg !== null) {
        try {
          const content = JSON.parse(msg.content.toString());
          await callback(content);
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          // Optionally nack to requeue: channel.nack(msg);
          // For now, we ack to avoid poison messages blocking the queue 
          // or we could channel.nack(msg, false, false) to discard
          channel.ack(msg); 
        }
      }
    });
    console.log(`Listening on queue ${queue}`);
  } catch (error) {
    console.error(`Error consuming queue ${queue}:`, error);
  }
};

module.exports = {
  connectRabbitMQ,
  publishToQueue,
  consumeQueue
};
