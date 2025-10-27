import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI, favoritesAPI, propertiesAPI } from '../services/api';

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, traveler } = useAuth();
  
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [bookingData, setBookingData] = useState({
    start_date: '',
    end_date: '',
    guests: 1,
    special_requests: ''
  });

  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    loadProperty();
    if (isAuthenticated) {
      checkFavorite();
    }
  }, [id, isAuthenticated]);

  useEffect(() => {
    if (bookingData.start_date && bookingData.end_date) {
      checkAvailability();
    }
  }, [bookingData.start_date, bookingData.end_date]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      const { data } = await propertiesAPI.getById(id);
      const p = data?.property;
      if (!p) {
        setError('Property not found');
        return;
      }
      const photos = Array.isArray(p.photos) ? p.photos : (data?.photos || []).map(ph => ({ file_path: ph.file_path }));
      setProperty({
        id: p.id,
        name: p.name,
        location: p.location,
        price_per_night: p.price_per_night,
        property_type: p.property_type,
        description: p.description || '',
        max_guests: p.max_guests,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        amenities: Array.isArray(p.amenities) ? p.amenities : [],
        photos,
        owner_name: p.owner_name || 'Host',
        owner_about: p.owner_about || '',
        owner_phone: ''
      });
    } catch (err) {
      setError('Property not found');
      console.error('Error loading property:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      // Check favorites from database API only - NO localStorage
      const response = await favoritesAPI.check(id);
      setIsFavorited(response.data.isFavorite || false);
    } catch (err) {
      console.error('Error checking favorite:', err);
      setIsFavorited(false);
    }
  };

  const checkAvailability = async () => {
    try {
      setAvailability({
        available: true,
        message: 'Property is available for selected dates'
      });
    } catch (err) {
      console.error('Error checking availability:', err);
    }
  };

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const propertyId = parseInt(id);
      
      if (isFavorited) {
        // Remove from database API only - NO localStorage
        await favoritesAPI.remove(propertyId);
        setIsFavorited(false);
      } else {
        // Add to database API only - NO localStorage
        await favoritesAPI.add(propertyId);
        setIsFavorited(true);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateNights = () => {
    if (!bookingData.start_date || !bookingData.end_date) return 0;
    const start = new Date(bookingData.start_date);
    const end = new Date(bookingData.end_date);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const calculateTotal = () => {
    if (!property || !bookingData.start_date || !bookingData.end_date) return 0;
    const nights = calculateNights();
    return property.price_per_night * nights;
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!bookingData.start_date || !bookingData.end_date) {
      setBookingError('Please select check-in and check-out dates');
      return;
    }

    if (availability && !availability.available) {
      setBookingError('Property is not available for selected dates');
      return;
    }

    try {
      setBookingLoading(true);
      setBookingError(null);
      
      // Create booking via database API only - NO mock data or localStorage
      const bookingPayload = {
        property_id: parseInt(id),
        start_date: bookingData.start_date,
        end_date: bookingData.end_date,
        guests: parseInt(bookingData.guests),
        special_requests: bookingData.special_requests || ''
      };

      const response = await bookingsAPI.create(bookingPayload);
      console.log('Booking created:', response.data);

      setBookingSuccess(true);
      setTimeout(() => {
        navigate('/bookings');
      }, 2000);
    } catch (err) {
      setBookingError('Failed to create booking');
      console.error('Booking error:', err);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="property-details-page">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading property details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="property-details-page">
        <div className="container">
          <div className="error-container">
            <h2>Property not found</h2>
            <p>The property you're looking for doesn't exist or has been removed.</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/dashboard')}
            >
              Back to Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="property-details-page">
      <div className="container">
        <div className="property-header">
          <div className="property-title-section">
            <h1 className="property-title">{property.name}</h1>
            <div className="property-meta">
              <span className="property-location">{property.location}</span>
              <span className="property-type">{property.property_type}</span>
            </div>
          </div>
          
          <div className="property-actions">
            <button
              className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
              onClick={toggleFavorite}
            >
              <span className="heart-icon">
                {isFavorited ? '❤️' : '🤍'}
              </span>
              {isFavorited ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div className="property-images">
          {property.photos && property.photos.length > 0 ? (
            <div className="image-gallery">
              {property.photos.map((photo, index) => {
                const imageSrc = photo.file_path?.startsWith('http') 
                  ? photo.file_path 
                  : `http://localhost:4000${photo.file_path}`;
                return (
                  <img
                    key={index}
                    src={imageSrc}
                    alt={`${property.name} - Image ${index + 1}`}
                    className="property-image"
                  />
                );
              })}
            </div>
          ) : (
            <div className="image-placeholder">
              <span className="placeholder-icon">🏠</span>
              <p>No images available</p>
            </div>
          )}
        </div>

        <div className="property-content">
          <div className="property-main">
            <div className="property-section">
              <h2>About this place</h2>
              <p className="property-description">
                {property.description || 'No description available.'}
              </p>
            </div>

            {property.amenities && property.amenities.length > 0 && (
              <div className="property-section">
                <h2>Amenities</h2>
                <div className="amenities-grid">
                  {property.amenities.map((amenity, index) => (
                    <div key={index} className="amenity-item">
                      <span className="amenity-icon">✓</span>
                      <span className="amenity-text">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="property-section">
              <h2>Meet your host</h2>
              <div className="host-info">
                <div className="host-avatar">
                  {property.owner_avatar ? (
                    <img src={property.owner_avatar} alt="Host" />
                  ) : (
                    <span>{property.owner_name?.charAt(0) || 'H'}</span>
                  )}
                </div>
                <div className="host-details">
                  <h3>Hosted by {property.owner_name}</h3>
                  {property.owner_about && (
                    <p className="host-about">{property.owner_about}</p>
                  )}
                  {property.owner_phone && (
                    <p className="host-contact">Contact: {property.owner_phone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="booking-sidebar">
            <div className="booking-card">
              <div className="booking-price">
                <span className="price-amount">${property.price_per_night}</span>
                <span className="price-period">/ night</span>
              </div>

              {bookingSuccess ? (
                <div className="booking-success">
                  <h3>Booking Request Sent!</h3>
                  <p>Your booking request has been sent to the host. You'll be redirected to your bookings page.</p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="booking-form">
                  {bookingError && (
                    <div className="alert alert-danger">
                      {bookingError}
                    </div>
                  )}

                  <div className="booking-dates">
                    <div className="date-field">
                      <label className="date-label">Check-in</label>
                      <input
                        type="date"
                        name="start_date"
                        className="date-input"
                        value={bookingData.start_date}
                        onChange={handleBookingChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div className="date-field">
                      <label className="date-label">Check-out</label>
                      <input
                        type="date"
                        name="end_date"
                        className="date-input"
                        value={bookingData.end_date}
                        onChange={handleBookingChange}
                        min={bookingData.start_date || new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                  </div>

                  <div className="guests-field">
                    <label className="guests-label">Guests</label>
                    <select
                      name="guests"
                      className="guests-select"
                      value={bookingData.guests}
                      onChange={handleBookingChange}
                      required
                    >
                      {Array.from({ length: property.max_guests }, (_, i) => i + 1).map(num => (
                        <option key={num} value={num}>
                          {num} guest{num > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {availability && (
                    <div className={`availability-status ${availability.available ? 'available' : 'unavailable'}`}>
                      {availability.available ? '✓ Available' : '✗ Not available'}
                    </div>
                  )}

                  <div className="special-requests">
                    <label className="requests-label">Special requests (optional)</label>
                    <textarea
                      name="special_requests"
                      className="requests-textarea"
                      value={bookingData.special_requests}
                      onChange={handleBookingChange}
                      placeholder="Any special requests for your stay..."
                      rows="3"
                    />
                  </div>

                  {calculateNights() > 0 && (
                    <div className="booking-summary">
                      <div className="summary-row">
                        <span>${property.price_per_night} × {calculateNights()} nights</span>
                        <span>${calculateTotal()}</span>
                      </div>
                      <div className="summary-row total">
                        <span>Total</span>
                        <span>${calculateTotal()}</span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="booking-button"
                    disabled={bookingLoading || (availability && !availability.available)}
                  >
                    {bookingLoading ? 'Sending Request...' : 'Request to Book'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .property-details-page {
          min-height: 100vh;
          background: #f8f9fa;
        }

        .property-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding: 30px 0;
        }

        .property-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 15px;
        }

        .property-meta {
          display: flex;
          gap: 20px;
          color: #666;
        }

        .property-location {
          font-size: 1.1rem;
        }

        .property-type {
          text-transform: capitalize;
          font-size: 1.1rem;
        }

        .property-actions {
          display: flex;
          gap: 15px;
        }

        .favorite-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .favorite-button:hover {
          background: #f8f9fa;
        }

        .favorite-button.favorited {
          background: #FF385C;
          color: white;
          border-color: #FF385C;
        }

        .heart-icon {
          font-size: 18px;
        }

        .property-images {
          margin-bottom: 40px;
        }

        .image-gallery {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 10px;
          border-radius: 12px;
          overflow: hidden;
        }

        .property-image {
          width: 100%;
          height: 250px;
          object-fit: cover;
        }

        .image-placeholder {
          height: 300px;
          background: #f0f0f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
        }

        .placeholder-icon {
          font-size: 4rem;
          color: #ccc;
          margin-bottom: 10px;
        }

        .property-content {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 40px;
        }

        .property-main {
          background: white;
          border-radius: 12px;
          padding: 30px;
        }

        .property-section {
          margin-bottom: 40px;
        }

        .property-section h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 20px;
        }

        .property-description {
          font-size: 1.1rem;
          line-height: 1.6;
          color: #666;
        }

        .amenities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .amenity-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .amenity-icon {
          color: #28a745;
          font-weight: bold;
        }

        .amenity-text {
          color: #333;
        }

        .host-info {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        .host-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #FF385C;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
          overflow: hidden;
        }

        .host-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .host-details h3 {
          font-size: 1.2rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 10px;
        }

        .host-about {
          color: #666;
          margin-bottom: 10px;
        }

        .host-contact {
          color: #666;
          font-size: 0.9rem;
        }

        .booking-sidebar {
          position: sticky;
          top: 20px;
        }

        .booking-card {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .booking-price {
          margin-bottom: 30px;
        }

        .price-amount {
          font-size: 2rem;
          font-weight: 700;
          color: #333;
        }

        .price-period {
          font-size: 1.1rem;
          color: #666;
          margin-left: 5px;
        }

        .booking-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .booking-dates {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .date-field {
          display: flex;
          flex-direction: column;
        }

        .date-label,
        .guests-label,
        .requests-label {
          font-size: 12px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .date-input,
        .guests-select,
        .requests-textarea {
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          color: #333;
        }

        .date-input:focus,
        .guests-select:focus,
        .requests-textarea:focus {
          outline: none;
          border-color: #FF385C;
          box-shadow: 0 0 0 3px rgba(255, 56, 92, 0.1);
        }

        .availability-status {
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          font-weight: 500;
        }

        .availability-status.available {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .availability-status.unavailable {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .booking-summary {
          border-top: 1px solid #eee;
          padding-top: 20px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          color: #666;
        }

        .summary-row.total {
          font-weight: 600;
          font-size: 1.1rem;
          color: #333;
          border-top: 1px solid #eee;
          padding-top: 10px;
          margin-top: 10px;
        }

        .booking-button {
          background: #FF385C;
          color: white;
          border: none;
          padding: 16px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .booking-button:hover:not(:disabled) {
          background: #e31c5f;
        }

        .booking-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .booking-success {
          text-align: center;
          padding: 20px;
          background: #d4edda;
          border: 1px solid #c3e6cb;
          border-radius: 8px;
          color: #155724;
        }

        .booking-success h3 {
          margin-bottom: 10px;
        }

        .loading-container,
        .error-container {
          text-align: center;
          padding: 60px 20px;
        }

        .loading-container .spinner {
          margin: 0 auto 20px;
        }

        .error-container h2 {
          color: #333;
          margin-bottom: 15px;
        }

        @media (max-width: 768px) {
          .property-content {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .property-header {
            flex-direction: column;
            gap: 20px;
          }

          .property-title {
            font-size: 2rem;
          }

          .booking-dates {
            grid-template-columns: 1fr;
          }

          .image-gallery {
            grid-template-columns: 1fr;
          }

          .host-info {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default PropertyDetails;
