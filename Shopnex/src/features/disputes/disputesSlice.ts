import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export type DisputeStatus = 'OPEN' | 'SELLER_RESPONDED' | 'ESCALATED' | 'RESOLVED' | 'REJECTED';

export type Dispute = {
  id: string;
  orderId: string;
  userId: string;
  sellerId: string;
  status: DisputeStatus;
  reasonCode: string;
  description?: string;
  attachments?: any;
  resolution?: string;
  createdAt?: string;
  updatedAt?: string;
  escalatedAt?: string;
  resolvedAt?: string;
};

export type DisputeListResponse = {
  items: Dispute[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type CreateDisputePayload = {
  orderId: string;
  userId: string;
  sellerId: string;
  reasonCode: string;
  description?: string;
  attachments?: any;
};

type DisputesState = {
  items: Dispute[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  current: Dispute | null;
  status: 'idle' | 'loading' | 'failed';
  createStatus: 'idle' | 'loading' | 'success' | 'failed';
  detailStatus: 'idle' | 'loading' | 'failed';
  error: string | null;
};

const initialState: DisputesState = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
  current: null,
  status: 'idle',
  createStatus: 'idle',
  detailStatus: 'idle',
  error: null,
};

export const createDispute = createAsyncThunk(
  'disputes/create',
  async (payload: CreateDisputePayload, { rejectWithValue }) => {
    try {
      const res = await api.post('/disputes', payload);
      return res.data as Dispute;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tạo được khiếu nại',
      );
    }
  },
);

export const getDisputesByUser = createAsyncThunk(
  'disputes/getByUser',
  async (
    { userId, page = 1, limit = 20 }: { userId: string; page?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      const res = await api.get(`/disputes/user/${userId}`, { params: { page, limit } });
      const data = res.data;
      // Expected from dispute-service: { items, total, page, limit, totalPages }
      return data as DisputeListResponse;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tải được danh sách khiếu nại',
      );
    }
  },
);

export const getDisputeById = createAsyncThunk(
  'disputes/getById',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/disputes/${id}`);
      return res.data as Dispute;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tải được chi tiết khiếu nại',
      );
    }
  },
);

const disputesSlice = createSlice({
  name: 'disputes',
  initialState,
  reducers: {
    clearDisputes: (state) => {
      state.items = [];
      state.total = 0;
      state.page = 1;
      state.limit = 20;
      state.totalPages = 0;
      state.status = 'idle';
      state.error = null;
    },
    clearCurrentDispute: (state) => {
      state.current = null;
      state.detailStatus = 'idle';
      state.createStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // list
      .addCase(getDisputesByUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getDisputesByUser.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload.items ?? [];
        state.total = action.payload.total ?? state.items.length;
        state.page = action.payload.page ?? 1;
        state.limit = action.payload.limit ?? 20;
        state.totalPages = action.payload.totalPages ?? 0;
      })
      .addCase(getDisputesByUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = String(
          action.payload ?? action.error.message ?? 'Không tải được danh sách khiếu nại',
        );
      })
      // detail
      .addCase(getDisputeById.pending, (state) => {
        state.detailStatus = 'loading';
        state.error = null;
      })
      .addCase(getDisputeById.fulfilled, (state, action) => {
        state.detailStatus = 'idle';
        state.current = action.payload;
      })
      .addCase(getDisputeById.rejected, (state, action) => {
        state.detailStatus = 'failed';
        state.error = String(
          action.payload ?? action.error.message ?? 'Không tải được chi tiết khiếu nại',
        );
      })
      // create
      .addCase(createDispute.pending, (state) => {
        state.createStatus = 'loading';
        state.error = null;
      })
      .addCase(createDispute.fulfilled, (state, action) => {
        state.createStatus = 'success';
        // prepend for instant feedback
        state.items = [action.payload, ...state.items];
        state.total += 1;
      })
      .addCase(createDispute.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không tạo được khiếu nại');
      });
  },
});

export const { clearDisputes, clearCurrentDispute } = disputesSlice.actions;
export const disputesReducer = disputesSlice.reducer;


