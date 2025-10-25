import React, { useState } from 'react';

const AIAgentButton = ({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className="ai-agent-button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Open AI Travel Assistant"
    >
      <div className="button-content">
        <span className="ai-icon">🤖</span>
        {isHovered && (
          <span className="button-text">AI Assistant</span>
        )}
      </div>
      
      <style jsx>{`
        .ai-agent-button {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #FF385C, #e31c5f);
          border: none;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(255, 56, 92, 0.4);
          transition: all 0.3s ease;
          z-index: 1000;
          overflow: hidden;
        }

        .ai-agent-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(255, 56, 92, 0.6);
        }

        .ai-agent-button:active {
          transform: scale(0.95);
        }

        .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: white;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .ai-icon {
          font-size: 24px;
          transition: transform 0.3s ease;
        }

        .button-text {
          margin-left: 8px;
          font-size: 14px;
          white-space: nowrap;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @media (max-width: 768px) {
          .ai-agent-button {
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
          }

          .ai-icon {
            font-size: 20px;
          }

          .button-text {
            font-size: 12px;
          }
        }
      `}</style>
    </button>
  );
};

export default AIAgentButton;
