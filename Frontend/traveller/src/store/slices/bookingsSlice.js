import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingsAPI, favoritesAPI } from '../../services/api';

// Async thunks for bookings
export const createBooking = createAsyncThunk(
  'bookings/create',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await bookingsAPI.create(bookingData);
      return response.data.booking;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Booking creation failed');
    }
  }
);

export const fetchTravelerBookings = createAsyncThunk(
  'bookings/fetchTravelerBookings',
  async ({ travelerId, status }, { rejectWithValue }) => {
    try {
      const response = await bookingsAPI.getTravelerBookings(travelerId, status);
      return response.data.bookings || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch bookings');
    }
  }
);

export const fetchBookingDetails = createAsyncThunk(
  'bookings/fetchDetails',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await bookingsAPI.getById(bookingId);
      return response.data.booking;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch booking');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancel',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await bookingsAPI.cancel(bookingId);
      return bookingId; // Return ID to update in state
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Booking cancellation failed');
    }
  }
);

// Async thunks for favorites
export const addFavorite = createAsyncThunk(
  'bookings/addFavorite',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await favoritesAPI.add(propertyId);
      return response.data.property;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to add favorite');
    }
  }
);

export const removeFavorite = createAsyncThunk(
  'bookings/removeFavorite',
  async (propertyId, { rejectWithValue }) => {
    try {
      await favoritesAPI.remove(propertyId);
      return propertyId; // Return ID to remove from state
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to remove favorite');
    }
  }
);

export const fetchFavorites = createAsyncThunk(
  'bookings/fetchFavorites',
  async ({ travelerId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await favoritesAPI.getTravelerFavorites(travelerId, page, limit);
      return response.data.favorites || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch favorites');
    }
  }
);

export const checkFavorite = createAsyncThunk(
  'bookings/checkFavorite',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await favoritesAPI.check(propertyId);
      return { propertyId, isFavorite: response.data.is_favorite || false };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to check favorite');
    }
  }
);

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState: {
    bookings: [],
    currentBooking: null,
    favorites: [],
    loading: false,
    error: null,
  },
  reducers: {
    updateBookingStatus: (state, action) => {
      const { bookingId, status } = action.payload;
      const booking = state.bookings.find(b => b.id === bookingId);
      if (booking) {
        booking.status = status;
      }
      if (state.currentBooking?.id === bookingId) {
        state.currentBooking.status = status;
      }
    },
    clearBookings: (state) => {
      state.bookings = [];
    },
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
    clearFavorites: (state) => {
      state.favorites = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Create Booking
    builder
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings.unshift(action.payload); // Add to beginning
        state.error = null;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Traveler Bookings
    builder
      .addCase(fetchTravelerBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTravelerBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
        state.error = null;
      })
      .addCase(fetchTravelerBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Booking Details
    builder
      .addCase(fetchBookingDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
        state.error = null;
      })
      .addCase(fetchBookingDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Cancel Booking
    builder
      .addCase(cancelBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.loading = false;
        const booking = state.bookings.find(b => b.id === action.payload);
        if (booking) {
          booking.status = 'CANCELLED';
        }
        if (state.currentBooking?.id === action.payload) {
          state.currentBooking.status = 'CANCELLED';
        }
        state.error = null;
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Add Favorite
    builder
      .addCase(addFavorite.fulfilled, (state, action) => {
        if (!state.favorites.find(f => f.id === action.payload.id)) {
          state.favorites.push(action.payload);
        }
      });

    // Remove Favorite
    builder
      .addCase(removeFavorite.fulfilled, (state, action) => {
        state.favorites = state.favorites.filter(f => f.id !== action.payload);
      });

    // Fetch Favorites
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.favorites = action.payload;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  updateBookingStatus, 
  clearBookings, 
  clearCurrentBooking, 
  clearFavorites, 
  clearError 
} = bookingsSlice.actions;
export default bookingsSlice.reducer;

