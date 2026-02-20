import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/client';

export const createOrder = createAsyncThunk('orders/createOrder', async (payload, thunkAPI) => {
  try {
    const { data } = await api.post('/orders', payload);
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Order creation failed');
  }
});

export const fetchMyOrders = createAsyncThunk('orders/fetchMyOrders', async (_, thunkAPI) => {
  try {
    const { data } = await api.get('/orders/mine');
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load orders');
  }
});

export const fetchOrderById = createAsyncThunk('orders/fetchOrderById', async (id, thunkAPI) => {
  try {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load order');
  }
});

export const markPaid = createAsyncThunk('orders/markPaid', async ({ id, paymentResult }, thunkAPI) => {
  try {
    const { data } = await api.put(`/orders/${id}/pay`, paymentResult);
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Payment update failed');
  }
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    myOrders: [],
    currentOrder: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.myOrders = action.payload;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
      })
      .addCase(markPaid.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
      });
  },
});

export default ordersSlice.reducer;
