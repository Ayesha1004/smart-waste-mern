import User from "../models/User.js";

/* ---------- Self-service (any authenticated user) ---------- */

// GET /api/user/profile
export async function getMyProfile(req, res) {
  // req.user is already attached by the protect middleware
  return res.status(200).json({ user: req.user });
}

// PUT /api/user/profile
export async function updateMyProfile(req, res) {
  try {
    const { fullName, address, city, state, postalCode } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Only update fields that were actually provided, same pattern as
    // the ?? fallback in UpdateUserProfileDto from the original UserController
    if (fullName !== undefined) user.fullName = fullName;
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (state !== undefined) user.state = state;
    if (postalCode !== undefined) user.postalCode = postalCode;

    await user.save();

    return res.status(200).json({ message: "Profile updated", user });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/* ---------- Admin-only user management ---------- */

// GET /api/admin/users?search=&role=&page=&pageSize=
export async function adminGetAllUsers(req, res) {
  try {
    const { search = "", role, page = 1, pageSize = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [users, total] = await Promise.all([
      User.find(filter).sort({ dateCreated: -1 }).skip(skip).limit(Number(pageSize)),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      users,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / Number(pageSize)),
    });
  } catch (err) {
    console.error("Admin get users error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /api/admin/users/:id
export async function adminGetUserById(req, res) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
  } catch (err) {
    console.error("Admin get user error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// PUT /api/admin/users/:id
export async function adminUpdateUser(req, res) {
  try {
    const { fullName, email, role, address, city, state, postalCode } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (fullName !== undefined) user.fullName = fullName;
    if (email !== undefined) user.email = email.toLowerCase();
    if (role !== undefined) {
      if (!["user", "admin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      // Prevent an admin from demoting themselves and getting locked out
      if (String(user._id) === String(req.user._id) && role !== "admin") {
        return res.status(400).json({ message: "You cannot change your own role" });
      }
      user.role = role;
    }
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (state !== undefined) user.state = state;
    if (postalCode !== undefined) user.postalCode = postalCode;

    await user.save();

    return res.status(200).json({ message: "User updated", user });
  } catch (err) {
    console.error("Admin update user error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// DELETE /api/admin/users/:id
export async function adminDeleteUser(req, res) {
  try {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(204).send();
  } catch (err) {
    console.error("Admin delete user error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
