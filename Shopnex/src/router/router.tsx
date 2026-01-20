import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import { HomePage } from '../views/HomePage';
import { ProductsPage } from '../views/ProductsPage';
import { CartPage } from '../views/CartPage';
import { LoginPage } from '../views/LoginPage';
import { RequireAuth } from '../components/RequireAuth';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'cart', element: <RequireAuth><CartPage /></RequireAuth> },
      { path: 'login', element: <LoginPage /> },
    ],
  },
]);


