import { Route, Routes } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ThemeWrapper from './components/ThemeWrapper';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import WishlistPage from './pages/WishlistPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminLogsPage from './pages/AdminLogsPage';
import AdminReportsPage from './pages/AdminReportsPage';
import AdminCouponsPage from './pages/AdminCouponsPage';
import AdminSupportTicketsPage from './pages/AdminSupportTicketsPage';
import AdminSellerRequestsPage from './pages/AdminSellerRequestsPage';
import LoginRequiredModal from './components/LoginRequiredModal';
import { mergeLocalCartToServer } from './features/cartSlice';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import RefundPage from './pages/RefundPage';
import ContactPage from './pages/ContactPage';
import AboutPage from './pages/AboutPage';
import NotFoundPage from './pages/NotFoundPage';
import SupportCenterPage from './pages/SupportCenterPage';
import SellerDashboardPage from './pages/SellerDashboardPage';

// App router for all storefront, auth, profile, and admin routes.
const App = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const mergedRef = useRef(false);

  useEffect(() => {
    if (user?.token && !mergedRef.current) {
      mergedRef.current = true;
      dispatch(mergeLocalCartToServer(JSON.parse(localStorage.getItem('cart') || '[]')));
    }
    if (!user?.token) {
      mergedRef.current = false;
    }
  }, [user, dispatch]);

  return (
    <ThemeWrapper>
      {({ mode, toggleTheme }) => (
        <Layout mode={mode} toggleTheme={toggleTheme}>
          <LoginRequiredModal />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />

            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
            <Route path="/support" element={<SupportCenterPage />} />
            <Route path="/seller" element={<ProtectedRoute><SellerDashboardPage /></ProtectedRoute>} />

            <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
            <Route path="/admin/logs" element={<AdminRoute><AdminLogsPage /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminReportsPage /></AdminRoute>} />
            <Route path="/admin/coupons" element={<AdminRoute><AdminCouponsPage /></AdminRoute>} />
            <Route path="/admin/support-tickets" element={<AdminRoute><AdminSupportTicketsPage /></AdminRoute>} />
            <Route path="/admin/seller-dashboard" element={<AdminRoute><AdminSellerRequestsPage /></AdminRoute>} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/refund-policy" element={<RefundPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/about" element={<AboutPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      )}
    </ThemeWrapper>
  );
};

export default App;
