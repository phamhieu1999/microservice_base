import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Lock, Mail, User } from 'lucide-react';
import { cn } from '../ui/cn';
import { env } from '../lib/env';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const { status, error, accessToken } = useAppSelector((s) => s.auth);

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('StrongPassword123!');
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (mode === 'login') {
      const r = await dispatch(login({ email, password }));
      if (login.fulfilled.match(r)) nav('/');
    } else {
      const r = await dispatch(register({ email, password }));
      if (register.fulfilled.match(r)) nav('/');
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-6xl flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {accessToken && (
          <div className="mb-4 rounded-2xl border bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            Bạn đang đăng nhập. Vào{" "}
            <a className="font-semibold underline" href="/">
              trang sản phẩm
            </a>
            .
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="mb-3 flex gap-1 rounded-xl bg-slate-100 p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={cn(
                  'flex-1 rounded-lg px-3 py-1.5 transition',
                  mode === 'login' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500',
                )}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={cn(
                  'flex-1 rounded-lg px-3 py-1.5 transition',
                  mode === 'register' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500',
                )}
              >
                Tạo tài khoản
              </button>
            </div>
            <div className="text-xs text-slate-500">
              {mode === 'login'
                ? 'Nhập email và mật khẩu để truy cập tài khoản Shopnex của bạn.'
                : 'Tạo tài khoản mới với email và mật khẩu an toàn.'}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={onSubmit} className="space-y-3">
              {mode === 'register' && (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-slate-600">Thông tin cơ bản</div>
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                    Shopnex hiện chỉ yêu cầu <span className="font-semibold">email</span> và{" "}
                    <span className="font-semibold">mật khẩu mạnh</span> theo backend.
                  </div>
                </div>
              )}

              <label className="block text-sm">
                <span className="mb-1 inline-flex items-center gap-1 font-medium">
                  <Mail className="h-3 w-3" />
                  Email
                </span>
                <div className="relative">
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-9"
                  />
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </label>

              <label className="block text-sm">
                <span className="mb-1 inline-flex items-center gap-1 font-medium">
                  <Lock className="h-3 w-3" />
                  Mật khẩu
                </span>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ít nhất 8 ký tự, có chữ và số"
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
                  >
                    {showPassword ? 'Ẩn' : 'Hiện'}
                  </button>
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Nên dùng mật khẩu có chữ hoa, chữ thường, số và ký tự đặc biệt.
                </div>
              </label>

              {error && <div className="rounded-xl border bg-white px-4 py-3 text-sm text-red-600">{error}</div>}

              <div className="flex items-center justify-between text-xs text-slate-500">
                <button type="button" className="hover:underline">
                  Quên mật khẩu?
                </button>
                <div className="inline-flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>
                    {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                    <button
                      type="button"
                      onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                      className="ml-1 font-semibold text-slate-900 underline"
                    >
                      {mode === 'login' ? 'Đăng ký' : 'Đăng nhập'}
                    </button>
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <Button disabled={status === 'loading'} type="submit" className="w-full">
                  {status === 'loading'
                    ? mode === 'login'
                      ? 'Đang đăng nhập…'
                      : 'Đang tạo tài khoản…'
                    : mode === 'login'
                      ? 'Đăng nhập'
                      : 'Tạo tài khoản'}
                </Button>
              </div>
            </form>

            <div className="relative py-2 text-center text-[11px] text-slate-500">
              <span className="bg-white px-2 relative z-10">Hoặc</span>
              <div className="absolute left-0 right-0 top-1/2 -z-0 h-px bg-slate-200" />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() => {
                window.location.href = `${env.authServiceUrl}/auth/google`;
              }}
            >
              <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-sm bg-white">
                <span className="text-[10px] font-bold text-slate-700">G</span>
              </span>
              Đăng nhập với Google
            </Button>

            <p className="text-xs text-slate-500">
              Token được lưu localStorage và tự refresh khi gặp <code className="rounded bg-slate-100 px-1">401</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


