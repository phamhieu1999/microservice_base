import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export type CartItem = {
  productId: string;
  quantity: number;
  price: number;
};

export type CartResponse = {
  userId?: string;
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
};

type CartState = {
  cart: CartResponse | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
};

const initialState: CartState = {
  cart: null,
  status: 'idle',
  error: null,
};

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/cart');
    return res.data as CartResponse;
  } catch (e: any) {
    return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'Không tải được giỏ hàng');
  }
});

export const upsertCartItem = createAsyncThunk(
  'cart/upsertItem',
  async (body: CartItem, { rejectWithValue }) => {
    try {
      const res = await api.post('/cart/items', body);
      return res.data as CartResponse;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'Không cập nhật được giỏ hàng');
    }
  },
);

export const removeCartItem = createAsyncThunk(
  'cart/removeItem',
  async (productId: string, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/cart/items/${productId}`);
      return res.data as CartResponse;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'Không xoá được item');
    }
  },
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(fetchCart.fulfilled, (s, a) => {
        s.status = 'idle';
        s.cart = a.payload;
      })
      .addCase(fetchCart.rejected, (s, a) => {
        s.status = 'failed';
        s.error = String(a.payload ?? a.error.message ?? 'Không tải được giỏ hàng');
      })
      .addCase(upsertCartItem.fulfilled, (s, a) => {
        s.cart = a.payload;
      })
      .addCase(removeCartItem.fulfilled, (s, a) => {
        s.cart = a.payload;
      });
  },
});

export const cartReducer = cartSlice.reducer;


