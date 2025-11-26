/**
 * Kafka Topics Configuration
 * Centralized topic definitions for the Airbnb platform
 */

module.exports = {
  // Booking events
  BOOKING_CREATED: 'booking-created',
  BOOKING_ACCEPTED: 'booking-accepted',
  BOOKING_CANCELLED: 'booking-cancelled',
  BOOKING_REJECTED: 'booking-rejected',
  
  // Notification events
  NOTIFICATION_SEND: 'notification-send',
  
  // Property events (future use)
  PROPERTY_CREATED: 'property-created',
  PROPERTY_UPDATED: 'property-updated',
  
  // User events (future use)
  USER_REGISTERED: 'user-registered',
  USER_UPDATED: 'user-updated'
};

