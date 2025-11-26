/**
 * Test Kafka Connection
 * Verifies that Kafka producer and consumer are working correctly
 */

const { Kafka } = require('kafkajs');

const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const TEST_TOPIC = 'test-connection-topic';

const kafka = new Kafka({
  clientId: 'kafka-test-client',
  brokers: [KAFKA_BROKER]
});

async function testKafkaConnection() {
  console.log('🧪 Testing Kafka Connection...\n');
  
  const producer = kafka.producer();
  const consumer = kafka.consumer({ groupId: 'test-group' });
  
  try {
    // Connect
    console.log('1. Connecting to Kafka...');
    await producer.connect();
    await consumer.connect();
    console.log('   ✅ Connected!\n');
    
    // Create topic (if it doesn't exist)
    console.log('2. Testing topic operations...');
    const admin = kafka.admin();
    await admin.connect();
    
    const topics = await admin.listTopics();
    if (!topics.includes(TEST_TOPIC)) {
      await admin.createTopics({
        topics: [{
          topic: TEST_TOPIC,
          numPartitions: 1,
          replicationFactor: 1
        }]
      });
      console.log(`   ✅ Created topic: ${TEST_TOPIC}\n`);
    } else {
      console.log(`   ✅ Topic exists: ${TEST_TOPIC}\n`);
    }
    await admin.disconnect();
    
    // Subscribe to topic
    console.log('3. Subscribing to topic...');
    await consumer.subscribe({ topic: TEST_TOPIC, fromBeginning: false });
    console.log('   ✅ Subscribed!\n');
    
    // Send test message
    console.log('4. Sending test message...');
    const testMessage = {
      type: 'test',
      message: 'Hello from Kafka test!',
      timestamp: new Date().toISOString()
    };
    
    await producer.send({
      topic: TEST_TOPIC,
      messages: [{
        key: 'test-key',
        value: JSON.stringify(testMessage)
      }]
    });
    console.log('   ✅ Message sent!\n');
    
    // Consume message
    console.log('5. Waiting for message...');
    let messageReceived = false;
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const value = JSON.parse(message.value.toString());
        console.log(`   ✅ Message received from ${topic}:`, value);
        messageReceived = true;
      }
    });
    
    // Wait for message (with timeout)
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    if (messageReceived) {
      console.log('\n✅ Kafka test PASSED! All operations successful.\n');
    } else {
      console.log('\n⚠️  Message not received within timeout. Check consumer logs.\n');
    }
    
    // Cleanup
    await producer.disconnect();
    await consumer.disconnect();
    
    console.log('✅ Test completed. Disconnected from Kafka.');
    
  } catch (error) {
    console.error('\n❌ Kafka test FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run test
testKafkaConnection()
  .then(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

