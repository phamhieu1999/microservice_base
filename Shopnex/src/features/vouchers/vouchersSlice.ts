import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export type VoucherValidationResult = {
  voucherId: string;
  discountAmount: number;
  finalAmount: number;
};

type VouchersState = {
  currentVoucher: VoucherValidationResult | null;
  status: 'idle' | 'loading' | 'success' | 'failed';
  error: string | null;
};

const initialState: VouchersState = {
  currentVoucher: null,
  status: 'idle',
  error: null,
};

export const validateVoucher = createAsyncThunk(
  'vouchers/validate',
  async (
    payload: {
      code: string;
      items: { productId: string; price: number; quantity: number; sellerId?: string }[];
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await api.post('/vouchers/validate', {
        code: payload.code,
        items: payload.items,
      });
      return res.data as VoucherValidationResult;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không validate được mã giảm giá',
      );
    }
  },
);

const vouchersSlice = createSlice({
  name: 'vouchers',
  initialState,
  reducers: {
    clearVoucher: (state) => {
      state.currentVoucher = null;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(validateVoucher.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(validateVoucher.fulfilled, (state, action) => {
        state.status = 'success';
        state.currentVoucher = action.payload;
      })
      .addCase(validateVoucher.rejected, (state, action) => {
        state.status = 'failed';
        state.error = String(
          action.payload ?? action.error.message ?? 'Không validate được mã giảm giá',
        );
        state.currentVoucher = null;
      });
  },
});

export const { clearVoucher } = vouchersSlice.actions;
export const vouchersReducer = vouchersSlice.reducer;


