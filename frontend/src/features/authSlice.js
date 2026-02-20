import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/client';
import { mergeLocalCartToServer, setCartItems } from './cartSlice';
import { toast } from '../utils/toast';

const initialAuth = JSON.parse(localStorage.getItem('auth') || 'null');

export const signup = createAsyncThunk('auth/signup', async (payload, thunkAPI) => {
  try {
    const { data } = await api.post('/auth/signup', payload);
    await thunkAPI.dispatch(mergeLocalCartToServer(JSON.parse(localStorage.getItem('cart') || '[]')));
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Signup failed');
  }
});

export const login = createAsyncThunk('auth/login', async (payload, thunkAPI) => {
  try {
    const { data } = await api.post('/auth/login', payload);
    await thunkAPI.dispatch(mergeLocalCartToServer(JSON.parse(localStorage.getItem('cart') || '[]')));
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, thunkAPI) => {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Unable to load profile');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (payload, thunkAPI) => {
  try {
    const { data } = await api.put('/auth/me', payload);
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Profile update failed');
  }
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (payload, thunkAPI) => {
  try {
    const { data } = await api.post('/auth/forgot-password', payload);
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Request failed');
  }
});

export const resetPassword = createAsyncThunk('auth/resetPassword', async ({ token, password }, thunkAPI) => {
  try {
    const { data } = await api.post(`/auth/reset-password/${token}`, { password });
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Reset failed');
  }
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, thunkAPI) => {
  try {
    await api.post('/auth/logout');
    thunkAPI.dispatch(setCartItems([]));
    return true;
  } catch (error) {
    thunkAPI.dispatch(setCartItems([]));
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Logout failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialAuth,
    loading: false,
    error: null,
    infoMessage: '',
    showLoginModal: false,
  },
  reducers: {
    openLoginModal: (state) => {
      state.showLoginModal = true;
    },
    closeLoginModal: (state) => {
      state.showLoginModal = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        localStorage.setItem('auth', JSON.stringify(action.payload));
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(String(action.payload));
      })
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.showLoginModal = false;
        localStorage.setItem('auth', JSON.stringify(action.payload));
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(String(action.payload));
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('auth', JSON.stringify(state.user));
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem('auth', JSON.stringify(action.payload));
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.infoMessage = action.payload.message;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.infoMessage = action.payload.message;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        localStorage.removeItem('auth');
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        localStorage.removeItem('auth');
      });
  },
});

export const { openLoginModal, closeLoginModal } = authSlice.actions;
export default authSlice.reducer;
