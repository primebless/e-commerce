import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../api/client';

const initial = JSON.parse(localStorage.getItem('cart') || '[]');
const initialSelection = JSON.parse(localStorage.getItem('cartCheckoutSelection') || 'null')
  || initial.map((item) => item.product);

const persistSelection = (selection) => {
  localStorage.setItem('cartCheckoutSelection', JSON.stringify(selection));
};

export const mergeLocalCartToServer = createAsyncThunk('cart/mergeLocalCartToServer', async (localItems, thunkAPI) => {
  try {
    const payload = {
      items: localItems.map((item) => ({ product: item.product, quantity: item.quantity })),
    };
    const { data } = await api.post('/cart/merge', payload);
    return data.items || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Cart merge failed');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: initial,
    checkoutSelection: initialSelection,
    shippingAddress: JSON.parse(localStorage.getItem('shippingAddress') || 'null'),
    paymentMethod: 'visa',
  },
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existing = state.items.find((x) => x.product === item.product);
      if (existing) {
        existing.quantity = item.quantity;
      } else {
        state.items.push(item);
      }
      localStorage.setItem('cart', JSON.stringify(state.items));
      if (!state.checkoutSelection.includes(item.product)) {
        state.checkoutSelection.push(item.product);
        persistSelection(state.checkoutSelection);
      }
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((x) => x.product !== action.payload);
      state.checkoutSelection = state.checkoutSelection.filter((id) => id !== action.payload);
      localStorage.setItem('cart', JSON.stringify(state.items));
      persistSelection(state.checkoutSelection);
    },
    updateQty: (state, action) => {
      const { productId, quantity } = action.payload;
      const item = state.items.find((x) => x.product === productId);
      if (item) item.quantity = quantity;
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    saveShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
      localStorage.setItem('shippingAddress', JSON.stringify(action.payload));
    },
    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },
    clearCart: (state) => {
      state.items = [];
      state.checkoutSelection = [];
      localStorage.removeItem('cart');
      persistSelection(state.checkoutSelection);
    },
    setCartItems: (state, action) => {
      const hadItemsBefore = state.items.length > 0;
      state.items = action.payload;
      const validIds = new Set(state.items.map((item) => item.product));
      let nextSelection = state.checkoutSelection.filter((id) => validIds.has(id));
      if (!hadItemsBefore && nextSelection.length === 0 && state.items.length > 0) {
        nextSelection = state.items.map((item) => item.product);
      }
      state.checkoutSelection = nextSelection;
      localStorage.setItem('cart', JSON.stringify(action.payload));
      persistSelection(state.checkoutSelection);
    },
    toggleCheckoutItem: (state, action) => {
      const productId = action.payload;
      if (state.checkoutSelection.includes(productId)) {
        state.checkoutSelection = state.checkoutSelection.filter((id) => id !== productId);
      } else {
        state.checkoutSelection.push(productId);
      }
      persistSelection(state.checkoutSelection);
    },
    setCheckoutSelection: (state, action) => {
      state.checkoutSelection = action.payload;
      persistSelection(state.checkoutSelection);
    },
    selectAllCheckoutItems: (state) => {
      state.checkoutSelection = state.items.map((item) => item.product);
      persistSelection(state.checkoutSelection);
    },
    removePurchasedFromCart: (state, action) => {
      const purchasedIds = new Set(action.payload || []);
      state.items = state.items.filter((item) => !purchasedIds.has(item.product));
      state.checkoutSelection = state.checkoutSelection.filter((id) => !purchasedIds.has(id));
      localStorage.setItem('cart', JSON.stringify(state.items));
      persistSelection(state.checkoutSelection);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(mergeLocalCartToServer.fulfilled, (state, action) => {
      state.items = action.payload;
      const validIds = new Set(state.items.map((item) => item.product));
      let nextSelection = state.checkoutSelection.filter((id) => validIds.has(id));
      if (nextSelection.length === 0 && state.items.length > 0) {
        nextSelection = state.items.map((item) => item.product);
      }
      state.checkoutSelection = nextSelection;
      localStorage.removeItem('cart');
      localStorage.setItem('cart', JSON.stringify(action.payload));
      persistSelection(state.checkoutSelection);
    });
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQty,
  saveShippingAddress,
  setPaymentMethod,
  clearCart,
  setCartItems,
  toggleCheckoutItem,
  setCheckoutSelection,
  selectAllCheckoutItems,
  removePurchasedFromCart,
} = cartSlice.actions;
export default cartSlice.reducer;
