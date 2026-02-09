import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export type ShippingMethodType = 'STANDARD' | 'EXPRESS' | 'OVERNIGHT' | 'SAME_DAY';
export type ShippingStatus = 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';

export type ShippingMethod = {
  id: string;
  name: string;
  type: ShippingMethodType;
  baseFee: number;
  perItemFee?: number;
  perKgFee?: number;
  estimatedDays: number;
  status: 'ACTIVE' | 'INACTIVE';
  description?: string;
};

export type ShippingQuoteItem = {
  productId: string;
  sellerId?: string;
  price: number;
  quantity: number;
  weight?: number;
};

export type ShippingQuoteRequest = {
  address?: string;
  items: ShippingQuoteItem[];
};

export type ShippingQuote = {
  id: string;
  methodId: string;
  methodName: string;
  baseFee: number;
  itemFee: number;
  weightFee: number;
  totalFee: number;
  estimatedDays: number;
  expiresAt?: string;
};

export type ShippingQuoteResponse = {
  quotes: ShippingQuote[];
  totalQuotes: number;
};

export type ShippingOrder = {
  id: string;
  orderId: string;
  trackingNumber: string;
  status: ShippingStatus;
  methodId: string;
  methodName?: string;
  destinationAddress: string;
  originAddress?: string;
  recipientName?: string;
  recipientPhone?: string;
  carrier?: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  trackingHistory?: TrackingEvent[];
  createdAt?: string;
  updatedAt?: string;
};

export type TrackingEvent = {
  status: ShippingStatus;
  location?: string;
  note?: string;
  timestamp: string;
};

type ShippingState = {
  methods: ShippingMethod[];
  currentQuote: ShippingQuoteResponse | null;
  currentShippingOrder: ShippingOrder | null;
  status: 'idle' | 'loading' | 'failed';
  quoteStatus: 'idle' | 'loading' | 'failed';
  error: string | null;
};

const initialState: ShippingState = {
  methods: [],
  currentQuote: null,
  currentShippingOrder: null,
  status: 'idle',
  quoteStatus: 'idle',
  error: null,
};

export const getShippingMethods = createAsyncThunk(
  'shipping/getMethods',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/shipping/methods');
      return res.data as ShippingMethod[];
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tải được shipping methods',
      );
    }
  },
);

export const calculateShipping = createAsyncThunk(
  'shipping/calculate',
  async (payload: ShippingQuoteRequest, { rejectWithValue }) => {
    try {
      const res = await api.post('/shipping/quote', payload);
      return res.data as ShippingQuoteResponse;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tính được phí vận chuyển',
      );
    }
  },
);

export const getShippingByOrderId = createAsyncThunk(
  'shipping/getByOrderId',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/shipping/orders/order/${orderId}`);
      return res.data as ShippingOrder;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tìm thấy thông tin vận chuyển',
      );
    }
  },
);

export const getShippingByTrackingNumber = createAsyncThunk(
  'shipping/getByTrackingNumber',
  async (trackingNumber: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/shipping/tracking/${trackingNumber}`);
      return res.data as ShippingOrder;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tìm thấy thông tin vận chuyển',
      );
    }
  },
);

const shippingSlice = createSlice({
  name: 'shipping',
  initialState,
  reducers: {
    clearQuote: (state) => {
      state.currentQuote = null;
      state.quoteStatus = 'idle';
    },
    clearShippingOrder: (state) => {
      state.currentShippingOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get shipping methods
      .addCase(getShippingMethods.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getShippingMethods.fulfilled, (state, action) => {
        state.status = 'idle';
        state.methods = action.payload;
      })
      .addCase(getShippingMethods.rejected, (state, action) => {
        state.status = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không tải được shipping methods');
      })
      // Calculate shipping
      .addCase(calculateShipping.pending, (state) => {
        state.quoteStatus = 'loading';
        state.error = null;
      })
      .addCase(calculateShipping.fulfilled, (state, action) => {
        state.quoteStatus = 'idle';
        state.currentQuote = action.payload;
      })
      .addCase(calculateShipping.rejected, (state, action) => {
        state.quoteStatus = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không tính được phí vận chuyển');
      })
      // Get shipping by order ID
      .addCase(getShippingByOrderId.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getShippingByOrderId.fulfilled, (state, action) => {
        state.status = 'idle';
        state.currentShippingOrder = action.payload;
      })
      .addCase(getShippingByOrderId.rejected, (state, action) => {
        state.status = 'failed';
        // Không set error nếu không tìm thấy (404) vì có thể đơn hàng chưa có shipping
        if (action.payload && String(action.payload).includes('404')) {
          state.status = 'idle';
        } else {
          state.error = String(action.payload ?? action.error.message ?? 'Không tìm thấy thông tin vận chuyển');
        }
      })
      // Get shipping by tracking number
      .addCase(getShippingByTrackingNumber.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(getShippingByTrackingNumber.fulfilled, (state, action) => {
        state.status = 'idle';
        state.currentShippingOrder = action.payload;
      })
      .addCase(getShippingByTrackingNumber.rejected, (state, action) => {
        state.status = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không tìm thấy thông tin vận chuyển');
      });
  },
});

export const { clearQuote, clearShippingOrder } = shippingSlice.actions;
export const shippingReducer = shippingSlice.reducer;

