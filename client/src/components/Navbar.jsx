import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isAuthenticated, role, logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (!isAuthenticated) return null; // Login/Register pages render without a navbar

  return (
    <nav className="navbar">
      <div className="navbar-brand">SWMS</div>

      <div className="navbar-links">
        <Link to="/">Home</Link>
        <Link to="/profile">Profile</Link>

        {role === "admin" && (
          <>
            <span className="navbar-divider">|</span>
            <Link to="/admin/users">Manage Users</Link>
          </>
        )}
      </div>

      <div className="navbar-user">
        <span>{user?.fullName}</span>
        <span className={`role-tag role-tag--${role}`}>{role}</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
