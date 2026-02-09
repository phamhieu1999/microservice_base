import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';

export function VoucherPage() {
  const navigate = useNavigate();
  const isAuthed = useAppSelector((s) => Boolean(s.auth.accessToken));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Voucher & Mã giảm giá</h1>
          <p className="text-sm text-slate-600">
            Nhập mã giảm giá trong bước thanh toán hoặc đổi điểm lấy voucher trong trang Điểm tích lũy.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">Nhập mã giảm giá tại Checkout</div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>
            Bạn có thể nhập mã giảm giá ở bước <span className="font-semibold">Thanh toán</span>. 
            Hệ thống sẽ tự động <span className="font-semibold">validate</span> mã qua Promotion Service 
            và áp dụng giảm giá vào đơn hàng.
          </p>
          <Button variant="secondary" onClick={() => navigate('/checkout')}>
            Đi đến trang Thanh toán
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">Đổi điểm lấy voucher</div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>
            Dùng <span className="font-semibold">Điểm tích lũy (Loyalty)</span> để đổi lấy voucher 
            giảm giá qua Loyalty Service & Promotion Service.
          </p>
          <Button
            variant="secondary"
            onClick={() => navigate('/loyalty')}
          >
            Xem điểm tích lũy
          </Button>
        </CardContent>
      </Card>

      {!isAuthed && (
        <Card>
          <CardContent className="space-y-2 py-4 text-sm text-slate-700">
            <p>Đăng nhập để lưu và sử dụng voucher nhanh hơn.</p>
            <Button variant="secondary" onClick={() => navigate('/login')}>
              Đăng nhập
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


