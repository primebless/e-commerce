import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/client';

export const fetchProducts = createAsyncThunk('products/fetchProducts', async (queryParams, thunkAPI) => {
  try {
    const { data } = await api.get('/products', { params: queryParams });
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Unable to fetch products');
  }
});

export const fetchProductDetail = createAsyncThunk('products/fetchProductDetail', async (id, thunkAPI) => {
  try {
    const { data } = await api.get(`/products/${id}`);
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Unable to fetch product');
  }
});

export const createReview = createAsyncThunk('products/createReview', async ({ id, rating, comment }, thunkAPI) => {
  try {
    const { data } = await api.post(`/products/${id}/reviews`, { rating, comment });
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Unable to save review');
  }
});

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    page: 1,
    pages: 1,
    total: 0,
    productDetail: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.products;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
        state.total = action.payload.total;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProductDetail.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.productDetail = action.payload;
      })
      .addCase(fetchProductDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default productsSlice.reducer;
