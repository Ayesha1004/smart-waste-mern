import { useEffect, useState } from "react";
import api from "../../services/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(null);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await api.get("/admin/users", { params: { search } });
      setUsers(res.data.users);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRoleChange(userId, newRole) {
    try {
      await api.put(`/admin/users/${userId}`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't update role");
    }
  }

  async function handleDelete(userId) {
    if (confirmingDelete !== userId) {
      setConfirmingDelete(userId);
      return;
    }
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't delete user");
    } finally {
      setConfirmingDelete(null);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Manage users</h2>
        <p>{users.length} resident{users.length !== 1 ? "s" : ""} on record</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadUsers();
        }}
        className="admin-search"
      >
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {error && <div className="alert-error">{error}</div>}

      {loading ? (
        <p className="page-loading">Loading...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>City</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.fullName}</td>
                <td className="mono">{u.email}</td>
                <td className="mono">{u.city || "—"}</td>
                <td>
                  <select
                    className="role-pill-select"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u._id, e.target.value)}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>
                  <button onClick={() => handleDelete(u._id)} className="btn-danger">
                    {confirmingDelete === u._id ? "Confirm delete" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-table-empty">
                  No matches. Try a different name or email.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
