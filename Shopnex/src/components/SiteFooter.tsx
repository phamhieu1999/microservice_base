export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="text-sm font-semibold tracking-tight text-white">Shopnex</div>
          <p className="text-sm text-slate-400">
            Storefront demo tích hợp microservices API gateway. Thiết kế để mô phỏng trải nghiệm mua sắm thực tế.
          </p>
        </div>
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Hỗ trợ</div>
          <ul className="space-y-1 text-sm">
            <li className="hover:text-white">Chính sách đổi trả</li>
            <li className="hover:text-white">Giao hàng</li>
            <li className="hover:text-white">Thanh toán</li>
          </ul>
        </div>
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Về chúng tôi</div>
          <ul className="space-y-1 text-sm">
            <li className="hover:text-white">Giới thiệu</li>
            <li className="hover:text-white">Liên hệ</li>
            <li className="hover:text-white">Tuyển dụng</li>
          </ul>
        </div>
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Newsletter</div>
          <p className="text-sm text-slate-400">
            Nhận ưu đãi, tin tức và sản phẩm mới mỗi tuần. Không spam, chỉ nội dung hữu ích.
          </p>
          <div className="flex gap-2">
            <input
              className="h-10 flex-1 rounded-lg border border-slate-600 bg-slate-900 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-slate-300 focus:ring-2 focus:ring-slate-500/40"
              placeholder="Email của bạn"
            />
            <button className="h-10 rounded-lg bg-slate-100 px-4 text-sm font-semibold text-slate-950 hover:bg-white">
              Đăng ký
            </button>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Shopnex. All rights reserved.
      </div>
    </footer>
  );
}



