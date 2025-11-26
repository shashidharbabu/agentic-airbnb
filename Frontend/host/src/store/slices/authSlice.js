import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client';

// Async thunks
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.owner) {
        const owner = response.data.owner;
        localStorage.setItem('host_user', JSON.stringify(owner));
        return owner;
      }
      // Fallback to localStorage if API returns success but no owner (unlikely)
      // or if we want to handle cases where API is reachable but cookies missing
      const storedUser = localStorage.getItem('host_user');
      if (storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch (e) {
          console.error('Error parsing stored host user:', e);
        }
      }
      return null;
    } catch (error) {
      // On API error (e.g. 401 due to missing cookies in cross-origin), fallback to localStorage
      const storedUser = localStorage.getItem('host_user');
      if (storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch (e) {
          console.error('Error parsing stored host user:', e);
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
      const response = await api.post('/auth/login', { email, password });
      if (response.data.owner) {
        const owner = response.data.owner;
        localStorage.setItem('host_user', JSON.stringify(owner));
        return owner;
      }
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

export const signup = createAsyncThunk(
  'auth/signup',
  async ({ email, password, name, phone, location }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/signup', { email, password, name, phone, location });
      if (response.data.owner) {
        const owner = response.data.owner;
        localStorage.setItem('host_user', JSON.stringify(owner));
        return owner;
      }
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Signup failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('host_user');
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Logout failed');
    }
  }
);

// Load initial state from localStorage
const loadUserFromStorage = () => {
  try {
    const userStr = localStorage.getItem('host_user');
    if (userStr) {
      return JSON.parse(userStr);
    }
  } catch (error) {
    console.error('Error loading host user from storage:', error);
  }
  return null;
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    currentUser: loadUserFromStorage(),
    loading: true,
    error: null,
    isAuthenticated: !!loadUserFromStorage(),
    bootstrapping: true,
  },
  reducers: {
    updateUser: (state, action) => {
      state.currentUser = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload) {
        localStorage.setItem('host_user', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('host_user');
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
        state.bootstrapping = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.bootstrapping = false;
        state.currentUser = action.payload;
        state.isAuthenticated = !!action.payload;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.bootstrapping = false;
        state.currentUser = null;
        state.isAuthenticated = false;
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
        state.currentUser = action.payload;
        state.isAuthenticated = !!action.payload;
        state.error = null;
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
        state.currentUser = action.payload;
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
        state.currentUser = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { updateUser, clearError } = authSlice.actions;
export default authSlice.reducer;

