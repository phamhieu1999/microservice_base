import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';
import type { Product } from '../products/productsSlice';
import type { Order } from '../orders/ordersSlice';

export type HomeFeed = {
  flashSale: {
    results?: Product[];
    total?: number;
  };
  topProducts: {
    data?: Product[];
    total?: number;
  };
  recentOrders: Order[];
};

type HomeState = {
  feed: HomeFeed | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
};

const initialState: HomeState = {
  feed: null,
  status: 'idle',
  error: null,
};

export const fetchHomeFeed = createAsyncThunk(
  'home/fetchFeed',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/home');
      return res.data as HomeFeed;
    } catch (e: any) {
      // Nếu lỗi 401 (unauthorized), vẫn trả về data rỗng thay vì reject
      if (e?.response?.status === 401) {
        return {
          flashSale: { results: [], total: 0 },
          topProducts: { data: [], total: 0 },
          recentOrders: [],
        } as HomeFeed;
      }
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tải được dữ liệu trang chủ',
      );
    }
  },
);

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {
    clearFeed: (state) => {
      state.feed = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeFeed.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchHomeFeed.fulfilled, (state, action) => {
        state.status = 'idle';
        state.feed = action.payload;
      })
      .addCase(fetchHomeFeed.rejected, (state, action) => {
        state.status = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không tải được dữ liệu trang chủ');
      });
  },
});

export const { clearFeed } = homeSlice.actions;
export const homeReducer = homeSlice.reducer;

