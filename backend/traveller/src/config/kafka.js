const { Kafka } = require('kafkajs');

// Kafka configuration
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'traveller-backend';

// Create Kafka instance
const kafka = new Kafka({
  clientId: KAFKA_CLIENT_ID,
  brokers: [KAFKA_BROKER],
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

// Create producer instance (singleton)
let producer = null;

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
          source: 'traveller-backend'
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
  getProducer,
  disconnectProducer,
  sendEvent
};

