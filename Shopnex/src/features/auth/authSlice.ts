import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../lib/api';
import { readTokens, writeTokens } from '../../lib/authStorage';

export type AuthUser = {
  id: string;
  email: string;
  username?: string;
  role?: string;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: 'idle' | 'loading' | 'failed';
  error: string | null;
};

const initialTokens = readTokens();

const initialState: AuthState = {
  user: null,
  accessToken: initialTokens?.accessToken ?? null,
  refreshToken: initialTokens?.refreshToken ?? null,
  status: 'idle',
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (body: { email?: string; username?: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', body);
      const accessToken = res.data?.accessToken as string | undefined;
      const refreshToken = res.data?.refreshToken as string | undefined;
      const user = res.data?.user as AuthUser | undefined;
      if (!accessToken || !refreshToken) throw new Error('Thiếu token từ server');
      writeTokens({ accessToken, refreshToken });
      return { accessToken, refreshToken, user: user ?? null };
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'Đăng nhập thất bại');
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (body: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/register', body);
      const accessToken = res.data?.accessToken as string | undefined;
      const refreshToken = res.data?.refreshToken as string | undefined;
      const user = res.data?.user as AuthUser | undefined;
      if (!accessToken || !refreshToken) throw new Error('Thiếu token từ server');
      writeTokens({ accessToken, refreshToken });
      return { accessToken, refreshToken, user: user ?? null };
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.message ?? e?.message ?? 'Đăng ký thất bại');
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    writeTokens(null);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(login.fulfilled, (s, a) => {
        s.status = 'idle';
        s.accessToken = a.payload.accessToken;
        s.refreshToken = a.payload.refreshToken;
        s.user = a.payload.user;
      })
      .addCase(login.rejected, (s, a) => {
        s.status = 'failed';
        s.error = String(a.payload ?? a.error.message ?? 'Đăng nhập thất bại');
      })
      .addCase(register.pending, (s) => {
        s.status = 'loading';
        s.error = null;
      })
      .addCase(register.fulfilled, (s, a) => {
        s.status = 'idle';
        s.accessToken = a.payload.accessToken;
        s.refreshToken = a.payload.refreshToken;
        s.user = a.payload.user;
      })
      .addCase(register.rejected, (s, a) => {
        s.status = 'failed';
        s.error = String(a.payload ?? a.error.message ?? 'Đăng ký thất bại');
      })
      .addCase(logout.fulfilled, (s) => {
        s.user = null;
        s.accessToken = null;
        s.refreshToken = null;
        s.status = 'idle';
        s.error = null;
      });
  },
});

export const authReducer = authSlice.reducer;


