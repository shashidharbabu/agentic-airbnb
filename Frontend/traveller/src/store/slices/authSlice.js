import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

// Async thunks for API calls
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.checkAuth();
      if (response.data.authenticated) {
        const traveler = response.data.traveler;
        // Store in localStorage for persistence
        localStorage.setItem('traveler', JSON.stringify(traveler));
        return traveler;
      }
      // If not authenticated via API, check localStorage as fallback
      // This handles cross-origin cookie issues
      const storedTraveler = localStorage.getItem('traveler');
      if (storedTraveler) {
        try {
          return JSON.parse(storedTraveler);
        } catch (e) {
          console.error('Error parsing stored traveler:', e);
        }
      }
      return null;
    } catch (error) {
      // On API error, fallback to localStorage
      const storedTraveler = localStorage.getItem('traveler');
      if (storedTraveler) {
        try {
          return JSON.parse(storedTraveler);
        } catch (e) {
          console.error('Error parsing stored traveler:', e);
        }
      }
      return rejectWithValue(error.response?.data?.error || 'Auth check failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login({ email, password });
      if (response.data.traveler) {
        const traveler = response.data.traveler;
        localStorage.setItem('traveler', JSON.stringify(traveler));
        return traveler;
      }
      return rejectWithValue('Login failed');
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

export const signup = createAsyncThunk(
  'auth/signup',
  async ({ email, password, name }, { rejectWithValue }) => {
    try {
      const response = await authAPI.signup({ email, password, name });
      if (response.data.traveler) {
        const traveler = response.data.traveler;
        localStorage.setItem('traveler', JSON.stringify(traveler));
        // Initialize user data
        initializeUserData(traveler);
        return traveler;
      }
      return rejectWithValue('Signup failed');
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Signup failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      localStorage.removeItem('traveler');
      // Clear AI chat data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('ai_chat') || key.startsWith('ai_context')) {
          localStorage.removeItem(key);
        }
      });
      localStorage.removeItem('ai_last_user_id');
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Logout failed');
    }
  }
);

// Helper function to initialize user data
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

// Load traveler from localStorage on initialization
const loadTravelerFromStorage = () => {
  try {
    const travelerStr = localStorage.getItem('traveler');
    if (travelerStr) {
      return JSON.parse(travelerStr);
    }
  } catch (error) {
    console.error('Error loading traveler from storage:', error);
  }
  return null;
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    traveler: loadTravelerFromStorage(),
    loading: false,
    error: null,
    isAuthenticated: !!loadTravelerFromStorage(),
  },
  reducers: {
    updateTraveler: (state, action) => {
      state.traveler = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload) {
        localStorage.setItem('traveler', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('traveler');
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Check Auth
    builder
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        // Only update traveler/auth state if we got a valid payload
        // This prevents clearing state when checkAuth returns null but we're already logged in
        if (action.payload) {
          state.traveler = action.payload;
          state.isAuthenticated = true;
        } else if (!state.traveler) {
          // Only clear if we don't already have a traveler
          state.traveler = null;
          state.isAuthenticated = false;
        }
        // If action.payload is null but state.traveler exists, keep existing state
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        // Don't clear traveler/auth state on checkAuth rejection
        // The thunk already handles localStorage fallback
        // If we got here with a traveler in state, keep it
        if (!state.traveler) {
          state.isAuthenticated = false;
        }
        state.error = action.payload;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.traveler = action.payload;
        state.isAuthenticated = !!action.payload;
        state.error = null;
        // Clear AI chat data from previous sessions
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('ai_chat') || key.startsWith('ai_context')) {
            localStorage.removeItem(key);
          }
        });
        if (action.payload) {
          localStorage.setItem('ai_last_user_id', String(action.payload.id));
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Signup
    builder
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.traveler = action.payload;
        state.isAuthenticated = !!action.payload;
        state.error = null;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.traveler = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { updateTraveler, clearError } = authSlice.actions;
export default authSlice.reducer;

