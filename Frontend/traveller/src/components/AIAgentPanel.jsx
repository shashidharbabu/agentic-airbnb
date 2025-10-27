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
      // First, try to get booking details if bookingId exists
      let bookingContext = null;
      let preferences = {
        budget_tier: 'mid-range',
        interests: ['food', 'culture', 'sightseeing'],
        mobility_needs: [],
        dietary_restrictions: []
      };

      if (bookingId && user?.id) {
        try {
          const bookingResponse = await fetch(`http://localhost:5001/api/bookings/${bookingId}`, {
            credentials: 'include'
          });
          if (bookingResponse.ok) {
            const bookingData = await bookingResponse.json();
            const booking = bookingData.booking;
            
            // Extract location from property
            const location = booking.property?.city && booking.property?.state
              ? `${booking.property.city}, ${booking.property.state}`
              : booking.property?.city || 'San Francisco, CA';
            
            bookingContext = {
              check_in_date: booking.start_date?.slice(0, 10),
              check_out_date: booking.end_date?.slice(0, 10),
              location: location,
              party_type: booking.guests > 2 ? 'group' : 'couple',
              party_size: booking.guests || 2
            };
          }
        } catch (err) {
          console.log('Could not fetch booking details, using general context', err);
        }
      }

      // If no booking context, try to extract from user message
      if (!bookingContext) {
        bookingContext = {
          check_in_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          check_out_date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          location: 'San Francisco, CA',
          party_type: 'couple',
          party_size: 2
        };
      }

      // Call the full concierge endpoint with complete context
      const response = await fetch('http://localhost:8000/api/concierge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_context: bookingContext,
          preferences: preferences,
          user_message: inputMessage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Format the response to include all the rich data
      let formattedResponse = '';
      
      // Add AI notes if available
      if (data.agent_notes) {
        formattedResponse += `## 📝 Travel Recommendations\n\n${data.agent_notes}\n\n`;
      }

      // Add day-by-day plan if available
      if (data.day_by_day_plan && data.day_by_day_plan.length > 0) {
        formattedResponse += `## 📅 Day-by-Day Itinerary\n\n`;
        data.day_by_day_plan.forEach((day, idx) => {
          const dayDate = new Date(day.date);
          const dateStr = dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          formattedResponse += `### Day ${idx + 1} - ${dateStr}\n\n`;
          
          if (day.morning) {
            formattedResponse += `**🌅 Morning:** ${day.morning.title}\n`;
            if (day.morning.description) {
              formattedResponse += `${day.morning.description}\n`;
            }
            formattedResponse += `\n`;
          }
          
          if (day.afternoon) {
            formattedResponse += `**☀️ Afternoon:** ${day.afternoon.title}\n`;
            if (day.afternoon.description) {
              formattedResponse += `${day.afternoon.description}\n`;
            }
            formattedResponse += `\n`;
          }
          
          if (day.evening) {
            formattedResponse += `**🌙 Evening:** ${day.evening.title}\n`;
            if (day.evening.description) {
              formattedResponse += `${day.evening.description}\n`;
            }
            formattedResponse += `\n`;
          }
        });
      }

      // Add packing checklist if available
      if (data.packing_checklist && data.packing_checklist.length > 0) {
        formattedResponse += `## 🎒 Packing Checklist\n\n`;
        const essentials = data.packing_checklist.filter(item => item.is_essential);
        const others = data.packing_checklist.filter(item => !item.is_essential);
        
        if (essentials.length > 0) {
          formattedResponse += `**Essential Items:**\n`;
          essentials.forEach(item => {
            formattedResponse += `- ⭐ ${item.item_name}\n`;
          });
          formattedResponse += `\n`;
        }
        
        if (others.length > 0) {
          formattedResponse += `**Additional Items:**\n`;
          others.forEach(item => {
            const emoji = item.weather_dependent ? '🌡️' : '📦';
            formattedResponse += `- ${emoji} ${item.item_name}\n`;
          });
          formattedResponse += `\n`;
        }
      }

      // Add weather info if available
      if (data.weather_summary) {
        formattedResponse += `## 🌤️ Weather Information\n\nLocation: ${data.weather_summary.location}\n\n`;
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: formattedResponse || data.response || 'I can help you plan your trip! Please provide more details about your travel preferences.',
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
        content: 'Sorry, I encountered an error while processing your request. Please make sure the AI agent server is running on port 8000 and try again.',
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