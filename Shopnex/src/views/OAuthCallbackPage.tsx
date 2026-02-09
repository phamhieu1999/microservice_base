import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { writeTokens } from '../lib/authStorage';

export function OAuthCallbackPage() {
  const nav = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const error = params.get('error');

    if (accessToken && refreshToken) {
      writeTokens({ accessToken, refreshToken });
      // Sau khi lưu token, reload app để Redux đọc token từ localStorage
      window.location.href = '/';
      return;
    }

    if (error) {
      // Nếu có lỗi, đưa user về trang login
      nav('/login', { replace: true });
      return;
    }

    // Không có gì hợp lệ, đưa về home
    nav('/', { replace: true });
  }, [nav]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="rounded-2xl border bg-white px-6 py-4 text-sm text-slate-700 shadow-sm">
        Đang xử lý đăng nhập Google, vui lòng chờ…
      </div>
    </div>
  );
}



