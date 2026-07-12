import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page">
      <div className="page-header">
        <h2>Welcome, {user?.fullName}</h2>
        <p>{user?.email}</p>
      </div>
    </div>
  );
}
