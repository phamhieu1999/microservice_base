import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export type PaymentMethod = 'CARD' | 'EWALLET' | 'BANK_TRANSFER' | 'COD';
export type PaymentProvider = 'VNPAY' | 'MOMO' | 'STRIPE' | 'MOCK';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export type Payment = {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  method: PaymentMethod;
  provider: PaymentProvider;
  status: PaymentStatus;
  description?: string;
  idempotencyKey?: string;
  transactionId?: string;
  paymentUrl?: string; // URL để redirect đến payment gateway
  createdAt?: string;
  updatedAt?: string;
};

export type CreatePaymentPayload = {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  provider: PaymentProvider;
  idempotencyKey?: string;
  description?: string;
};

export type RefundPaymentPayload = {
  amount: number;
  reason?: string;
};

type PaymentsState = {
  currentPayment: Payment | null;
  payments: Payment[];
  status: 'idle' | 'loading' | 'failed';
  createStatus: 'idle' | 'loading' | 'success' | 'failed';
  refundStatus: 'idle' | 'loading' | 'success' | 'failed';
  error: string | null;
};

const initialState: PaymentsState = {
  currentPayment: null,
  payments: [],
  status: 'idle',
  createStatus: 'idle',
  refundStatus: 'idle',
  error: null,
};

export const createPayment = createAsyncThunk(
  'payments/create',
  async (payload: CreatePaymentPayload, { rejectWithValue }) => {
    try {
      const res = await api.post('/payments', payload);
      return res.data as Payment;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tạo được payment',
      );
    }
  },
);

export const getPaymentStatus = createAsyncThunk(
  'payments/getStatus',
  async (paymentId: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/payments/${paymentId}`);
      return res.data as Payment;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tải được payment',
      );
    }
  },
);

export const refundPayment = createAsyncThunk(
  'payments/refund',
  async (
    { paymentId, payload }: { paymentId: string; payload: RefundPaymentPayload },
    { rejectWithValue },
  ) => {
    try {
      const res = await api.post(`/payments/${paymentId}/refund`, payload);
      return res.data as Payment;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không hoàn tiền được',
      );
    }
  },
);

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearCurrentPayment: (state) => {
      state.currentPayment = null;
      state.createStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create payment
      .addCase(createPayment.pending, (state) => {
        state.createStatus = 'loading';
        state.error = null;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.createStatus = 'success';
        state.currentPayment = action.payload;
        // Thêm vào danh sách payments
        if (!state.payments.find((p) => p.id === action.payload.id)) {
          state.payments.unshift(action.payload);
        }
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không tạo được payment');
      })
      // Get payment status
      .addCase(getPaymentStatus.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getPaymentStatus.fulfilled, (state, action) => {
        state.status = 'idle';
        state.currentPayment = action.payload;
        // Cập nhật trong danh sách nếu đã có
        const index = state.payments.findIndex((p) => p.id === action.payload.id);
        if (index >= 0) {
          state.payments[index] = action.payload;
        } else {
          state.payments.unshift(action.payload);
        }
      })
      .addCase(getPaymentStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không tải được payment');
      })
      // Refund payment
      .addCase(refundPayment.pending, (state) => {
        state.refundStatus = 'loading';
        state.error = null;
      })
      .addCase(refundPayment.fulfilled, (state, action) => {
        state.refundStatus = 'success';
        state.currentPayment = action.payload;
        // Cập nhật trong danh sách
        const index = state.payments.findIndex((p) => p.id === action.payload.id);
        if (index >= 0) {
          state.payments[index] = action.payload;
        }
      })
      .addCase(refundPayment.rejected, (state, action) => {
        state.refundStatus = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không hoàn tiền được');
      });
  },
});

export const { clearCurrentPayment } = paymentsSlice.actions;
export const paymentsReducer = paymentsSlice.reducer;

