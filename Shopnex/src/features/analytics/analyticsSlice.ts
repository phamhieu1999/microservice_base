import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export type TotalRevenue = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
};

export type RevenueByPeriod = {
  date: string;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  period: 'daily' | 'weekly' | 'monthly';
}[];

export type TopProduct = {
  productId: string;
  productName: string;
  category?: string;
  sellerId?: string;
  salesCount: number;
  revenue: number;
  conversionRate?: number;
};

type AnalyticsState = {
  totalRevenue: TotalRevenue | null;
  revenueByPeriod: RevenueByPeriod;
  topProducts: TopProduct[];
  status: 'idle' | 'loading' | 'failed';
  revenueStatus: 'idle' | 'loading' | 'failed';
  topProductsStatus: 'idle' | 'loading' | 'failed';
  error: string | null;
};

const initialState: AnalyticsState = {
  totalRevenue: null,
  revenueByPeriod: [],
  topProducts: [],
  status: 'idle',
  revenueStatus: 'idle',
  topProductsStatus: 'idle',
  error: null,
};

export const getTotalRevenue = createAsyncThunk(
  'analytics/getTotalRevenue',
  async ({ startDate, endDate }: { startDate: string; endDate: string }, { rejectWithValue }) => {
    try {
      const res = await api.get('/analytics/revenue/total', {
        params: { startDate, endDate },
      });
      return res.data as TotalRevenue;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tải được tổng doanh thu',
      );
    }
  },
);

export const getRevenueByPeriod = createAsyncThunk(
  'analytics/getRevenueByPeriod',
  async (
    {
      startDate,
      endDate,
      period = 'daily',
    }: { startDate: string; endDate: string; period?: 'daily' | 'weekly' | 'monthly' },
    { rejectWithValue },
  ) => {
    try {
      const res = await api.get('/analytics/revenue', {
        params: { startDate, endDate, period },
      });
      return res.data as RevenueByPeriod;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tải được doanh thu theo kỳ',
      );
    }
  },
);

export const getTopProducts = createAsyncThunk(
  'analytics/getTopProducts',
  async (
    { limit = 10, sortBy = 'sales' }: { limit?: number; sortBy?: 'sales' | 'revenue' } = {},
    { rejectWithValue },
  ) => {
    try {
      const res = await api.get('/analytics/products/top', {
        params: { limit, sortBy },
      });
      // Response có thể là array hoặc object với data/items
      const data = res.data;
      if (Array.isArray(data)) {
        return data as TopProduct[];
      }
      return (data?.data ?? data?.items ?? []) as TopProduct[];
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tải được top sản phẩm',
      );
    }
  },
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalytics: (state) => {
      state.totalRevenue = null;
      state.revenueByPeriod = [];
      state.topProducts = [];
      state.status = 'idle';
      state.revenueStatus = 'idle';
      state.topProductsStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get total revenue
      .addCase(getTotalRevenue.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getTotalRevenue.fulfilled, (state, action) => {
        state.status = 'idle';
        state.totalRevenue = action.payload;
      })
      .addCase(getTotalRevenue.rejected, (state, action) => {
        state.status = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không tải được tổng doanh thu');
      })
      // Get revenue by period
      .addCase(getRevenueByPeriod.pending, (state) => {
        state.revenueStatus = 'loading';
        state.error = null;
      })
      .addCase(getRevenueByPeriod.fulfilled, (state, action) => {
        state.revenueStatus = 'idle';
        state.revenueByPeriod = action.payload;
      })
      .addCase(getRevenueByPeriod.rejected, (state, action) => {
        state.revenueStatus = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không tải được doanh thu theo kỳ');
      })
      // Get top products
      .addCase(getTopProducts.pending, (state) => {
        state.topProductsStatus = 'loading';
        state.error = null;
      })
      .addCase(getTopProducts.fulfilled, (state, action) => {
        state.topProductsStatus = 'idle';
        state.topProducts = action.payload;
      })
      .addCase(getTopProducts.rejected, (state, action) => {
        state.topProductsStatus = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không tải được top sản phẩm');
      });
  },
});

export const { clearAnalytics } = analyticsSlice.actions;
export const analyticsReducer = analyticsSlice.reducer;

