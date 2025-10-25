import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import './AIAgentPanel.css';

const AIAgentPanel = ({ isOpen, onClose, bookingId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const saveMessagesToStorage = (messagesToSave) => {
    if (user) {
      const conversationKey = `ai_chat_${user.id}_${bookingId || 'general'}`;
      try {
        localStorage.setItem(conversationKey, JSON.stringify(messagesToSave));
      } catch (error) {
        console.error('Error saving messages to localStorage:', error);
      }
    }
  };

  const clearConversation = () => {
    if (user) {
      const conversationKey = `ai_chat_${user.id}_${bookingId || 'general'}`;
      localStorage.removeItem(conversationKey);
      console.log('Cleared conversation for key:', conversationKey);
      setMessages([{
        id: 1,
        role: 'assistant',
        content: `Hello ${user.name}! I'm your AI travel assistant. I can help you plan your trip with personalized recommendations for activities, restaurants, and more. What would you like to know about your upcoming trip?`,
        timestamp: new Date()
      }]);
    }
  };

  const clearAllChatData = () => {
    const keys = Object.keys(localStorage);
    const aiChatKeys = keys.filter(key => key.startsWith('ai_chat_'));
    aiChatKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log('Cleared key:', key);
    });
    console.log('Cleared all AI chat data');
  };

  if (typeof window !== 'undefined') {
    window.clearAllChatData = clearAllChatData;
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToStorage(messages);
    }
  }, [messages, user, bookingId]);

  useEffect(() => {
    if (isOpen && user) {
      const conversationKey = `ai_chat_${user.id}_${bookingId || 'general'}`;
      const savedMessages = localStorage.getItem(conversationKey);
      
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          const messagesWithDates = parsedMessages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          console.log('Loaded messages from localStorage:', messagesWithDates);
          setMessages(messagesWithDates);
        } catch (error) {
          console.error('Error parsing saved messages:', error);
          setMessages([{
            id: 1,
            role: 'assistant',
            content: `Hello ${user.name}! I'm your AI travel assistant. I can help you plan your trip with personalized recommendations for activities, restaurants, and more. What would you like to know about your upcoming trip?`,
            timestamp: new Date()
          }]);
        }
      } else {
        setMessages([{
          id: 1,
          role: 'assistant',
          content: `Hello ${user.name}! I'm your AI travel assistant. I can help you plan your trip with personalized recommendations for activities, restaurants, and more. What would you like to know about your upcoming trip?`,
          timestamp: new Date()
        }]);
      }
    }
  }, [isOpen, user, bookingId]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      console.log('Adding user message:', userMessage);
      console.log('Updated messages:', newMessages);
      return newMessages;
    });
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/ai-agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          booking_id: bookingId,
          traveler_id: user?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        console.log('Adding assistant message:', assistantMessage);
        console.log('Updated messages:', newMessages);
        return newMessages;
      });

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };


  if (!isOpen) return null;

  return (
    <div className="ai-agent-panel">
      <div className="ai-agent-header">
        <div className="ai-agent-title">
          <div className="ai-avatar">🤖</div>
          <div>
            <h3>AI Travel Assistant</h3>
            <p>Your personal travel planner</p>
          </div>
        </div>
        <div className="header-buttons">
          <button className="clear-button" onClick={clearConversation} title="Clear conversation">
            🗑️
          </button>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="ai-agent-content">
        <div className="chat-container">
          <div className="messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="message-content">
                  {message.role === 'assistant' ? (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  ) : (
                    <p>{message.content}</p>
                  )}
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="message-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about your trip..."
              disabled={isLoading}
            />
            <button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isLoading}
              className="send-button"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentPanel;