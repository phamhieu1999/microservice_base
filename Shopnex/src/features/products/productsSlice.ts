import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  brand?: string;
  sellerId?: string;
};

type ProductsState = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
  q: string;
};

const initialState: ProductsState = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  status: 'idle',
  error: null,
  q: '',
};

export const fetchProducts = createAsyncThunk(
  'products/fetch',
  async (q: string | undefined, { rejectWithValue }) => {
    try {
      const res = await api.get('/products', { params: q ? { q } : undefined });
      const data = res.data as any;

      // Hỗ trợ cả 2 format: mảng thuần hoặc object { items, total, page, limit }
      if (Array.isArray(data)) {
        return {
          items: data as Product[],
          total: data.length,
          page: 1,
          limit: data.length,
        };
      }

      const items = (data?.items ?? []) as Product[];
      return {
        items,
        total: typeof data?.total === 'number' ? data.total : items.length,
        page: typeof data?.page === 'number' ? data.page : 1,
        limit: typeof data?.limit === 'number' ? data.limit : items.length || 20,
      };
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'Không tải được sản phẩm');
    }
  },
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setQuery(state, action: { payload: string }) {
      state.q = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(fetchProducts.fulfilled, (s, a) => {
        s.status = 'idle';
        const payload = a.payload as any;
        if (!payload) {
          s.items = [];
          s.total = 0;
          s.page = 1;
          s.limit = 20;
          return;
        }
        s.items = Array.isArray(payload) ? (payload as Product[]) : (payload.items ?? []);
        s.total = Array.isArray(payload)
          ? (payload as Product[]).length
          : typeof payload.total === 'number'
            ? payload.total
            : s.items.length;
        s.page = !Array.isArray(payload) && typeof payload.page === 'number' ? payload.page : 1;
        s.limit =
          !Array.isArray(payload) && typeof payload.limit === 'number'
            ? payload.limit
            : s.items.length || 20;
      })
      .addCase(fetchProducts.rejected, (s, a) => {
        s.status = 'failed';
        s.error = String(a.payload ?? a.error.message ?? 'Không tải được sản phẩm');
      });
  },
});

export const { setQuery } = productsSlice.actions;
export const productsReducer = productsSlice.reducer;


