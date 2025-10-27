import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import { favoritesAPI } from '../services/api';

const Favorites = () => {
  const navigate = useNavigate();
  const { traveler, isAuthenticated } = useAuth();
  
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadFavorites();
  }, [isAuthenticated, navigate]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      // Load favorites from database API only - NO mock data or localStorage
      const response = await favoritesAPI.getTravelerFavorites(traveler.id);
      setFavorites(response.data.favorites || []);
    } catch (err) {
      setError('Failed to load favorites');
      console.error('Error loading favorites:', err);
      setFavorites([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (propertyId) => {
    try {
      setRemoving(propertyId);
      // Remove from database only - NO localStorage
      await favoritesAPI.remove(propertyId);
      setFavorites(prev => prev.filter(fav => fav.property_id !== propertyId));
    } catch (err) {
      console.error('Error removing favorite:', err);
      alert('Failed to remove from favorites. Please try again.');
    } finally {
      setRemoving(null);
    }
  };

  const handleToggleFavorite = async (propertyId) => {
    await handleRemoveFavorite(propertyId);
  };

  const handlePropertyClick = (propertyId) => {
    navigate(`/property/${propertyId}`);
  };

  if (loading) {
    return (
      <div className="favorites-page">
        <div className="container">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your favorites...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="container">
        <div className="favorites-header">
          <h1 className="favorites-title">Your Favorites</h1>
          <p className="favorites-subtitle">
            {favorites.length > 0 
              ? `${favorites.length} propert${favorites.length === 1 ? 'y' : 'ies'} saved`
              : 'Properties you love will appear here'
            }
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
            <button 
              className="btn btn-outline btn-sm"
              onClick={loadFavorites}
              style={{ marginLeft: '10px' }}
            >
              Try Again
            </button>
          </div>
        )}

        {favorites.length > 0 ? (
          <div className="favorites-grid">
            {favorites.map(favorite => (
              <div key={favorite.favorite_id} className="favorite-item">
                <PropertyCard
                  property={{
                    id: favorite.property_id,
                    name: favorite.property_name,
                    description: favorite.description,
                    location: favorite.location,
                    price_per_night: favorite.price_per_night,
                    bedrooms: favorite.bedrooms,
                    bathrooms: favorite.bathrooms,
                    max_guests: favorite.max_guests,
                    property_type: favorite.property_type,
                    amenities: favorite.amenities,
                    latitude: favorite.latitude,
                    longitude: favorite.longitude,
                    owner_name: favorite.owner_name,
                    owner_avatar: favorite.owner_avatar,
                    main_photo: favorite.main_photo
                  }}
                  isFavorited={true}
                  onToggleFavorite={() => handleToggleFavorite(favorite.property_id)}
                  onClick={() => handlePropertyClick(favorite.property_id)}
                />
                
                <div className="favorite-actions">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handlePropertyClick(favorite.property_id)}
                  >
                    View Details
                  </button>
                  
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleRemoveFavorite(favorite.property_id)}
                    disabled={removing === favorite.property_id}
                  >
                    {removing === favorite.property_id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">❤️</div>
            <h3>No favorites yet</h3>
            <p>Start exploring properties and save the ones you love!</p>
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/dashboard')}
            >
              Browse Properties
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .favorites-page {
          min-height: 100vh;
          background: #f8f9fa;
          padding: 40px 0;
        }

        .favorites-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .favorites-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 10px;
        }

        .favorites-subtitle {
          color: #666;
          font-size: 1.1rem;
        }

        .favorites-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 30px;
        }

        .favorite-item {
          position: relative;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
        }

        .favorite-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .favorite-actions {
          position: absolute;
          top: 15px;
          right: 15px;
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .favorite-item:hover .favorite-actions {
          opacity: 1;
        }

        .favorite-actions .btn {
          padding: 8px 12px;
          font-size: 12px;
          border-radius: 6px;
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .favorite-actions .btn-danger {
          background: rgba(220, 53, 69, 0.9);
          color: white;
          border-color: rgba(220, 53, 69, 0.9);
        }

        .favorite-actions .btn-danger:hover {
          background: rgba(200, 35, 51, 0.9);
        }

        .empty-state {
          text-align: center;
          padding: 80px 20px;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 10px;
        }

        .empty-state p {
          color: #666;
          margin-bottom: 30px;
        }

        .loading-container {
          text-align: center;
          padding: 60px 20px;
        }

        .loading-container .spinner {
          margin: 0 auto 20px;
        }

        @media (max-width: 768px) {
          .favorites-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .favorite-actions {
            position: static;
            opacity: 1;
            padding: 15px;
            background: #f8f9fa;
            border-top: 1px solid #eee;
            justify-content: center;
          }

          .favorite-actions .btn {
            background: white;
            backdrop-filter: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Favorites;
