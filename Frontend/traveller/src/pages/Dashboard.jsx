import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { favoritesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/SearchBar';
import AIAgentPanel from '../components/AIAgentPanel';
import { mockProperties } from '../data/mockProperties';

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, traveler } = useAuth();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [favorites, setFavorites] = useState(new Set());
  const [isAIAgentOpen, setIsAIAgentOpen] = useState(false);

  const searchAbortRef = useRef(null);

  const searchData = {
    location: searchParams.get('location') || '',
    check_in: searchParams.get('check_in') || '',
    check_out: searchParams.get('check_out') || '',
    guests: searchParams.get('guests') || '1',
    property_type: searchParams.get('property_type') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    page: searchParams.get('page') || '1',
  };

  useEffect(() => {
    loadProperties();
    return () => {
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }
    };
  }, [searchParams.toString()]);

  useEffect(() => {
    if (isAuthenticated && traveler?.id) {
      loadFavorites(traveler.id);
    } else {
      setFavorites(new Set());
    }
  }, [isAuthenticated, traveler?.id]);

  const loadProperties = async () => {
    setLoading(true);
    setError(null);

    try {
      let filteredProperties = [...mockProperties];

      if (searchData.location) {
        filteredProperties = filteredProperties.filter(property =>
          property.location.toLowerCase().includes(searchData.location.toLowerCase()) ||
          property.name.toLowerCase().includes(searchData.location.toLowerCase())
        );
      }

      if (searchData.guests) {
        const guestCount = parseInt(searchData.guests);
        filteredProperties = filteredProperties.filter(property => 
          property.max_guests >= guestCount
        );
      }

      if (searchData.min_price) {
        const minPrice = parseFloat(searchData.min_price);
        filteredProperties = filteredProperties.filter(property => 
          property.price >= minPrice
        );
      }

      if (searchData.max_price) {
        const maxPrice = parseFloat(searchData.max_price);
        filteredProperties = filteredProperties.filter(property => 
          property.price <= maxPrice
        );
      }

      const transformedProperties = filteredProperties.map(property => ({
        id: property.id,
        name: property.name,
        location: property.location,
        price_per_night: property.price,
        property_type: 'Apartment',
        max_guests: property.max_guests || 4,
        bedrooms: property.bedrooms || 2,
        bathrooms: property.bathrooms || 1,
        rating: property.rating || 4.5,
        images: [property.image],
        amenities: ['WiFi', 'Kitchen', 'Parking', 'Air conditioning'],
        description: `Beautiful ${property.name} located in ${property.location}.`
      }));

      const pageNum = Number(searchData.page) || 1;
      const itemsPerPage = 12;
      const startIndex = (pageNum - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedProperties = transformedProperties.slice(startIndex, endIndex);

      setProperties(paginatedProperties);
      setPagination({
        page: pageNum,
        pages: Math.ceil(filteredProperties.length / itemsPerPage),
        total: filteredProperties.length
      });
    } catch (err) {
      setError('Failed to load properties. Please try again.');
      console.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async (travelerId) => {
    try {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      setFavorites(new Set(favorites));
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  };

  const handleSearch = (newSearchData) => {
    const params = new URLSearchParams();

    Object.keys(newSearchData).forEach((key) => {
      const val = newSearchData[key];
      if (val !== '' && val != null) params.set(key, val);
    });

    params.set('page', '1');

    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(newPage));
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFavorite = async (propertyId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const isFavorited = favorites.has(propertyId);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFavorited) next.delete(propertyId);
      else next.add(propertyId);
      return next;
    });

    try {
      const favoritesList = JSON.parse(localStorage.getItem('favorites') || '[]');
      if (isFavorited) {
        const updatedFavorites = favoritesList.filter(id => id !== propertyId);
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      } else {
        const updatedFavorites = [...favoritesList, propertyId];
        localStorage.setItem('favorites', JSON.stringify(updatedFavorites));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      setFavorites((prev) => {
        const next = new Set(prev);
        if (isFavorited) next.add(propertyId);
        else next.delete(propertyId);
        return next;
      });
    }
  };

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="search-section">
          <SearchBar initialData={searchData} onSearch={handleSearch} />
        </div>

        <div className="results-header">
          <h2 className="results-title">
            {pagination?.total ? `${pagination.total} properties found` : 'Search properties'}
          </h2>
          {searchData.location && <p className="results-subtitle">in {searchData.location}</p>}
        </div>

        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Searching properties...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <div className="alert alert-danger">{error}</div>
            <button className="btn btn-outline" onClick={loadProperties}>
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {properties.length > 0 ? (
              <div className="properties-grid">
                {properties.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isFavorited={favorites.has(property.id)}
                    onToggleFavorite={() => toggleFavorite(property.id)}
                    onClick={() => navigate(`/property/${property.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🏠</div>
                <h3>No properties found</h3>
                <p>Try adjusting your search criteria</p>
                <button className="btn btn-primary" onClick={() => setSearchParams({})}>
                  Clear Filters
                </button>
              </div>
            )}

            {pagination?.pages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-outline"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  Previous
                </button>

                <span className="pagination-info">
                  Page {pagination.page} of {pagination.pages}
                </span>

                <button
                  className="btn btn-outline"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .dashboard-page {
          min-height: 100vh;
          background: #f8f9fa;
        }

        .search-section {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 30px;
        }

        .results-header {
          margin-bottom: 30px;
        }

        .results-title {
          font-size: 2rem;
          font-weight: 700;
          color: #333;
          margin-bottom: 10px;
        }

        .results-subtitle {
          color: #666;
          font-size: 1.1rem;
        }

        .loading-container {
          text-align: center;
          padding: 60px 20px;
        }

        .loading-container .spinner {
          margin: 0 auto 20px;
        }

        .error-container {
          text-align: center;
          padding: 60px 20px;
        }

        .properties-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 30px;
          margin-bottom: 40px;
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

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          padding: 40px 0;
        }

        .pagination-info {
          font-weight: 500;
          color: #666;
        }

        @media (max-width: 768px) {
          .search-section {
            padding: 20px;
          }

          .properties-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .results-title {
            font-size: 1.5rem;
          }
        }

        .ai-agent-button {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 50%;
          color: white;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
          transition: all 0.3s ease;
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-agent-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(102, 126, 234, 0.6);
        }

        .ai-agent-button:active {
          transform: translateY(0);
        }

        .ai-agent-button .pulse {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          background: inherit;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.4);
            opacity: 0;
          }
        }

        @media (max-width: 768px) {
          .ai-agent-button {
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            font-size: 20px;
          }
        }
      `}</style>

      <button 
        className="ai-agent-button"
        onClick={() => setIsAIAgentOpen(true)}
        title="AI Travel Assistant"
      >
        <div className="pulse"></div>
        🤖
      </button>

      <AIAgentPanel 
        isOpen={isAIAgentOpen}
        onClose={() => setIsAIAgentOpen(false)}
        bookingId={1} 
      />
    </div>
  );
};

export default Dashboard;
