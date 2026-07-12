import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Usage:
//   <ProtectedRoute><Dashboard /></ProtectedRoute>
//   <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading...</div>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(role)) return <Navigate to="/" replace />;

  return children;
}
