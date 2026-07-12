# Module 1: Auth (MERN)

Ported from `AuthController.cs` — email/password auth with JWT + role claims (`user` / `admin`).

## Backend setup
```bash
cd server
npm install
cp .env.example .env      # then edit MONGO_URI / JWT_SECRET
npm run dev                # starts on http://localhost:5000
```

## Frontend setup
```bash
cd client
npm install
cp .env.example .env
npm run dev                # starts on http://localhost:5173
```

## What's included
- `server/models/User.js` — matches the fields used across `UserController`/`AdminController` DTOs (fullName, email, address, city, state, postalCode, role, dateCreated, lastModified). Password is hashed with bcrypt in a pre-save hook.
- `server/controllers/authController.js` — register/login, mirrors `AuthController.cs` (issues a JWT containing id/email/role, no separate cookie-based Identity flow — MERN skips ASP.NET Identity entirely).
- `server/middleware/authMiddleware.js` — `protect` (verifies JWT) and `authorize(...roles)` (role gate), equivalent to `[Authorize]` and `[Authorize(Roles = "Admin")]`.
- `client/src/services/api.js` — axios instance that auto-attaches the JWT and redirects to `/login` on 401, equivalent to `AuthHeaderHandler.cs`.
- `client/src/context/AuthContext.jsx` — app-wide session state, equivalent to `CustomAuthStateProvider.cs`. Rehydrates from `/api/auth/me` on page load so refresh doesn't log you out.
- `client/src/components/ProtectedRoute.jsx` — route guard with optional role restriction, equivalent to `CustomAuthorizationHandler.cs`.
- `client/src/pages/Login.jsx`, `Register.jsx`, `Home.jsx` — minimal working UI to test the full loop.

## Test it
1. Start Mongo locally (or point `MONGO_URI` at Atlas).
2. Run both servers above.
3. Visit `http://localhost:5173/register`, create an account, get redirected to `/`, refresh the page — you should stay logged in.
4. New users default to `role: "user"`. To create an admin for testing, register normally then flip the `role` field to `"admin"` directly in MongoDB (Module 5 — Admin — will add a proper endpoint for this).

## Module 2: Users

Builds directly on Module 1's `protect`/`authorize` middleware. Two tiers:

**Self-service** (`/api/user/*`, any authenticated role)
- `GET /api/user/profile` — view own profile
- `PUT /api/user/profile` — update own profile (fullName, address, city, state, postalCode)

**Admin management** (`/api/admin/users*`, role: `admin` only — enforced via `router.use(protect, authorize("admin"))`)
- `GET /api/admin/users?search=&role=&page=&pageSize=` — list/search/paginate
- `GET /api/admin/users/:id` — single user
- `PUT /api/admin/users/:id` — update any field including role (blocks an admin from demoting themselves)
- `DELETE /api/admin/users/:id` — delete (blocks self-deletion)

**New frontend pieces:**
- `components/Navbar.jsx` — role-aware nav, hidden on Login/Register, shows "Manage Users" only to admins
- `pages/Profile.jsx` — self-service profile editor
- `pages/admin/AdminUsers.jsx` — admin table: search, inline role change, delete

**To test the admin flow:** register a normal user, then manually set `role: "admin"` on that user's document in MongoDB Atlas (Browse Collections → `users`) — there's still no endpoint to self-promote, by design. Once one admin exists, they can promote others through the UI.

## Next module
Module 3 (Trash Reports) — image upload, EXIF GPS extraction, geocoding, and AI waste classification.
