import React from 'react';
import SearchBarHome from '../components/SearchBarHome';
import PopularHomes from '../components/PopularHomes';
import InspirationFooter from '../components/InspirationFooter';
import HostModal from '../components/HostModal';
import { mockProperties } from '../data/mockProperties';

const Home = ({ hostModalOpen, onCloseHostModal }) => {
  return (
    <div className="home-page">
      <div className="home-nav-search-section">
        <div className="home-search-container">
          <SearchBarHome />
        </div>
      </div>

      <div className="home-content">
        <PopularHomes 
          title="Popular homes in Los Angeles" 
          properties={mockProperties.slice(0, 7)} 
        />
        
        <PopularHomes 
          title="Available next month in San Diego" 
          properties={mockProperties.slice(7, 14)} 
        />
        
        <PopularHomes 
          title="Stay in Tokyo" 
          properties={mockProperties.slice(14, 21)} 
        />
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
