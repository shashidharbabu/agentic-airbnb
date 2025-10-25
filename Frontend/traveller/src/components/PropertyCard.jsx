import React from 'react';

const PropertyCard = ({ property, isFavorited, onToggleFavorite, onClick }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPropertyType = (type) => {
    const types = {
      'apartment': 'Apartment',
      'house': 'House',
      'villa': 'Villa',
      'condo': 'Condo',
      'studio': 'Studio'
    };
    return types[type] || type;
  };

  return (
    <div className="property-card" onClick={onClick}>
      <div className="property-image-container">
        {property.main_photo ? (
          <img 
            src={property.main_photo} 
            alt={property.name}
            className="property-image"
          />
        ) : (
          <div className="property-image-placeholder">
            <span className="placeholder-icon">🏠</span>
          </div>
        )}
        
        <button
          className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <span className="heart-icon">
            {isFavorited ? '❤️' : '🤍'}
          </span>
        </button>
      </div>

      <div className="property-content">
        <div className="property-header">
          <h3 className="property-name">{property.name}</h3>
          <div className="property-rating">
            <span className="rating-star">⭐</span>
            <span className="rating-text">4.8</span>
          </div>
        </div>

        <div className="property-details">
          <p className="property-location">{property.location}</p>
          <p className="property-type">{getPropertyType(property.property_type)}</p>
        </div>

        <div className="property-amenities">
          <div className="amenity">
            <span className="amenity-icon">🛏️</span>
            <span className="amenity-text">{property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}</span>
          </div>
          <div className="amenity">
            <span className="amenity-icon">🚿</span>
            <span className="amenity-text">{property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}</span>
          </div>
          <div className="amenity">
            <span className="amenity-icon">👥</span>
            <span className="amenity-text">Up to {property.max_guests} guests</span>
          </div>
        </div>

        <div className="property-footer">
          <div className="property-price">
            <span className="price-amount">{formatPrice(property.price_per_night)}</span>
            <span className="price-period">/ night</span>
          </div>
          <div className="property-host">
            <span className="host-text">Hosted by {property.owner_name}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .property-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .property-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }

        .property-image-container {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .property-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.2s ease;
        }

        .property-card:hover .property-image {
          transform: scale(1.05);
        }

        .property-image-placeholder {
          width: 100%;
          height: 100%;
          background: #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .placeholder-icon {
          font-size: 3rem;
          color: #ccc;
        }

        .favorite-button {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .favorite-button:hover {
          background: white;
          transform: scale(1.1);
        }

        .favorite-button.favorited {
          background: #FF385C;
        }

        .favorite-button.favorited .heart-icon {
          color: white;
        }

        .heart-icon {
          font-size: 18px;
          transition: all 0.2s ease;
        }

        .property-content {
          padding: 20px;
        }

        .property-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
        }

        .property-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          margin: 0;
          flex: 1;
          line-height: 1.3;
        }

        .property-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-left: 10px;
        }

        .rating-star {
          font-size: 14px;
        }

        .rating-text {
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .property-details {
          margin-bottom: 15px;
        }

        .property-location {
          color: #666;
          font-size: 14px;
          margin: 0 0 5px 0;
        }

        .property-type {
          color: #999;
          font-size: 13px;
          margin: 0;
          text-transform: capitalize;
        }

        .property-amenities {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .amenity {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .amenity-icon {
          font-size: 14px;
        }

        .amenity-text {
          font-size: 13px;
          color: #666;
        }

        .property-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 15px;
          border-top: 1px solid #f0f0f0;
        }

        .property-price {
          display: flex;
          align-items: baseline;
        }

        .price-amount {
          font-size: 1.2rem;
          font-weight: 700;
          color: #333;
        }

        .price-period {
          font-size: 14px;
          color: #666;
          margin-left: 2px;
        }

        .property-host {
          font-size: 12px;
          color: #999;
        }

        .host-text {
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .property-content {
            padding: 15px;
          }

          .property-amenities {
            gap: 10px;
          }

          .amenity-text {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default PropertyCard;
