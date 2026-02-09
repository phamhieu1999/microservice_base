import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import { HomePage } from '../views/HomePage';
import { ProductsPage } from '../views/ProductsPage';
import { ProductDetailPage } from '../views/ProductDetailPage';
import { SearchPage } from '../views/SearchPage';
import { CartPage } from '../views/CartPage';
import { CheckoutPage } from '../views/CheckoutPage';
import { OrdersPage } from '../views/OrdersPage';
import { OrderDetailPage } from '../views/OrderDetailPage';
import { PaymentPage } from '../views/PaymentPage';
import { PaymentStatusPage } from '../views/PaymentStatusPage';
import { ShippingTrackingPage } from '../views/ShippingTrackingPage';
import { UserReviewsPage } from '../views/UserReviewsPage';
import { NotificationsPage } from '../views/NotificationsPage';
import { LoyaltyPage } from '../views/LoyaltyPage';
import { AnalyticsDashboardPage } from '../views/AnalyticsDashboardPage';
import { ChatPage } from '../views/ChatPage';
import { DisputesPage } from '../views/DisputesPage';
import { FlashSalePage } from '../views/FlashSalePage';
import { VoucherPage } from '../views/VoucherPage';
import { LoginPage } from '../views/LoginPage';
import { OAuthCallbackPage } from '../views/OAuthCallbackPage';
import { RequireAuth } from '../components/RequireAuth';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'flash-sale', element: <FlashSalePage /> },
      { path: 'vouchers', element: <VoucherPage /> },
      { path: 'cart', element: <RequireAuth><CartPage /></RequireAuth> },
      { path: 'checkout', element: <RequireAuth><CheckoutPage /></RequireAuth> },
      { path: 'orders', element: <RequireAuth><OrdersPage /></RequireAuth> },
      { path: 'orders/:id', element: <RequireAuth><OrderDetailPage /></RequireAuth> },
      { path: 'orders/:orderId/payment', element: <RequireAuth><PaymentPage /></RequireAuth> },
      { path: 'payments/:id', element: <RequireAuth><PaymentStatusPage /></RequireAuth> },
      { path: 'shipping/tracking/:trackingNumber', element: <ShippingTrackingPage /> },
      { path: 'shipping/order/:orderId', element: <RequireAuth><ShippingTrackingPage /></RequireAuth> },
      { path: 'reviews', element: <RequireAuth><UserReviewsPage /></RequireAuth> },
      { path: 'notifications', element: <RequireAuth><NotificationsPage /></RequireAuth> },
      { path: 'loyalty', element: <RequireAuth><LoyaltyPage /></RequireAuth> },
      { path: 'analytics/dashboard', element: <RequireAuth><AnalyticsDashboardPage /></RequireAuth> },
      { path: 'chat', element: <RequireAuth><ChatPage /></RequireAuth> },
      { path: 'disputes', element: <RequireAuth><DisputesPage /></RequireAuth> },
      { path: 'login', element: <LoginPage /> },
      { path: 'oauth/callback', element: <OAuthCallbackPage /> },
    ],
  },
]);


