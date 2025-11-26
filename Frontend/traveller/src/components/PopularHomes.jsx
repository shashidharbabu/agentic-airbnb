import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI, favoritesAPI } from '../services/api';

const PopularHomes = ({ title, properties = [] }) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [favorites, setFavorites] = useState([]);
  const { isAuthenticated, traveler } = useAuth();
  const [bookingLoading, setBookingLoading] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites();
    } else {
      setFavorites([]);
    }
  }, [isAuthenticated]);

  const loadFavorites = async () => {
    try {
      // Load favorites from database only - NO localStorage fallback
      const response = await favoritesAPI.getTravelerFavorites(traveler.id);
      const favoriteIds = response.data.favorites.map(fav => fav.property_id);
      setFavorites(favoriteIds);
    } catch (err) {
      console.error('Error loading favorites:', err);
      setFavorites([]); // Set empty array on error
    }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const toggleFavorite = async (propertyId, e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const isFavorited = favorites.includes(propertyId);
    
    try {
      // Update database only - NO localStorage fallback
      if (isFavorited) {
        await favoritesAPI.remove(propertyId);
        setFavorites(prev => prev.filter(id => id !== propertyId));
      } else {
        await favoritesAPI.add(propertyId);
        setFavorites(prev => [...prev, propertyId]);
      }
    } catch (err) {
      console.error('Error updating favorites:', err);
      alert('Failed to update favorites. Please try again.');
    }
  };

  const handlePropertyClick = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  const handleBookNow = async (property, e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setBookingLoading(prev => ({ ...prev, [property.id]: true }));

    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const bookingData = {
        property_id: property.id,
        start_date: today.toISOString().split('T')[0],
        end_date: tomorrow.toISOString().split('T')[0],
        guests: 1
      };

      const response = await bookingsAPI.create(bookingData);
      alert(`Booking request sent successfully! Booking ID: ${response.data.booking.id}`);
      
    } catch (error) {
      console.error('Booking error:', error);
      alert(`Booking failed: ${error.response?.data?.error || 'Please try again'}`);
    } finally {
      setBookingLoading(prev => ({ ...prev, [property.id]: false }));
    }
  };

  return (
    <div className="popular-homes-section">
      <div className="popular-homes-header">
        <h2>{title}</h2>
        <div className="scroll-buttons">
          <button className="scroll-btn" onClick={() => scroll('left')}>
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{height: '12px', width: '12px', fill: 'currentColor'}}>
              <path d="M20 28 8.7 16.7a1 1 0 0 1 0-1.4L20 4"></path>
            </svg>
          </button>
          <button className="scroll-btn" onClick={() => scroll('right')}>
            <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{height: '12px', width: '12px', fill: 'currentColor'}}>
              <path d="m12 4 11.3 11.3a1 1 0 0 1 0 1.4L12 28"></path>
            </svg>
          </button>
        </div>
      </div>

      <div className="properties-carousel" ref={scrollContainerRef}>
        {properties.map((property) => (
          <div
            key={property.id}
            className="property-card"
            onClick={() => handlePropertyClick(property.id)}
          >
            <div className="property-image-container">
              {property.isGuestFavorite ? (
                <div className="guest-favorite-badge">Guest favorite</div>
              ) : null}
              <button
                className={`favorite-btn ${favorites.includes(property.id) ? 'favorited' : ''}`}
                onClick={(e) => toggleFavorite(property.id, e)}
              >
                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{height: '24px', width: '24px', fill: favorites.includes(property.id) ? '#FF385C' : 'rgba(0,0,0,0.5)', stroke: '#fff', strokeWidth: '2'}}>
                  <path d="M16 28c7-4.73 14-10 14-17a6.98 6.98 0 0 0-7-7c-1.8 0-3.58.68-4.95 2.05L16 8.1l-2.05-2.05a6.98 6.98 0 0 0-9.9 0A6.98 6.98 0 0 0 2 11c0 7 7 12.27 14 17z"></path>
                </svg>
              </button>
              <img 
                src={
                  (property.main_photo || property.image)?.startsWith('http') 
                    ? (property.main_photo || property.image)
                    : `http://localhost:4000${property.main_photo || property.image}`
                } 
                alt={property.name} 
                className="property-image" 
              />
            </div>

            <div className="property-info">
              <div className="property-header">
                <div className="property-name">{property.name}</div>
                <div className="property-rating">
                  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{height: '12px', width: '12px', fill: 'currentColor'}}>
                    <path d="M15.094 1.579l-4.124 8.885-9.86 1.27a1 1 0 0 0-.542 1.736l7.293 6.565-1.965 9.852a1 1 0 0 0 1.483 1.061L16 25.951l8.625 4.997a1 1 0 0 0 1.482-1.06l-1.965-9.853 7.293-6.565a1 1 0 0 0-.541-1.735l-9.86-1.271-4.127-8.885a1 1 0 0 0-1.814 0z"></path>
                  </svg>
                  <span>{property.rating}</span>
                </div>
              </div>
              <div className="property-location">{property.location}</div>
              <div className="property-price">
                <strong>${property.price_per_night ?? property.price}</strong> / night
              </div>
              <button 
                className="book-now-btn"
                onClick={(e) => handleBookNow(property, e)}
                disabled={bookingLoading[property.id]}
              >
                {bookingLoading[property.id] ? 'Booking...' : 'Book Now'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularHomes;

