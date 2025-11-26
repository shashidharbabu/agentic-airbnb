import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { propertiesAPI } from '../../services/api';

// Async thunks
export const searchProperties = createAsyncThunk(
  'properties/search',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await propertiesAPI.search(searchParams);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Search failed');
    }
  }
);

export const fetchPropertyDetails = createAsyncThunk(
  'properties/fetchDetails',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await propertiesAPI.getById(propertyId);
      return response.data.property;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch property');
    }
  }
);

export const checkAvailability = createAsyncThunk(
  'properties/checkAvailability',
  async ({ propertyId, checkIn, checkOut }, { rejectWithValue }) => {
    try {
      const response = await propertiesAPI.checkAvailability(propertyId, checkIn, checkOut);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Availability check failed');
    }
  }
);

const propertiesSlice = createSlice({
  name: 'properties',
  initialState: {
    searchResults: [],
    currentProperty: null,
    availability: null,
    loading: false,
    error: null,
    searchParams: null,
  },
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchParams = null;
    },
    clearCurrentProperty: (state) => {
      state.currentProperty = null;
    },
    clearAvailability: (state) => {
      state.availability = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Search Properties
    builder
      .addCase(searchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload.properties || [];
        state.searchParams = action.meta.arg;
        state.error = null;
      })
      .addCase(searchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Property Details
    builder
      .addCase(fetchPropertyDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPropertyDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProperty = action.payload;
        state.error = null;
      })
      .addCase(fetchPropertyDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Check Availability
    builder
      .addCase(checkAvailability.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAvailability.fulfilled, (state, action) => {
        state.loading = false;
        state.availability = action.payload;
        state.error = null;
      })
      .addCase(checkAvailability.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSearchResults, clearCurrentProperty, clearAvailability, clearError } = propertiesSlice.actions;
export default propertiesSlice.reducer;

