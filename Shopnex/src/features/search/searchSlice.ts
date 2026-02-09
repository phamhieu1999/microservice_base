import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export type SearchResult = {
  productId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  category?: string;
  brand?: string;
  sellerId?: string;
  score?: number;
  highlight?: string;
};

export type SearchResponse = {
  results: SearchResult[];
  total: number;
};

export type AutocompleteSuggestion = {
  text: string;
  productId?: string;
};

type SearchState = {
  results: SearchResult[];
  suggestions: AutocompleteSuggestion[];
  query: string;
  total: number;
  status: 'idle' | 'loading' | 'failed' | 'success';
  autocompleteStatus: 'idle' | 'loading' | 'failed';
  error: string | null;
};

const initialState: SearchState = {
  results: [],
  suggestions: [],
  query: '',
  total: 0,
  status: 'idle',
  autocompleteStatus: 'idle',
  error: null,
};

export const searchProducts = createAsyncThunk(
  'search/searchProducts',
  async (
    { query, limit = 20, skip = 0 }: { query: string; limit?: number; skip?: number },
    { rejectWithValue },
  ) => {
    try {
      if (!query || query.trim() === '') {
        return { results: [], total: 0 };
      }
      const res = await api.get('/search', {
        params: { q: query, limit, skip },
      });
      return res.data as SearchResponse;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'Tìm kiếm thất bại');
    }
  },
);

export const getAutocomplete = createAsyncThunk(
  'search/getAutocomplete',
  async ({ query, limit = 10 }: { query: string; limit?: number }) => {
    try {
      if (!query || query.trim() === '') {
        return { suggestions: [] };
      }
      const res = await api.get('/search/autocomplete', {
        params: { q: query, limit },
      });
      return res.data as { suggestions: AutocompleteSuggestion[] };
    } catch (e: any) {
      // Autocomplete failure không nên throw error, chỉ return empty
      return { suggestions: [] };
    }
  },
);

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setQuery: (state, action: { payload: string }) => {
      state.query = action.payload;
    },
    clearResults: (state) => {
      state.results = [];
      state.total = 0;
      state.status = 'idle';
      state.query = '';
    },
    clearSuggestions: (state) => {
      state.suggestions = [];
      state.autocompleteStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      // Search products
      .addCase(searchProducts.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.status = 'success';
        state.results = action.payload.results || [];
        state.total = action.payload.total || 0;
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Tìm kiếm thất bại');
        state.results = [];
        state.total = 0;
      })
      // Autocomplete
      .addCase(getAutocomplete.pending, (state) => {
        state.autocompleteStatus = 'loading';
      })
      .addCase(getAutocomplete.fulfilled, (state, action) => {
        state.autocompleteStatus = 'idle';
        state.suggestions = action.payload.suggestions || [];
      })
      .addCase(getAutocomplete.rejected, (state) => {
        state.autocompleteStatus = 'idle';
        state.suggestions = [];
      });
  },
});

export const { setQuery, clearResults, clearSuggestions } = searchSlice.actions;
export const searchReducer = searchSlice.reducer;

