import React, { useEffect, useState } from 'react';
import SearchBarHome from '../components/SearchBarHome';
import PopularHomes from '../components/PopularHomes';
import InspirationFooter from '../components/InspirationFooter';
import HostModal from '../components/HostModal';
import { propertiesAPI } from '../services/api';

const Home = ({ hostModalOpen, onCloseHostModal }) => {
  const [allProps, setAllProps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        // Fetch a single page of properties and slice into sections for the homepage
        const { data } = await propertiesAPI.search({ page: 1, limit: 30 });
        if (!cancelled) {
          const props = Array.isArray(data?.properties) ? data.properties : [];
          console.log('[Home] Loaded properties:', props.length);
          setAllProps(props);
        }
      } catch (e) {
        console.error('[Home] Failed to load properties:', e);
        if (!cancelled) setError('Failed to load properties');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const section = (start, end) => allProps.slice(start, end);

  return (
    <div className="home-page">
      <div className="home-nav-search-section">
        <div className="home-search-container">
          <SearchBarHome />
        </div>
      </div>

      <div className="home-content">
        {error ? (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', color: '#d00' }}>{error}</div>
        ) : null}

        {loading ? (
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>Loading listings…</div>
        ) : (
          <>
            <PopularHomes 
              title="Popular homes"
              properties={section(0, 7)} 
            />
            <PopularHomes 
              title="Available next month"
              properties={section(7, 14)} 
            />
            <PopularHomes 
              title="Explore more places"
              properties={section(14, 21)} 
            />
          </>
        )}
      </div>

      <InspirationFooter />

      <HostModal isOpen={hostModalOpen} onClose={onCloseHostModal} />

      <style jsx>{`
        .home-page {
          min-height: 100vh;
          background: white;
        }

        .home-nav-search-section {
          background: #F7F7F7;
          padding: 20px 0 40px 0;
        }

        .home-search-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .home-content {
          background: white;
          padding: 40px 0;
        }

        @media (max-width: 768px) {
          .home-search-container {
            padding: 0 15px;
          }

          .home-content {
            padding: 20px 0;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;
