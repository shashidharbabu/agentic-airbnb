import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import './AIAgentPanel.css';

const AIAgentPanel = ({ isOpen, onClose, bookingId }) => {
  const { traveler } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationContext, setConversationContext] = useState({
    location: null,
    check_in_date: null,
    check_out_date: null,
    party_size: null
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const saveMessagesToStorage = (messagesToSave) => {
    if (traveler) {
      // Versioned cache keys to avoid cross-user or legacy overlap
      const v2Key = `ai_chat_v2_${traveler.id}_${bookingId || 'general'}`;
      try {
        localStorage.setItem(v2Key, JSON.stringify(messagesToSave));
      } catch (error) {
        console.error('Error saving messages to localStorage:', error);
      }
    }
  };

  const saveContextToStorage = (context) => {
    if (traveler) {
      const v2ContextKey = `ai_context_v2_${traveler.id}_${bookingId || 'general'}`;
      try {
        localStorage.setItem(v2ContextKey, JSON.stringify(context));
        console.log('💾 Saved context to localStorage:', context);
      } catch (error) {
        console.error('Error saving context to localStorage:', error);
      }
    }
  };

  const loadContextFromStorage = () => {
    if (traveler) {
      const v2ContextKey = `ai_context_v2_${traveler.id}_${bookingId || 'general'}`;
      const legacyContextKey = `ai_context_${traveler.id}_${bookingId || 'general'}`;
      try {
        const savedContextV2 = localStorage.getItem(v2ContextKey);
        const savedContextLegacy = localStorage.getItem(legacyContextKey);
        const chosen = savedContextV2 || savedContextLegacy;
        if (chosen) {
          const parsed = JSON.parse(chosen);
          console.log('📂 Loaded context from localStorage:', parsed);
          return parsed;
        }
      } catch (error) {
        console.error('Error loading context from localStorage:', error);
      }
    }
    return {
      location: null,
      check_in_date: null,
      check_out_date: null,
      party_size: null
    };
  };

  const clearConversation = () => {
    if (traveler) {
      const keysToClear = [
        `ai_chat_${traveler.id}_${bookingId || 'general'}`,
        `ai_context_${traveler.id}_${bookingId || 'general'}`,
        `ai_chat_v2_${traveler.id}_${bookingId || 'general'}`,
        `ai_context_v2_${traveler.id}_${bookingId || 'general'}`
      ];
      keysToClear.forEach(k => localStorage.removeItem(k));
      console.log('🗑️ Cleared conversation and context');
      
      // Reset conversation context
      const emptyContext = {
        location: null,
        check_in_date: null,
        check_out_date: null,
        party_size: null
      };
      setConversationContext(emptyContext);
      
      setMessages([{
        id: 1,
        role: 'assistant',
        content: `Hello ${traveler.name}! I'm your AI travel assistant. I can help you plan your trip with personalized recommendations for activities, restaurants, and more. What would you like to know about your upcoming trip?`,
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
  }, [messages, traveler, bookingId]);

  // Reset in-memory chat when the logged-in traveler changes (prevents cross-user carryover)
  useEffect(() => {
    if (!traveler) {
      setMessages([]);
      setConversationContext({
        location: null,
        check_in_date: null,
        check_out_date: null,
        party_size: null
      });
      return;
    }
    // On user switch, start fresh; loading hook below will hydrate from per-user storage if present
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content: `Hello ${traveler.name}! I'm your AI travel assistant. I can help you plan your trip with personalized recommendations for activities, restaurants, and more. What would you like to know about your upcoming trip?`,
        timestamp: new Date()
      }
    ]);
  }, [traveler?.id]);

  useEffect(() => {
    if (isOpen && traveler) {
      const v2Key = `ai_chat_v2_${traveler.id}_${bookingId || 'general'}`;
      const legacyKey = `ai_chat_${traveler.id}_${bookingId || 'general'}`;
      const savedMessages = localStorage.getItem(v2Key) || localStorage.getItem(legacyKey);
      
      // Load context from storage
      const savedContext = loadContextFromStorage();
      setConversationContext(savedContext);
      
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          const messagesWithDates = parsedMessages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          console.log('📂 Loaded messages from localStorage:', messagesWithDates);
          setMessages(messagesWithDates);
        } catch (error) {
          console.error('Error parsing saved messages:', error);
          setMessages([{
            id: 1,
            role: 'assistant',
            content: `Hello ${traveler.name}! I'm your AI travel assistant. I can help you plan your trip with personalized recommendations for activities, restaurants, and more. What would you like to know about your upcoming trip?`,
            timestamp: new Date()
          }]);
        }
      } else {
        setMessages([{
          id: 1,
          role: 'assistant',
          content: `Hello ${traveler.name}! I'm your AI travel assistant. I can help you plan your trip with personalized recommendations for activities, restaurants, and more. What would you like to know about your upcoming trip?`,
          timestamp: new Date()
        }]);
      }
    }
  }, [isOpen, traveler, bookingId]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Store the message before clearing input
    const messageToSend = inputMessage;
    
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    // Add user message to chat
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      console.log('Adding user message:', userMessage);
      return newMessages;
    });
    
    // Clear input and set loading
    setInputMessage('');
    setIsLoading(true);

    // Add a loading message immediately
    const loadingMessageId = Date.now() + 0.5;
    const loadingMessage = {
      id: loadingMessageId,
      role: 'assistant',
      content: '⏳ Thinking... Please wait while I process your request.',
      timestamp: new Date(),
      isLoading: true  // Flag to identify this as temporary
    };

    setMessages(prev => [...prev, loadingMessage]);

    try {
      // Get AI Agent API URL from environment variable
      const AGENT_API_URL = import.meta.env.VITE_AGENT_API_URL || 'http://localhost:8000';

      console.log('🚀 Sending message to AI Agent with traveller_id:', traveler?.id);
      console.log('📤 Message being sent:', messageToSend);

      // Get recent conversation history (last 10 messages, excluding loading messages)
      const conversationHistory = messages
        .filter(msg => !msg.isLoading && msg.role !== 'system')  // Exclude loading and system messages
        .slice(-10)  // Last 10 messages (5 exchanges)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      console.log('💬 Sending conversation history:', conversationHistory.length, 'messages');

      // Call the AI agent chat endpoint which automatically fetches traveller's bookings
      const response = await fetch(`${AGENT_API_URL}/api/ai-agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          traveler_id: traveler?.id || null,
          booking_id: bookingId || null,
          conversation_history: conversationHistory
        })
      });

      console.log('📡 Response received from AI Agent:', response.status);

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Update conversation context from backend's extracted context
      if (data.extracted_context) {
        console.log('🔍 Updating conversation context:', data.extracted_context);
        const newContext = {
          location: data.extracted_context.location || conversationContext.location,
          check_in_date: data.extracted_context.check_in_date || conversationContext.check_in_date,
          check_out_date: data.extracted_context.check_out_date || conversationContext.check_out_date,
          party_size: data.extracted_context.party_size || conversationContext.party_size
        };
        setConversationContext(newContext);
        saveContextToStorage(newContext);
      }
      
      // Format the response to include all the rich data
      let formattedResponse = '';
      
      // Add AI response if available
      if (data.response && data.has_booking !== false) {
        formattedResponse += `## 📝 Travel Recommendations\n\n${data.response}\n\n`;
      } else if (data.response) {
        // If no booking, just show the response without extra formatting
        formattedResponse = data.response;
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

      // Remove loading message and add real response
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isLoading);
        const newMessages = [...filtered, assistantMessage];
        console.log('✅ Removing loading message, adding assistant response');
        console.log('Assistant message:', assistantMessage);
        return newMessages;
      });

    } catch (error) {
      console.error('❌ Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please make sure the AI agent server is running on port 8000 and try again.',
        timestamp: new Date()
      };
      
      // Remove loading message and add error message
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isLoading);
        return [...filtered, errorMessage];
      });
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
              placeholder={isLoading ? "Please wait..." : "Ask me anything about your trip..."}
              disabled={isLoading}
              style={{
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'text'
              }}
            />
            <button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isLoading}
              className="send-button"
              style={{
                opacity: (!inputMessage.trim() || isLoading) ? 0.5 : 1,
                cursor: (!inputMessage.trim() || isLoading) ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? '⏳ Thinking...' : '📤 Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgentPanel;