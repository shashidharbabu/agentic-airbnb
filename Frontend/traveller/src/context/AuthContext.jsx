import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [traveler, setTraveler] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await authAPI.checkAuth();
      if (response.data.authenticated) {
        setTraveler(response.data.traveler);
        localStorage.setItem('traveler', JSON.stringify(response.data.traveler));
      } else {
        setTraveler(null);
        localStorage.removeItem('traveler');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setTraveler(null);
      localStorage.removeItem('traveler');
    } finally {
      setLoading(false);
    }
  };

  const initializeUserData = (traveler) => {
    try {
      localStorage.setItem('favorites', JSON.stringify([]));
      localStorage.setItem('bookings', JSON.stringify([]));
      localStorage.setItem('travelerProfile', JSON.stringify({
        name: traveler.name,
        email: traveler.email,
        phone: '',
        about: '',
        city: '',
        state_abbr: '',
        country: '',
        languages: [],
        gender: '',
        profile_image_url: null
      }));
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('AuthContext: Attempting login...');
      const response = await authAPI.login({ email, password });
      console.log('AuthContext: Login response:', response);
      console.log('AuthContext: Cookies after login:', document.cookie);
      
      if (response.data.traveler) {
        console.log('AuthContext: Login successful, setting traveler');
        setTraveler(response.data.traveler);
        localStorage.setItem('traveler', JSON.stringify(response.data.traveler));
        
        return { success: true, data: response.data };
      }
      console.log('AuthContext: No traveler in response, login failed');
      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.log('AuthContext: Login error:', error);
      const errorMessage = error.response?.data?.error || 'Login failed';
      console.log('AuthContext: Returning error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signup = async (email, password, name) => {
    try {
      console.log('Attempting signup with:', { email, name });
      const response = await authAPI.signup({ email, password, name });
      console.log('Signup response:', response);
      if (response.data.traveler) {
        setTraveler(response.data.traveler);
        localStorage.setItem('traveler', JSON.stringify(response.data.traveler));
        
        initializeUserData(response.data.traveler);
        
        return { success: true, data: response.data };
      }
      console.log('No traveler in response:', response.data);
      return { success: false, error: 'Signup failed' };
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = error.response?.data?.error || 'Signup failed';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setTraveler(null);
      localStorage.removeItem('traveler');
    }
  };

  const updateTraveler = (updatedTraveler) => {
    setTraveler(updatedTraveler);
    localStorage.setItem('traveler', JSON.stringify(updatedTraveler));
  };

  const value = {
    traveler,
    loading,
    login,
    signup,
    logout,
    updateTraveler,
    isAuthenticated: !!traveler,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
