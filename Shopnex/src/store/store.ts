import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../features/auth/authSlice';
import { productsReducer } from '../features/products/productsSlice';
import { cartReducer } from '../features/cart/cartSlice';
import { ordersReducer } from '../features/orders/ordersSlice';
import { paymentsReducer } from '../features/payments/paymentsSlice';
import { shippingReducer } from '../features/shipping/shippingSlice';
import { reviewsReducer } from '../features/reviews/reviewsSlice';
import { searchReducer } from '../features/search/searchSlice';
import { vouchersReducer } from '../features/vouchers/vouchersSlice';
import { homeReducer } from '../features/home/homeSlice';
import { notificationsReducer } from '../features/notifications/notificationsSlice';
import { loyaltyReducer } from '../features/loyalty/loyaltySlice';
import { analyticsReducer } from '../features/analytics/analyticsSlice';
import { chatReducer } from '../features/chat/chatSlice';
import { disputesReducer } from '../features/disputes/disputesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    orders: ordersReducer,
    payments: paymentsReducer,
    shipping: shippingReducer,
    reviews: reviewsReducer,
    search: searchReducer,
    vouchers: vouchersReducer,
    home: homeReducer,
    notifications: notificationsReducer,
    loyalty: loyaltyReducer,
    analytics: analyticsReducer,
    chat: chatReducer,
    disputes: disputesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


