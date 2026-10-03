import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import AdminUsers from "./pages/admin/AdminUsers";
import UploadTrash from "./pages/UploadTrash";
import MyReports from "./pages/MyReports";
import ReportDetail from "./pages/ReportDetail";
import ManageRoutes from "./pages/admin/ManageRoutes";
import AdminReports from "./pages/admin/AdminReports";



export default function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload" 
          element={
            <ProtectedRoute>
              <UploadTrash />
            </ProtectedRoute>
          } />
        <Route 
          path="/my-reports" 
          element={
            <ProtectedRoute>
              <MyReports />
            </ProtectedRoute>
          } />
        <Route 
          path="/my-reports/:id" 
          element={
          <ProtectedRoute>
            <ReportDetail />
          </ProtectedRoute>
          } />
        <Route 
          path="/admin/routes" 
          element={
          <ProtectedRoute roles={["admin"]}>
            <ManageRoutes />
          </ProtectedRoute>
          }/>

        <Route 
          path="/admin/reports" 
          element={
          <ProtectedRoute roles={["admin"]}>
            <AdminReports />
          </ProtectedRoute>
} />
      </Routes>
    </AuthProvider>
  );
}
