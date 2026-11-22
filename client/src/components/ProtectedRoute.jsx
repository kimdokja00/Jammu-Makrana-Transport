import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ children, role }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="auth-spinner" />
          <p style={{ marginTop: '16px', color: 'var(--thm-gray)' }}>Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to respective login based on required role
    const redirectPath = role === 'admin' ? '/admin/login' : '/customer/login';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    // User is logged in but doesn't have required permission
    const fallback = user.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
