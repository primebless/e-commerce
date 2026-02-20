import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import productsReducer from '../features/productsSlice';
import cartReducer from '../features/cartSlice';
import ordersReducer from '../features/ordersSlice';
import adminReducer from '../features/adminSlice';

// Central Redux store for auth, catalog, cart, orders, and admin data.
export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    orders: ordersReducer,
    admin: adminReducer,
  },
});
