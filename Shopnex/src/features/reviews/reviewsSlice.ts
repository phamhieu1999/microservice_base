import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export type Review = {
  id: string;
  productId: string;
  userId: string;
  userName?: string;
  rating: number;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ReviewStats = {
  total: number;
  average: number;
  distribution: {
    rating: number;
    count: number;
    percentage: number;
  }[];
};

export type ReviewListResponse = {
  items: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CreateReviewPayload = {
  productId: string;
  rating: number;
  content?: string;
};

export type UpdateReviewPayload = {
  rating?: number;
  content?: string;
};

type ReviewsState = {
  reviews: Review[];
  currentReview: Review | null;
  stats: ReviewStats | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  status: 'idle' | 'loading' | 'failed';
  createStatus: 'idle' | 'loading' | 'success' | 'failed';
  updateStatus: 'idle' | 'loading' | 'success' | 'failed';
  error: string | null;
};

const initialState: ReviewsState = {
  reviews: [],
  currentReview: null,
  stats: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  status: 'idle',
  createStatus: 'idle',
  updateStatus: 'idle',
  error: null,
};

export const getReviewsByProduct = createAsyncThunk(
  'reviews/getByProduct',
  async (
    { productId, page = 1, limit = 20, rating, sortBy, sortOrder }: {
      productId: string;
      page?: number;
      limit?: number;
      rating?: number;
      sortBy?: string;
      sortOrder?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const params: any = { page, limit };
      if (rating) params.rating = rating;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;

      const res = await api.get(`/products/${productId}/reviews`, { params });
      return res.data as ReviewListResponse;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tải được reviews',
      );
    }
  },
);

export const getReviewStats = createAsyncThunk(
  'reviews/getStats',
  async (productId: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/products/${productId}/reviews/stats`);
      return res.data as ReviewStats;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tải được thống kê reviews',
      );
    }
  },
);

export const createReview = createAsyncThunk(
  'reviews/create',
  async (payload: CreateReviewPayload, { rejectWithValue }) => {
    try {
      const res = await api.post('/reviews', payload);
      return res.data as Review;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tạo được review',
      );
    }
  },
);

export const updateReview = createAsyncThunk(
  'reviews/update',
  async ({ reviewId, payload }: { reviewId: string; payload: UpdateReviewPayload }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/reviews/${reviewId}`, payload);
      return res.data as Review;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không cập nhật được review',
      );
    }
  },
);

export const deleteReview = createAsyncThunk(
  'reviews/delete',
  async (reviewId: string, { rejectWithValue }) => {
    try {
      await api.delete(`/reviews/${reviewId}`);
      return reviewId;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không xóa được review',
      );
    }
  },
);

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearReviews: (state) => {
      state.reviews = [];
      state.stats = null;
      state.pagination = initialState.pagination;
    },
    clearCurrentReview: (state) => {
      state.currentReview = null;
      state.createStatus = 'idle';
      state.updateStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      // Get reviews by product
      .addCase(getReviewsByProduct.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getReviewsByProduct.fulfilled, (state, action) => {
        state.status = 'idle';
        const payload = action.payload as any;
        // Handle different response formats
        let reviews: Review[] = [];
        if (payload?.data && Array.isArray(payload.data)) {
          reviews = payload.data;
        } else if (payload?.items && Array.isArray(payload.items)) {
          reviews = payload.items;
        } else if (Array.isArray(payload)) {
          reviews = payload;
        }
        
        // Nếu đang ở page 1, replace toàn bộ. Nếu không, append
        if (payload?.pagination?.page === 1 || !payload?.pagination) {
          state.reviews = reviews;
        } else {
          // Append cho pagination
          const existingIds = new Set(state.reviews.map(r => r.id));
          const newReviews = reviews.filter(r => !existingIds.has(r.id));
          state.reviews = [...state.reviews, ...newReviews];
        }
        
        state.pagination = {
          page: payload?.pagination?.page || payload?.page || 1,
          limit: payload?.pagination?.limit || payload?.limit || 10,
          total: payload?.pagination?.total || payload?.total || reviews.length,
          totalPages: payload?.pagination?.totalPages || payload?.totalPages || 1,
        };
        
        // Sort by createdAt desc to ensure newest first
        state.reviews.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
      })
      .addCase(getReviewsByProduct.rejected, (state, action) => {
        state.status = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không tải được reviews');
      })
      // Get review stats
      .addCase(getReviewStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // Create review
      .addCase(createReview.pending, (state) => {
        state.createStatus = 'loading';
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.createStatus = 'success';
        state.currentReview = action.payload;
        // Kiểm tra xem review đã có trong danh sách chưa (nếu update)
        const existingIndex = state.reviews.findIndex((r) => r.id === action.payload.id);
        if (existingIndex >= 0) {
          // Update existing review
          state.reviews[existingIndex] = action.payload;
        } else {
          // Thêm review mới vào đầu danh sách
          state.reviews.unshift(action.payload);
          // Cập nhật pagination
          state.pagination.total += 1;
          state.pagination.totalPages = Math.ceil(state.pagination.total / state.pagination.limit);
        }
        // Cập nhật stats nếu có
        if (state.stats) {
          if (existingIndex < 0) {
            // Chỉ tăng total nếu là review mới
            state.stats.total += 1;
          }
          // Recalculate average
          const totalRating = state.reviews.reduce((sum, r) => sum + r.rating, 0);
          state.stats.average = totalRating / state.stats.total;
        }
      })
      .addCase(createReview.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không tạo được review');
      })
      // Update review
      .addCase(updateReview.pending, (state) => {
        state.updateStatus = 'loading';
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.updateStatus = 'success';
        state.currentReview = action.payload;
        // Cập nhật trong danh sách
        const index = state.reviews.findIndex((r) => r.id === action.payload.id);
        if (index >= 0) {
          state.reviews[index] = action.payload;
        }
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không cập nhật được review');
      })
      // Delete review
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.reviews = state.reviews.filter((r) => r.id !== action.payload);
        // Cập nhật stats nếu có
        if (state.stats && state.stats.total > 0) {
          state.stats.total -= 1;
        }
      });
  },
});

export const { clearReviews, clearCurrentReview } = reviewsSlice.actions;
export const reviewsReducer = reviewsSlice.reducer;

