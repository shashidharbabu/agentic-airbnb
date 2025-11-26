import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import propertiesReducer from './slices/propertiesSlice';
import bookingsReducer from './slices/bookingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    properties: propertiesReducer,
    bookings: bookingsReducer,
  },
  devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools in development
});

// Type exports for TypeScript (if needed in the future)
// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

