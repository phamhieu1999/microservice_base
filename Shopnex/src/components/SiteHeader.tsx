import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Search, ShoppingCart, User, Package, Star, Bell } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../features/auth/authSlice';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { cn } from '../ui/cn';

export function SiteHeader() {
  const dispatch = useAppDispatch();
  const nav = useNavigate();
  const isAuthed = useAppSelector((s) => Boolean(s.auth.accessToken));
  const cartCount = useAppSelector((s) => (s.cart.cart?.items ?? []).reduce((sum, it) => sum + (it.quantity ?? 0), 0));
  const unreadCount = useAppSelector((s) => s.notifications.unreadCount);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#ee4d2d] text-white">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center gap-3">
          <NavLink to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-sm font-semibold text-[#ee4d2d]">
              S
            </span>
            <span className="hidden sm:inline">Shopnex</span>
          </NavLink>

          {/* Search kiểu marketplace */}
          <div className="flex flex-1 items-center">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm kiếm sản phẩm…"
                className="h-11 rounded-xl border-white/20 bg-white pl-9 text-slate-900 placeholder:text-slate-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    nav(`/search?q=${encodeURIComponent(e.currentTarget.value.trim())}`);
                  }
                }}
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2">
                <Button
                  variant="brand"
                  className="h-9 rounded-lg px-4"
                  onClick={() => {
                    const input = document.querySelector('input[placeholder="Tìm kiếm sản phẩm…"]') as HTMLInputElement;
                    if (input?.value.trim()) {
                      nav(`/search?q=${encodeURIComponent(input.value.trim())}`);
                    }
                  }}
                >
                  Tìm
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <nav className="ml-2 flex items-center gap-1">
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                cn(
                  'relative rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10',
                  isActive && 'bg-white/10 text-white',
                )
              }
            >
              <span className="inline-flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> <span className="hidden sm:inline">Giỏ hàng</span>
              </span>
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-semibold text-[#ee4d2d]">
                  {cartCount}
                </span>
              )}
            </NavLink>

            {isAuthed && (
              <>
                {/* Notifications */}
                <button
                  type="button"
                  className="relative rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
                  onClick={() => nav('/notifications')}
                >
                  <span className="inline-flex items-center gap-2">
                    <Bell className="h-4 w-4" /> <span className="hidden sm:inline">Thông báo</span>
                  </span>
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-300 px-1 text-[11px] font-semibold text-slate-900">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                <NavLink
                  to="/orders"
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10',
                      isActive && 'bg-white/10 text-white',
                    )
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    <Package className="h-4 w-4" /> <span className="hidden sm:inline">Đơn hàng</span>
                  </span>
                </NavLink>
                <NavLink
                  to="/reviews"
                  className={({ isActive }) =>
                    cn(
                      'rounded-lg px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10',
                      isActive && 'bg-white/10 text-white',
                    )
                  }
                >
                  <span className="inline-flex items-center gap-2">
                    <Star className="h-4 w-4" /> <span className="hidden sm:inline">Đánh giá</span>
                  </span>
                </NavLink>
              </>
            )}

            {!isAuthed ? (
              <Button variant="secondary" className="ml-1 h-10 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/15" onClick={() => nav('/login')}>
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Tài khoản</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="ml-1 h-10 rounded-xl text-white hover:bg-white/10"
                onClick={() => {
                  dispatch(logout());
                  nav('/');
                }}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Đăng xuất</span>
              </Button>
            )}
          </nav>
        </div>

        {/* sub nav */}
        <div className="hidden h-10 items-center gap-4 text-sm text-white/90 md:flex">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn('hover:text-white', isActive && 'text-white font-semibold')
            }
          >
            Trang chủ
          </NavLink>
          <NavLink
            to="/products"
            className={({ isActive }) =>
              cn('hover:text-white', isActive && 'text-white font-semibold')
            }
          >
            Tất cả sản phẩm
          </NavLink>
          <span className="text-white/50">|</span>
          <NavLink
            to="/flash-sale"
            className={({ isActive }) =>
              cn('hover:text-white', isActive && 'text-white font-semibold')
            }
          >
            Flash Sale
          </NavLink>
          <NavLink
            to="/vouchers"
            className={({ isActive }) =>
              cn('hover:text-white', isActive && 'text-white font-semibold')
            }
          >
            Voucher
          </NavLink>
        </div>
      </div>
    </header>
  );
}


