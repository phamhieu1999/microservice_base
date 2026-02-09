import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export type UserPoints = {
  userId: string;
  balance: number;
  tier?: string;
  totalPoints?: number;
  availablePoints?: number;
  lifetimePoints?: number;
};

export type PointTransaction = {
  id: string;
  userId: string;
  points: number;
  type: string;
  source?: string;
  referenceId?: string;
  balanceAfter: number;
  createdAt: string;
};

export type RedeemPointsPayload = {
  points: number;
  voucherId?: string;
  description?: string;
};

type LoyaltyState = {
  userPoints: UserPoints | null;
  history: PointTransaction[];
  status: 'idle' | 'loading' | 'failed';
  historyStatus: 'idle' | 'loading' | 'failed';
  redeemStatus: 'idle' | 'loading' | 'success' | 'failed';
  error: string | null;
};

const initialState: LoyaltyState = {
  userPoints: null,
  history: [],
  status: 'idle',
  historyStatus: 'idle',
  redeemStatus: 'idle',
  error: null,
};

export const getPoints = createAsyncThunk(
  'loyalty/getPoints',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/loyalty/points');
      return res.data as UserPoints;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tải được điểm tích lũy',
      );
    }
  },
);

export const getHistory = createAsyncThunk(
  'loyalty/getHistory',
  async ({ limit = 50, skip = 0 }: { limit?: number; skip?: number } = {}, { rejectWithValue }) => {
    try {
      const params: any = {};
      if (limit) params.limit = limit;
      if (skip) params.skip = skip;

      const res = await api.get('/loyalty/history', { params });
      // Response có thể là array hoặc object với items
      const data = res.data;
      if (Array.isArray(data)) {
        return data as PointTransaction[];
      }
      return (data?.items ?? data?.data ?? []) as PointTransaction[];
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tải được lịch sử điểm tích lũy',
      );
    }
  },
);

export const redeemPoints = createAsyncThunk(
  'loyalty/redeem',
  async (payload: RedeemPointsPayload, { rejectWithValue }) => {
    try {
      const res = await api.post('/loyalty/redeem', payload);
      return res.data;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không đổi được điểm tích lũy',
      );
    }
  },
);

const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState,
  reducers: {
    clearLoyalty: (state) => {
      state.userPoints = null;
      state.history = [];
      state.status = 'idle';
      state.historyStatus = 'idle';
      state.redeemStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get points
      .addCase(getPoints.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getPoints.fulfilled, (state, action) => {
        state.status = 'idle';
        state.userPoints = action.payload;
      })
      .addCase(getPoints.rejected, (state, action) => {
        state.status = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không tải được điểm tích lũy');
      })
      // Get history
      .addCase(getHistory.pending, (state) => {
        state.historyStatus = 'loading';
        state.error = null;
      })
      .addCase(getHistory.fulfilled, (state, action) => {
        state.historyStatus = 'idle';
        state.history = action.payload;
      })
      .addCase(getHistory.rejected, (state, action) => {
        state.historyStatus = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không tải được lịch sử điểm tích lũy');
      })
      // Redeem points
      .addCase(redeemPoints.pending, (state) => {
        state.redeemStatus = 'loading';
        state.error = null;
      })
      .addCase(redeemPoints.fulfilled, (state, action) => {
        state.redeemStatus = 'success';
        // Cập nhật balance nếu có trong response
        if (action.payload?.balance !== undefined && state.userPoints) {
          state.userPoints.balance = action.payload.balance;
        } else if (action.payload?.remainingPoints !== undefined && state.userPoints) {
          state.userPoints.balance = action.payload.remainingPoints;
        }
        // Refresh history để hiển thị transaction mới
      })
      .addCase(redeemPoints.rejected, (state, action) => {
        state.redeemStatus = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không đổi được điểm tích lũy');
      });
  },
});

export const { clearLoyalty } = loyaltySlice.actions;
export const loyaltyReducer = loyaltySlice.reducer;

