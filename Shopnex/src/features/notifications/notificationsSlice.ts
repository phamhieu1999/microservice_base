import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

export type NotificationListResponse = {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type NotificationsState = {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
  status: 'idle' | 'loading' | 'failed';
  unreadStatus: 'idle' | 'loading' | 'failed';
  markStatus: 'idle' | 'loading' | 'failed';
  error: string | null;
};

const initialState: NotificationsState = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
  unreadCount: 0,
  status: 'idle',
  unreadStatus: 'idle',
  markStatus: 'idle',
  error: null,
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async ({ page = 1, limit = 20 }: { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const res = await api.get('/notifications', {
        params: { page, limit },
      });
      return res.data as NotificationListResponse;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tải được danh sách thông báo',
      );
    }
  },
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/notifications/unread-count');
      return (res.data as { count: number }).count ?? 0;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không lấy được số thông báo chưa đọc',
      );
    }
  },
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.post(`/notifications/${id}/read`);
      return id;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không đánh dấu được thông báo',
      );
    }
  },
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.items = [];
      state.total = 0;
      state.page = 1;
      state.totalPages = 0;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // List
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'idle';
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = String(
          action.payload ?? action.error.message ?? 'Không tải được danh sách thông báo',
        );
      })
      // Unread count
      .addCase(fetchUnreadCount.pending, (state) => {
        state.unreadStatus = 'loading';
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadStatus = 'idle';
        state.unreadCount = action.payload;
      })
      .addCase(fetchUnreadCount.rejected, (state) => {
        state.unreadStatus = 'failed';
      })
      // Mark as read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.markStatus = 'loading';
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.markStatus = 'idle';
        const id = action.payload;
        const idx = state.items.findIndex((n) => n.id === id);
        if (idx >= 0) {
          state.items[idx].read = true;
        }
        if (state.unreadCount > 0) {
          state.unreadCount -= 1;
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.markStatus = 'failed';
        state.error = String(
          action.payload ?? action.error.message ?? 'Không đánh dấu được thông báo',
        );
      });
  },
});

export const { clearNotifications } = notificationsSlice.actions;
export const notificationsReducer = notificationsSlice.reducer;


