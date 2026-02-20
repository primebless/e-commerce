import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/client';

export const fetchAnalytics = createAsyncThunk('admin/fetchAnalytics', async (_, thunkAPI) => {
  try {
    const { data } = await api.get('/admin/analytics');
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Analytics failed');
  }
});

export const fetchUsers = createAsyncThunk('admin/fetchUsers', async (_, thunkAPI) => {
  try {
    const { data } = await api.get('/admin/users');
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'User list failed');
  }
});

export const fetchAllOrders = createAsyncThunk('admin/fetchAllOrders', async (_, thunkAPI) => {
  try {
    const { data } = await api.get('/orders');
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Order list failed');
  }
});

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    analytics: null,
    users: [],
    orders: [],
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.users = action.payload;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.orders = action.payload;
      });
  },
});

export default adminSlice.reducer;
