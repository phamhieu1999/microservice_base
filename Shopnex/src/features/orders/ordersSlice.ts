import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export type OrderItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  sellerId?: string;
};

export type OrderAddress = {
  street?: string;
  city?: string;
  district?: string;
  ward?: string;
};

export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  status: string;
  totalAmount: number;
  discountAmount?: number;
  shippingFee?: number;
  voucherId?: string;
  voucherCode?: string;
  address?: OrderAddress;
  orderGroupId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateOrderPayload = {
  items: OrderItem[];
  voucherCode?: string;
  discountAmount?: number;
  shippingFee?: number;
  address?: OrderAddress;
  orderGroupId?: string;
};

type OrdersState = {
  currentOrder: Order | null;
  orders: Order[];
  status: 'idle' | 'loading' | 'failed';
  createStatus: 'idle' | 'loading' | 'success' | 'failed';
  error: string | null;
};

const initialState: OrdersState = {
  currentOrder: null,
  orders: [],
  status: 'idle',
  createStatus: 'idle',
  error: null,
};

export const createOrder = createAsyncThunk(
  'orders/create',
  async (payload: CreateOrderPayload, { rejectWithValue }) => {
    try {
      const res = await api.post('/orders', payload);
      return res.data as Order;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tạo được đơn hàng',
      );
    }
  },
);

export const getOrder = createAsyncThunk(
  'orders/get',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      return res.data as Order;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tải được đơn hàng',
      );
    }
  },
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
      state.createStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.createStatus = 'loading';
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.createStatus = 'success';
        state.currentOrder = action.payload;
        // Thêm vào danh sách orders
        if (!state.orders.find((o) => o.id === action.payload.id)) {
          state.orders.unshift(action.payload);
        }
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.createStatus = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không tạo được đơn hàng');
      })
      // Get order
      .addCase(getOrder.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getOrder.fulfilled, (state, action) => {
        state.status = 'idle';
        state.currentOrder = action.payload;
        // Cập nhật trong danh sách nếu đã có
        const index = state.orders.findIndex((o) => o.id === action.payload.id);
        if (index >= 0) {
          state.orders[index] = action.payload;
        } else {
          state.orders.unshift(action.payload);
        }
      })
      .addCase(getOrder.rejected, (state, action) => {
        state.status = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không tải được đơn hàng');
      });
  },
});

export const { clearCurrentOrder } = ordersSlice.actions;
export const ordersReducer = ordersSlice.reducer;

