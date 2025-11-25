import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/client';

// Async thunks
export const fetchMyProperties = createAsyncThunk(
  'properties/fetchMyProperties',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/properties/mine');
      return response.data.properties || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch properties');
    }
  }
);

export const fetchPropertyDetails = createAsyncThunk(
  'properties/fetchPropertyDetails',
  async (propertyId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/properties/${propertyId}`);
      return response.data.property;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch property');
    }
  }
);

export const createProperty = createAsyncThunk(
  'properties/create',
  async (propertyData, { rejectWithValue }) => {
    try {
      const response = await api.post('/properties', propertyData);
      return response.data.property || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create property');
    }
  }
);

export const updateProperty = createAsyncThunk(
  'properties/update',
  async ({ propertyId, propertyData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/properties/${propertyId}`, propertyData);
      return response.data.property || response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update property');
    }
  }
);

const propertiesSlice = createSlice({
  name: 'properties',
  initialState: {
    properties: [],
    currentProperty: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentProperty: (state) => {
      state.currentProperty = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch My Properties
    builder
      .addCase(fetchMyProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = action.payload;
        state.error = null;
      })
      .addCase(fetchMyProperties.rejected, (state, action) => {
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

    // Create Property
    builder
      .addCase(createProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProperty.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.properties.unshift(action.payload);
        }
        state.error = null;
      })
      .addCase(createProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Property
    builder
      .addCase(updateProperty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProperty.fulfilled, (state, action) => {
        state.loading = false;
        const updatedProperty = action.payload;
        const index = state.properties.findIndex(p => p.id === updatedProperty.id);
        if (index !== -1) {
          state.properties[index] = updatedProperty;
        }
        if (state.currentProperty?.id === updatedProperty.id) {
          state.currentProperty = updatedProperty;
        }
        state.error = null;
      })
      .addCase(updateProperty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentProperty, clearError } = propertiesSlice.actions;
export default propertiesSlice.reducer;

