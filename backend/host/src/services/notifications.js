/**
 * Notification Service
 * Handles notifications for booking events
 */

const { getDB } = require('../db-mongodb');
const { ObjectId } = require('mongodb');
const TOPICS = require('../config/kafka-topics');

/**
 * Send email notification (placeholder - can be integrated with email service)
 */
async function sendEmailNotification(to, subject, body) {
  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  console.log(`📧 [EMAIL] To: ${to}`);
  console.log(`📧 [EMAIL] Subject: ${subject}`);
  console.log(`📧 [EMAIL] Body: ${body}`);
  console.log('📧 [EMAIL] ---');
  
  // In production, this would send an actual email
  return Promise.resolve();
}

/**
 * Handle booking-created event
 */
async function handleBookingCreated(event) {
  const { owner_id, traveler_name, traveler_email, property_id, start_date, end_date, total_price } = event;
  
  // Notify property owner about new booking request
  const subject = `New Booking Request for Your Property`;
  const body = `
Hello,

You have received a new booking request from ${traveler_name} (${traveler_email}).

Booking Details:
- Check-in: ${new Date(start_date).toLocaleDateString()}
- Check-out: ${new Date(end_date).toLocaleDateString()}
- Total Price: $${total_price}

Please log in to your host dashboard to accept or decline this booking.

Best regards,
Airbnb Platform
  `.trim();
  
  // Fetch owner email from database
  try {
    const db = await getDB();
    const ownersCollection = db.collection('owners');
    const owner = await ownersCollection.findOne({ _id: new ObjectId(owner_id) });
    const ownerEmail = owner?.email || `owner-${owner_id}@example.com`;
    await sendEmailNotification(ownerEmail, subject, body);
  } catch (error) {
    console.error(`Failed to fetch owner email for ${owner_id}:`, error);
    // Fallback to placeholder
    await sendEmailNotification(`owner-${owner_id}@example.com`, subject, body);
  }
  
  console.log(`✅ Notification sent to owner ${owner_id} for booking ${event.booking_id}`);
}

/**
 * Handle booking-accepted event
 */
async function handleBookingAccepted(event) {
  const { traveler_email, traveler_name, property_id, start_date, end_date, total_price } = event;
  
  // Notify traveler that their booking was accepted
  const subject = `Your Booking Has Been Accepted! 🎉`;
  const body = `
Hello ${traveler_name},

Great news! Your booking has been accepted by the host.

Booking Details:
- Property ID: ${property_id}
- Check-in: ${new Date(start_date).toLocaleDateString()}
- Check-out: ${new Date(end_date).toLocaleDateString()}
- Total Price: $${total_price}

We're excited to host you! You'll receive more details closer to your check-in date.

Best regards,
Airbnb Platform
  `.trim();
  
  await sendEmailNotification(traveler_email, subject, body);
  
  console.log(`✅ Notification sent to traveler ${traveler_email} for booking ${event.booking_id}`);
}

/**
 * Handle booking-cancelled event
 */
async function handleBookingCancelled(event) {
  const { cancelled_by, traveler_email, traveler_name, owner_id, property_id, start_date, end_date } = event;
  
  if (cancelled_by === 'TRAVELER') {
    // Notify host that traveler cancelled
    const subject = `Booking Cancelled by Traveler`;
    const body = `
Hello,

The booking for your property has been cancelled by ${traveler_name}.

Cancelled Booking Details:
- Property ID: ${property_id}
- Check-in: ${new Date(start_date).toLocaleDateString()}
- Check-out: ${new Date(end_date).toLocaleDateString()}

The property is now available for those dates.

Best regards,
Airbnb Platform
    `.trim();
    
    // Fetch owner email from database
    try {
      const db = await getDB();
      const ownersCollection = db.collection('owners');
      const owner = await ownersCollection.findOne({ _id: new ObjectId(owner_id) });
      const ownerEmail = owner?.email || `owner-${owner_id}@example.com`;
      await sendEmailNotification(ownerEmail, subject, body);
    } catch (error) {
      console.error(`Failed to fetch owner email for ${owner_id}:`, error);
      // Fallback to placeholder
      await sendEmailNotification(`owner-${owner_id}@example.com`, subject, body);
    }
    console.log(`✅ Notification sent to owner ${owner_id} about cancellation by traveler`);
    
  } else if (cancelled_by === 'HOST') {
    // Notify traveler that host cancelled
    const subject = `Booking Cancelled by Host`;
    const body = `
Hello ${traveler_name},

We're sorry to inform you that your booking has been cancelled by the host.

Cancelled Booking Details:
- Property ID: ${property_id}
- Check-in: ${new Date(start_date).toLocaleDateString()}
- Check-out: ${new Date(end_date).toLocaleDateString()}

If you have any questions or need assistance finding alternative accommodations, please contact our support team.

Best regards,
Airbnb Platform
    `.trim();
    
    await sendEmailNotification(traveler_email, subject, body);
    console.log(`✅ Notification sent to traveler ${traveler_email} about cancellation by host`);
  }
}

/**
 * Initialize notification handlers for booking events
 */
async function initializeNotificationHandlers(subscribeToTopic) {
  try {
    // Subscribe to booking-created events
    await subscribeToTopic(TOPICS.BOOKING_CREATED, async (event) => {
      console.log('🔔 Processing booking-created notification...');
      await handleBookingCreated(event);
    });
    
    // Subscribe to booking-accepted events
    await subscribeToTopic(TOPICS.BOOKING_ACCEPTED, async (event) => {
      console.log('🔔 Processing booking-accepted notification...');
      await handleBookingAccepted(event);
    });
    
    // Subscribe to booking-cancelled events
    await subscribeToTopic(TOPICS.BOOKING_CANCELLED, async (event) => {
      console.log('🔔 Processing booking-cancelled notification...');
      await handleBookingCancelled(event);
    });
    
    console.log('✅ Notification handlers initialized for all booking events');
  } catch (error) {
    console.error('❌ Failed to initialize notification handlers:', error);
    throw error;
  }
}

module.exports = {
  handleBookingCreated,
  handleBookingAccepted,
  handleBookingCancelled,
  initializeNotificationHandlers,
  sendEmailNotification
};

