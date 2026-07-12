import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [status, setStatus] = useState({ loading: true, saving: false, message: null, error: false });

  useEffect(() => {
    api
      .get("/user/profile")
      .then((res) => {
        const u = res.data.user;
        setForm({
          fullName: u.fullName || "",
          address: u.address || "",
          city: u.city || "",
          state: u.state || "",
          postalCode: u.postalCode || "",
        });
      })
      .catch(() => setStatus((s) => ({ ...s, message: "Couldn't load profile", error: true })))
      .finally(() => setStatus((s) => ({ ...s, loading: false })));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus((s) => ({ ...s, saving: true, message: null }));
    try {
      const res = await api.put("/user/profile", form);
      setStatus({ loading: false, saving: false, message: "Saved", error: false });
      if (setUser) setUser(res.data.user);
    } catch (err) {
      setStatus({
        loading: false,
        saving: false,
        message: err.response?.data?.message || "Couldn't save changes",
        error: true,
      });
    }
  }

  if (status.loading) return <div className="page-loading">Loading profile...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Profile</h2>
        <p>Manage your account and delivery details.</p>
      </div>

      <div className="profile-readonly">{user?.email}</div>

      <form onSubmit={handleSubmit} className="profile-form">
        <div className="profile-section-label">Identity</div>
        <div className="form-group">
          <label>Full name</label>
          <input name="fullName" value={form.fullName} onChange={handleChange} />
        </div>

        <div className="profile-section-label">Location</div>
        <div className="form-group">
          <label>Address</label>
          <input name="address" value={form.address} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>City</label>
          <input name="city" value={form.city} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>State</label>
          <input name="state" value={form.state} onChange={handleChange} />
        </div>
        <div className="form-group">
          <label>Postal code</label>
          <input name="postalCode" value={form.postalCode} onChange={handleChange} />
        </div>

        {status.message && (
          <div className={status.error ? "alert-error" : "alert"}>{status.message}</div>
        )}

        <button type="submit" disabled={status.saving}>
          {status.saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
