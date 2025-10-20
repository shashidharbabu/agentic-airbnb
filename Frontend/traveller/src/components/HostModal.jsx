import React, { useState } from 'react';

const HostModal = ({ isOpen, onClose }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  if (!isOpen) return null;

  const hostOptions = [
    {
      id: 'home',
      title: 'Home',
      icon: '🏠'
    },
    {
      id: 'apartments',
      title: 'Apartments',
      icon: '🏢'
    },
    {
      id: 'villas',
      title: 'Villas',
      icon: '🏡'
    }
  ];

  const handleNext = () => {
    if (selectedOption) {
      console.log('Selected:', selectedOption);
      alert(`Proceeding with ${selectedOption} hosting setup...`);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="host-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{height: '16px', width: '16px', fill: 'currentColor'}}>
            <path d="M17.414 16l6.293-6.293a1 1 0 1 0-1.414-1.414L16 14.586 9.707 8.293a1 1 0 0 0-1.414 1.414L14.586 16l-6.293 6.293a1 1 0 1 0 1.414 1.414L16 17.414l6.293 6.293a1 1 0 0 0 1.414-1.414z"></path>
          </svg>
        </button>

        <div className="host-modal-content">
          <h2 className="host-modal-title">What would you like to host?</h2>

          <div className="host-options">
            {hostOptions.map((option) => (
              <div
                key={option.id}
                className={`host-option ${selectedOption === option.id ? 'selected' : ''}`}
                onClick={() => setSelectedOption(option.id)}
              >
                <div className="host-option-icon">{option.icon}</div>
                <div className="host-option-title">{option.title}</div>
              </div>
            ))}
          </div>

          <div className="host-modal-footer">
            <button
              className="host-next-btn"
              disabled={!selectedOption}
              onClick={handleNext}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostModal;

