import React, { useState } from 'react';

const SearchBar = ({ initialData, onSearch }) => {
  const [searchData, setSearchData] = useState({
    location: initialData.location || '',
    check_in: initialData.check_in || '',
    check_out: initialData.check_out || '',
    guests: initialData.guests || '1',
    property_type: initialData.property_type || '',
    min_price: initialData.min_price || '',
    max_price: initialData.max_price || ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchData);
  };

  const clearFilters = () => {
    setSearchData({
      location: '',
      check_in: '',
      check_out: '',
      guests: '1',
      property_type: '',
      min_price: '',
      max_price: ''
    });
    onSearch({
      location: '',
      check_in: '',
      check_out: '',
      guests: '1',
      property_type: '',
      min_price: '',
      max_price: ''
    });
  };

  const propertyTypes = [
    { value: '', label: 'Any type' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'villa', label: 'Villa' },
    { value: 'condo', label: 'Condo' },
    { value: 'studio', label: 'Studio' }
  ];

  return (
    <form onSubmit={handleSubmit} className="search-bar">
      <div className="search-row">
        <div className="search-field">
          <label className="search-label">Where</label>
          <input
            type="text"
            name="location"
            className="search-input"
            placeholder="Search destinations"
            value={searchData.location}
            onChange={handleChange}
          />
        </div>

        <div className="search-field">
          <label className="search-label">Check in</label>
          <input
            type="date"
            name="check_in"
            className="search-input"
            value={searchData.check_in}
            onChange={handleChange}
          />
        </div>

        <div className="search-field">
          <label className="search-label">Check out</label>
          <input
            type="date"
            name="check_out"
            className="search-input"
            value={searchData.check_out}
            onChange={handleChange}
          />
        </div>

        <div className="search-field">
          <label className="search-label">Guests</label>
          <select
            name="guests"
            className="search-input"
            value={searchData.guests}
            onChange={handleChange}
          >
            {[1,2,3,4,5,6,7,8,9,10].map(num => (
              <option key={num} value={num}>
                {num} guest{num > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="search-button">
          <span className="search-icon">🔍</span>
          Search
        </button>
      </div>

      <div className="search-actions">
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide' : 'Show'} filters
        </button>
        
        {(searchData.property_type || searchData.min_price || searchData.max_price) && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      {showAdvanced && (
        <div className="advanced-filters">
          <div className="filter-row">
            <div className="filter-field">
              <label className="filter-label">Property type</label>
              <select
                name="property_type"
                className="filter-input"
                value={searchData.property_type}
                onChange={handleChange}
              >
                {propertyTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label className="filter-label">Min price</label>
              <input
                type="number"
                name="min_price"
                className="filter-input"
                placeholder="$0"
                value={searchData.min_price}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="filter-field">
              <label className="filter-label">Max price</label>
              <input
                type="number"
                name="max_price"
                className="filter-input"
                placeholder="$1000"
                value={searchData.max_price}
                onChange={handleChange}
                min="0"
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .search-bar {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .search-row {
          display: flex;
          align-items: end;
        }

        .search-field {
          flex: 1;
          padding: 20px;
          border-right: 1px solid #eee;
          position: relative;
        }

        .search-field:last-of-type {
          border-right: none;
        }

        .search-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .search-input {
          width: 100%;
          border: none;
          outline: none;
          font-size: 16px;
          color: #333;
          background: transparent;
        }

        .search-input::placeholder {
          color: #999;
        }

        .search-button {
          background: #FF385C;
          color: white;
          border: none;
          padding: 20px 30px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.2s;
          white-space: nowrap;
        }

        .search-button:hover {
          background: #e31c5f;
        }

        .search-icon {
          font-size: 18px;
        }

        .search-actions {
          padding: 15px 20px;
          border-top: 1px solid #eee;
          display: flex;
          gap: 10px;
          background: #f8f9fa;
        }

        .advanced-filters {
          padding: 20px;
          border-top: 1px solid #eee;
          background: #f8f9fa;
        }

        .filter-row {
          display: flex;
          gap: 20px;
        }

        .filter-field {
          flex: 1;
        }

        .filter-label {
          display: block;
          font-size: 12px;
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          color: #333;
          background: white;
        }

        .filter-input:focus {
          outline: none;
          border-color: #FF385C;
          box-shadow: 0 0 0 3px rgba(255, 56, 92, 0.1);
        }

        @media (max-width: 768px) {
          .search-row {
            flex-direction: column;
          }

          .search-field {
            border-right: none;
            border-bottom: 1px solid #eee;
            padding: 15px;
          }

          .search-field:last-of-type {
            border-bottom: none;
          }

          .search-button {
            padding: 15px 20px;
            justify-content: center;
          }

          .filter-row {
            flex-direction: column;
            gap: 15px;
          }
        }
      `}</style>
    </form>
  );
};

export default SearchBar;
