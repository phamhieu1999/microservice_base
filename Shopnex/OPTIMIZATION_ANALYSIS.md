# Phân Tích Tối Ưu Shopnex Frontend

## 📊 Tổng Quan
Dự án Shopnex sử dụng React 19, Redux Toolkit, Vite, và Tailwind CSS. Dưới đây là các điểm cần tối ưu được phân loại theo mức độ ưu tiên.

---

## 🔴 ƯU TIÊN CAO - Performance Critical

### 1. **Thiếu Debounce cho Search Input**
**Vấn đề:**
- `ProductsPage.tsx`: Input search gọi API ngay khi người dùng gõ, gây nhiều request không cần thiết
- `SiteHeader.tsx`: Search input không có debounce

**Tác động:** 
- Tăng số lượng API calls không cần thiết
- Tốn băng thông và tài nguyên server
- UX kém khi gõ nhanh

**Giải pháp:**
```typescript
// Cần thêm debounce hook hoặc sử dụng thư viện như lodash.debounce
// Hoặc sử dụng useDeferredValue từ React 18+
```

**File cần sửa:**
- `src/views/ProductsPage.tsx` (dòng 35-40)
- `src/components/SiteHeader.tsx` (dòng 30-36)

---

### 2. **Thiếu Memoization - Re-render không cần thiết**
**Vấn đề:**
- Không sử dụng `React.memo`, `useMemo`, `useCallback` ở bất kỳ đâu
- `SiteHeader.tsx`: Tính toán `cartCount` mỗi lần render (dòng 13)
- `CartPage.tsx`: Tính toán `subTotal`, `totalQty`, `total` mỗi lần render (dòng 17-20)
- `ProductCard.tsx`: Component không được memo, re-render khi parent re-render

**Tác động:**
- Re-render không cần thiết khiến app chậm
- Tính toán lại các giá trị đã biết
- Ảnh hưởng performance khi danh sách sản phẩm lớn

**Giải pháp:**
- Wrap `ProductCard` với `React.memo`
- Sử dụng `useMemo` cho các tính toán phức tạp
- Sử dụng `useCallback` cho event handlers

**File cần sửa:**
- `src/components/SiteHeader.tsx`
- `src/views/CartPage.tsx`
- `src/components/ProductCard.tsx`
- `src/views/ProductsPage.tsx`

---

### 3. **useEffect Dependency Issues**
**Vấn đề:**
- `ProductsPage.tsx` (dòng 18-20): `useEffect` chỉ có `dispatch` trong dependency, nhưng cần `q` để fetch đúng query
- ESLint disable comment che giấu vấn đề thực sự

**Tác động:**
- Không fetch lại khi query thay đổi
- Logic không đúng với user expectation

**File cần sửa:**
- `src/views/ProductsPage.tsx` (dòng 18-20)

---

### 4. **Không có Code Splitting & Lazy Loading**
**Vấn đề:**
- Tất cả routes được import trực tiếp trong `router.tsx`
- Không có lazy loading cho pages
- Bundle size lớn ngay từ đầu

**Tác động:**
- Initial load time chậm
- Tải code không cần thiết ngay lập tức
- Ảnh hưởng đến First Contentful Paint (FCP)

**Giải pháp:**
```typescript
// Sử dụng React.lazy() và Suspense
const ProductsPage = lazy(() => import('../views/ProductsPage'));
```

**File cần sửa:**
- `src/router/router.tsx`

---

### 5. **Vite Config chưa tối ưu**
**Vấn đề:**
- `vite.config.ts` chỉ có plugin cơ bản
- Không có chunk splitting strategy
- Không có build optimization

**Tác động:**
- Bundle size lớn
- Không tận dụng được browser caching hiệu quả

**File cần sửa:**
- `vite.config.ts`

---

## 🟡 ƯU TIÊN TRUNG BÌNH - Code Quality & UX

### 6. **Type Safety Issues**
**Vấn đề:**
- Sử dụng `any` ở nhiều nơi:
  - `productsSlice.ts` (dòng 40, 59, 81)
  - `cartSlice.ts` (dòng 33, 44, 56)
  - `authSlice.ts` (dòng 41, 58)

**Tác động:**
- Mất type safety
- Khó debug và maintain
- Dễ có runtime errors

**File cần sửa:**
- `src/features/products/productsSlice.ts`
- `src/features/cart/cartSlice.ts`
- `src/features/auth/authSlice.ts`

---

### 7. **Thiếu Error Boundaries**
**Vấn đề:**
- Không có error boundary nào trong app
- Nếu component crash, toàn bộ app sẽ crash

**Tác động:**
- UX kém khi có lỗi
- Không có fallback UI

**Giải pháp:**
- Tạo ErrorBoundary component
- Wrap routes với ErrorBoundary

---

### 8. **API Caching & State Management**
**Vấn đề:**
- Không có caching cho API calls
- Mỗi lần vào page đều fetch lại data
- Không có stale-while-revalidate pattern

**Tác động:**
- Nhiều API calls không cần thiết
- UX chậm khi navigate giữa các pages

**Giải pháp:**
- Sử dụng RTK Query thay vì createAsyncThunk
- Hoặc implement caching layer

---

### 9. **Thiếu Optimistic Updates**
**Vấn đề:**
- `cartSlice.ts`: Khi add/remove item, phải đợi API response mới update UI
- Không có immediate feedback

**Tác động:**
- UX kém, cảm giác app chậm
- User phải đợi network request

**File cần sửa:**
- `src/features/cart/cartSlice.ts`

---

### 10. **Refresh Token Logic có thể cải thiện**
**Vấn đề:**
- `api.ts` (dòng 24-47): Refresh token logic đơn giản
- Không có retry mechanism
- Có thể có race condition khi nhiều requests cùng lúc fail với 401

**Tác động:**
- Có thể mất token khi có nhiều concurrent requests
- User có thể bị logout không mong muốn

**File cần sửa:**
- `src/lib/api.ts`

---

### 11. **Thiếu Loading States tốt hơn**
**Vấn đề:**
- Loading states đơn giản, chỉ có text "Đang tải…"
- Không có skeleton loaders cho products grid
- `ProductsPage` có skeleton nhưng chỉ khi `list.length === 0`

**Tác động:**
- UX không mượt mà
- Không có visual feedback tốt

**File cần sửa:**
- `src/views/ProductsPage.tsx`
- `src/views/CartPage.tsx`

---

### 12. **Thiếu Toast Notifications**
**Vấn đề:**
- Không có toast notifications cho success/error actions
- User không biết action có thành công hay không

**Tác động:**
- UX kém, thiếu feedback

**Giải pháp:**
- Thêm thư viện như `react-hot-toast` hoặc `sonner`

---

## 🟢 ƯU TIÊN THẤP - Nice to Have

### 13. **Pagination/Infinite Scroll**
**Vấn đề:**
- `productsSlice.ts` có `page`, `limit` nhưng không được sử dụng
- Không có pagination UI
- Load tất cả products một lúc

**Tác động:**
- Performance kém khi có nhiều products
- Initial load chậm

**File cần sửa:**
- `src/features/products/productsSlice.ts`
- `src/views/ProductsPage.tsx`

---

### 14. **Image Optimization**
**Vấn đề:**
- `ProductCard.tsx`: Sử dụng placeholder div thay vì image
- Không có lazy loading cho images
- Không có image optimization

**Tác động:**
- Khi có real images, sẽ không được optimize
- Load time chậm

**File cần sửa:**
- `src/components/ProductCard.tsx`

---

### 15. **PWA Support**
**Vấn đề:**
- Không có PWA configuration
- Không có service worker
- Không có offline support

**Tác động:**
- Không thể install như app
- Không hoạt động offline

---

### 16. **Accessibility (a11y)**
**Vấn đề:**
- Một số buttons thiếu aria-labels
- Keyboard navigation có thể cải thiện
- Focus management chưa tốt

**Tác động:**
- Không accessible cho screen readers
- Khó sử dụng với keyboard only

---

### 17. **SEO Optimization**
**Vấn đề:**
- `index.html` thiếu meta tags
- Không có Open Graph tags
- Không có structured data

**Tác động:**
- SEO kém
- Social sharing không đẹp

**File cần sửa:**
- `index.html`

---

### 18. **Environment Variables Validation**
**Vấn đề:**
- `env.ts` không validate env variables
- Có thể có runtime errors nếu thiếu config

**Tác động:**
- Khó debug khi thiếu config
- Runtime errors không rõ ràng

**File cần sửa:**
- `src/lib/env.ts`

---

## 📋 Tổng Kết Ưu Tiên

### Ngay lập tức (Critical):
1. ✅ Thêm debounce cho search
2. ✅ Thêm memoization (React.memo, useMemo, useCallback)
3. ✅ Sửa useEffect dependencies
4. ✅ Thêm code splitting với React.lazy
5. ✅ Tối ưu Vite config

### Trong tuần này (High Priority):
6. ✅ Cải thiện type safety (loại bỏ `any`)
7. ✅ Thêm Error Boundaries
8. ✅ Implement API caching (RTK Query)
9. ✅ Thêm optimistic updates cho cart
10. ✅ Cải thiện refresh token logic

### Trong tháng này (Medium Priority):
11. ✅ Cải thiện loading states (skeleton loaders)
12. ✅ Thêm toast notifications
13. ✅ Implement pagination/infinite scroll
14. ✅ Image optimization & lazy loading

### Nice to Have (Low Priority):
15. ✅ PWA support
16. ✅ Accessibility improvements
17. ✅ SEO optimization
18. ✅ Environment validation

---

## 📊 Metrics để đo lường

Sau khi tối ưu, nên đo các metrics sau:
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Total Blocking Time (TBT)**: < 200ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Bundle size**: Giảm ít nhất 30%
- **API calls**: Giảm ít nhất 50% với debounce và caching

---

## 🛠️ Tools đề xuất

- **React DevTools Profiler**: Để đo performance
- **Lighthouse**: Để audit performance
- **Bundle Analyzer**: Để phân tích bundle size
- **React Query / RTK Query**: Cho API caching
- **react-hot-toast / sonner**: Cho notifications
- **lodash.debounce** hoặc custom hook: Cho debounce

