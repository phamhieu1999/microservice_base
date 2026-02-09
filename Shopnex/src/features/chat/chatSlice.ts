import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

export type Conversation = {
  id: string;
  buyerId: string;
  sellerId: string;
  lastMessageAt?: string | null;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE';
  createdAt?: string;
};

type ChatState = {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: Message[];
  convStatus: 'idle' | 'loading' | 'failed';
  msgStatus: 'idle' | 'loading' | 'failed';
  sendStatus: 'idle' | 'loading' | 'failed';
  error: string | null;
};

const initialState: ChatState = {
  conversations: [],
  currentConversationId: null,
  messages: [],
  convStatus: 'idle',
  msgStatus: 'idle',
  sendStatus: 'idle',
  error: null,
};

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/conversations');
      const data = res.data;
      // Có thể là array hoặc object with items/data
      const items: any[] = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
      return items as Conversation[];
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tải được danh sách hội thoại',
      );
    }
  },
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/conversations/${conversationId}/messages`);
      const data = res.data;
      const items: any[] = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
      return { conversationId, messages: items as Message[] };
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không tải được tin nhắn',
      );
    }
  },
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    { conversationId, content }: { conversationId: string; content: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await api.post(`/conversations/${conversationId}/messages`, {
        content,
        type: 'TEXT',
      });
      return res.data as Message;
    } catch (e: any) {
      return rejectWithValue(
        e?.response?.data?.message ?? e?.message ?? 'Không gửi được tin nhắn',
      );
    }
  },
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentConversationId: (state, action: { payload: string | null }) => {
      state.currentConversationId = action.payload;
      state.messages = [];
    },
    clearChat: (state) => {
      state.conversations = [];
      state.currentConversationId = null;
      state.messages = [];
      state.convStatus = 'idle';
      state.msgStatus = 'idle';
      state.sendStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.convStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.convStatus = 'idle';
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.convStatus = 'failed';
        state.error = String(
          action.payload ?? action.error.message ?? 'Không tải được danh sách hội thoại',
        );
      })
      // Messages
      .addCase(fetchMessages.pending, (state) => {
        state.msgStatus = 'loading';
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.msgStatus = 'idle';
        // Đảm bảo chỉ set messages nếu conversationId khớp với currentConversationId
        if (state.currentConversationId === action.payload.conversationId) {
          state.messages = action.payload.messages;
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.msgStatus = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không tải được tin nhắn');
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.sendStatus = 'loading';
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.sendStatus = 'idle';
        // Thêm message mới vào đầu danh sách (vì backend sort desc)
        state.messages = [action.payload, ...state.messages];
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.sendStatus = 'failed';
        state.error = String(action.payload ?? action.error.message ?? 'Không gửi được tin nhắn');
      });
  },
});

export const { setCurrentConversationId, clearChat } = chatSlice.actions;
export const chatReducer = chatSlice.reducer;


