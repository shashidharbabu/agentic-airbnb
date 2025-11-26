import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client';

// Async thunks
export const fetchIncomingBookings = createAsyncThunk(
  'bookings/fetchIncoming',
  async ({ status = 'PENDING' }, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings/incoming', { params: { status } });
      return response.data.bookings || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch bookings');
    }
  }
);

export const acceptBooking = createAsyncThunk(
  'bookings/accept',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/accept`);
      return response.data.booking;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to accept booking');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'bookings/cancel',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/cancel`);
      return response.data.booking;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to cancel booking');
    }
  }
);

export const fetchPropertyBookings = createAsyncThunk(
  'bookings/fetchPropertyBookings',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/bookings/property/${propertyId}`);
      return response.data.bookings || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch property bookings');
    }
  }
);

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState: {
    incomingBookings: [],
    propertyBookings: {},
    loading: false,
    error: null,
  },
  reducers: {
    updateBookingStatus: (state, action) => {
      const { bookingId, status } = action.payload;
      const booking = state.incomingBookings.find(b => b.id === bookingId);
      if (booking) {
        booking.status = status;
      }
    },
    clearBookings: (state) => {
      state.incomingBookings = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Incoming Bookings
    builder
      .addCase(fetchIncomingBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIncomingBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.incomingBookings = action.payload;
        state.error = null;
      })
      .addCase(fetchIncomingBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Accept Booking
    builder
      .addCase(acceptBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acceptBooking.fulfilled, (state, action) => {
        state.loading = false;
        const booking = state.incomingBookings.find(b => b.id === action.payload.id);
        if (booking) {
          booking.status = 'ACCEPTED';
        }
        state.error = null;
      })
      .addCase(acceptBooking.rejected, (state, action) => {
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
        const booking = state.incomingBookings.find(b => b.id === action.payload.id);
        if (booking) {
          booking.status = 'CANCELLED';
        }
        state.error = null;
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Property Bookings
    builder
      .addCase(fetchPropertyBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPropertyBookings.fulfilled, (state, action) => {
        state.loading = false;
        // Store bookings by property ID
        const propertyId = action.meta.arg;
        state.propertyBookings[propertyId] = action.payload;
      })
      .addCase(fetchPropertyBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { updateBookingStatus, clearBookings, clearError } = bookingsSlice.actions;
export default bookingsSlice.reducer;

