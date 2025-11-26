const { Kafka } = require('kafkajs');

// Kafka configuration
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'host-backend';

// Create Kafka instance
const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: [KAFKA_BROKER],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

// Create consumer instance (singleton)
let consumer = null;
// Create producer instance (singleton)
let producer = null;

/**
 * Get or create Kafka consumer
 * @param {string} groupId - Consumer group ID
 * @returns {Promise<Consumer>}
 */
async function getConsumer(groupId = 'host-backend-group') {
  if (!consumer) {
    consumer = kafka.consumer({ groupId });
    await consumer.connect();
    console.log('✅ Kafka consumer connected');
  }
  return consumer;
}

/**
 * Disconnect consumer (for graceful shutdown)
 */
async function disconnectConsumer() {
  if (consumer) {
    await consumer.disconnect();
    consumer = null;
    console.log('✅ Kafka consumer disconnected');
  }
}

// Topic handlers registry
const topicHandlers = new Map();
let consumerRunning = false;

/**
 * Subscribe to a topic and register a message handler
 * @param {string} topic - Topic name
 * @param {Function} messageHandler - Handler function for messages
 */
async function subscribeToTopic(topic, messageHandler) {
  try {
    const kafkaConsumer = await getConsumer();
    
    // Register handler for this topic
    topicHandlers.set(topic, messageHandler);
    
    // Subscribe to topic
    await kafkaConsumer.subscribe({ topic, fromBeginning: false });
    console.log(`✅ Subscribed to topic: ${topic}`);
    
    // Start consumer if not already running
    if (!consumerRunning) {
      consumerRunning = true;
      await kafkaConsumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const event = JSON.parse(message.value.toString());
            console.log(`📨 Received event from ${topic}:`, event.type || 'unknown');
            
            // Get handler for this topic
            const handler = topicHandlers.get(topic);
            if (handler) {
              await handler(event, { topic, partition, offset: message.offset });
            } else {
              console.warn(`⚠️  No handler registered for topic: ${topic}`);
            }
          } catch (error) {
            console.error(`❌ Error processing message from ${topic}:`, error);
          }
        }
      });
      console.log('✅ Kafka consumer started');
    }
  } catch (error) {
    console.error(`❌ Failed to subscribe to topic ${topic}:`, error);
    throw error;
  }
}

/**
 * Get or create Kafka producer
 * @returns {Promise<Producer>}
 */
async function getProducer() {
  if (!producer) {
    producer = kafka.producer();
    await producer.connect();
    console.log('✅ Kafka producer connected');
  }
  return producer;
}

/**
 * Disconnect producer (for graceful shutdown)
 */
async function disconnectProducer() {
  if (producer) {
    await producer.disconnect();
    producer = null;
    console.log('✅ Kafka producer disconnected');
  }
}

/**
 * Send event to Kafka topic
 * @param {string} topic - Topic name
 * @param {Object} event - Event payload
 * @param {string} key - Optional partition key
 */
async function sendEvent(topic, event, key = null) {
  try {
    const kafkaProducer = await getProducer();
    const message = {
      topic,
      messages: [{
        key: key || null,
        value: JSON.stringify({
          ...event,
          timestamp: new Date().toISOString(),
          source: 'host-backend'
        })
      }]
    };
    
    await kafkaProducer.send(message);
    console.log(`✅ Event sent to topic ${topic}:`, event.type || 'unknown');
  } catch (error) {
    console.error(`❌ Failed to send event to topic ${topic}:`, error);
    throw error;
  }
}

module.exports = {
  kafka,
  getConsumer,
  disconnectConsumer,
  subscribeToTopic,
  getProducer,
  disconnectProducer,
  sendEvent
};

