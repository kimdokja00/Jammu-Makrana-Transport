import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import FloatingWidgets from './components/FloatingWidgets.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Transportation from './pages/Transportation.jsx';
import StoneRange from './pages/StoneRange.jsx';
import StoneDetail from './pages/StoneDetail.jsx';
import LegacyStoneRedirect from './pages/LegacyStoneRedirect.jsx';
import StoneProducts from './pages/StoneProducts.jsx';
import Contact from './pages/Contact.jsx';
import NotFound from './pages/NotFound.jsx';

// Customer Panel Pages
import CustomerLogin from './pages/customer/CustomerLogin.jsx';
import CustomerRegister from './pages/customer/CustomerRegister.jsx';
import CustomerDashboard from './pages/customer/CustomerDashboard.jsx';
import CustomerOrderDetail from './pages/customer/CustomerOrderDetail.jsx';

// Admin Panel Pages
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminOrderDetail from './pages/admin/AdminOrderDetail.jsx';

function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="page-wrapper">
      <ScrollToTopOnNavigate />
      <Header />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/transportation" element={<Transportation />} />
          <Route path="/stone-range" element={<StoneRange />} />
          <Route path="/stone-range/:slug" element={<StoneDetail />} />
          {/* Alternates/legacy links such as /stones/marbles */}
          <Route path="/stones" element={<Navigate to="/stone-range" replace />} />
          <Route path="/stones/:slug" element={<LegacyStoneRedirect />} />
          <Route path="/stone-products" element={<StoneProducts />} />
          <Route path="/contact" element={<Contact />} />

          {/* Customer Portal */}
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/register" element={<CustomerRegister />} />
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute role="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/order/:id"
            element={
              <ProtectedRoute role="customer">
                <CustomerOrderDetail />
              </ProtectedRoute>
            }
          />

          {/* Admin Fleet Portal */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/order/:id"
            element={
              <ProtectedRoute role="admin">
                <AdminOrderDetail />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
      <FloatingWidgets />
    </div>
  );
}
