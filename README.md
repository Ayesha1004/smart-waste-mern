# Smart Waste Management System (MERN)

A MERN-stack rebuild of a waste-reporting and collection-management system. Residents report illegal dumping with a photo (auto-classified by an AI model, auto-geolocated), and admins manage collection routes and users.

**Status:** Modules 1–3 complete (Auth, Users, Trash Reports with AI classification). Module 4 (Route management/optimization) is in progress, not yet in this repo.

---

## Tech stack
- **Backend:** Node.js, Express, MongoDB (Atlas), Mongoose, JWT auth
- **Frontend:** React (Vite), react-router-dom, react-leaflet (OpenStreetMap)
- **AI:** TensorFlow.js (pure JS, not `tfjs-node` — see note below), a fine-tuned MobileNetV2 model trained on TrashNet
- **Geo:** EXIF GPS extraction (`exifr`), reverse/forward geocoding via Nominatim (OpenStreetMap)

---

## Prerequisites

- **Node.js 18 or 20 LTS** — see the Node version note below before you pick a version
- **A MongoDB Atlas account** (free tier is fine) — this project uses a cloud database, not a local MongoDB install
- **npm** (comes with Node)

### ⚠️ Node version note
Stick to **Node 18 or 20**. Some very new Node versions (22+) have caused prebuilt-binary install issues with certain packages in this project's history. If you have multiple Node versions to manage, use [nvm](https://github.com/nvm-sh/nvm) (Mac/Linux) or [nvm-windows](https://github.com/coreybutler/nvm-windows) (Windows):
```bash
nvm install 20
nvm use 20
node -v   # confirm it shows v20.x.x
```

---

## Project structure

```
smart-waste-mern/
├── server/            # Express API
│   ├── config/        # MongoDB connection
│   ├── models/        # Mongoose schemas (User, TrashReport)
│   ├── controllers/   # Route handlers
│   ├── routes/        # Express routers
│   ├── middleware/    # auth (protect/authorize), file upload
│   ├── services/      # EXIF, geocoding, AI classifier
│   ├── ai-models/      # Trained TF.js model files (model.json + .bin shards)
│   ├── uploads/        # User-uploaded photos (gitignored, auto-created at runtime)
│   └── server.js
└── client/            # React (Vite) frontend
    └── src/
        ├── context/    # AuthContext (session state)
        ├── services/   # api.js (axios instance)
        ├── components/ # Navbar, ProtectedRoute, MapPicker
        └── pages/      # Login, Register, Home, Profile, UploadTrash, MyReports,
                         # ReportDetail, admin/AdminUsers
```

---

## Setup — from a fresh clone

### 1. Backend

```bash
cd server
npm install
```

Create `server/.env` (copy `.env.example` if present, or create fresh):
```
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/waste-management?retryWrites=true&w=majority
JWT_SECRET=<a long random string you make up>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

**Getting your `MONGO_URI` (MongoDB Atlas):**
1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Database Access** → add a database user (username/password — avoid special characters in the password, or URL-encode them)
3. **Network Access** → add your IP (or `0.0.0.0/0` for dev convenience)
4. **Connect → Drivers → Node.js** → copy the connection string
5. **Important:** add the database name (`waste-management`, or whatever you choose) right after `mongodb.net/` and before the `?` in the string — Atlas's copied string leaves this blank by default, and without it Mongoose silently defaults to a database called `test`

Start the server:
```bash
npm run dev
```
You should see:
```
Server running on port 5000
MongoDB connected: ...
Loading fine-tuned waste classifier (Phase 2 model)...
Model ready.
```
(the model load happens on first request, not necessarily at startup, depending on how it's wired — either way, expect a short delay the first time you hit an AI-classification endpoint)

### 2. Frontend

```bash
cd client
npm install
```

Create `client/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

Start it:
```bash
npm run dev
```
Opens on `http://localhost:5173`.

---

## Features by module

**Module 1 — Auth:** Register/login, JWT with role claims (`user`/`admin`), password hashing (bcrypt). No self-promote-to-admin endpoint by design — promote a user manually via Atlas (Browse Collections → `users` → edit `role` field), then log out/in on that account to get a fresh token with the new role.

**Module 2 — Users:** Self-service profile editing; admin user management (search, role change, delete) at `/admin/users`.

**Module 3 — Trash Reports:** Upload a photo at `/upload` → EXIF GPS auto-detected (falls back to click-to-place or search-by-address on the map if no GPS data) → AI classifies the waste type → reverse-geocoded to a city → saved with status `Pending`. View your reports at `/my-reports`, with status filtering. Reports below 40% AI confidence are flagged `needsReview`.

---

## The AI classifier — important context

- **Model:** a MobileNetV2 fine-tuned on the [TrashNet dataset](https://www.kaggle.com/datasets) (6 categories: cardboard, glass, metal, paper, plastic, trash), trained in Google Colab, converted to TensorFlow.js format
- **Runtime:** uses plain `@tensorflow/tfjs` (pure JavaScript), **not** `@tensorflow/tfjs-node` — the latter's native binary has a known, unresolved packaging bug on Windows. This project avoids it entirely; a custom Node-based file loader (`classifier.js`) reads the model from disk instead
- **Known limitation:** TrashNet's training photos are clean, well-lit, single-object lab photos. Real user submissions (mixed trash, poor lighting, odd angles) will classify less confidently. Low-confidence results are flagged for manual review rather than trusted blindly — this is by design, not a bug


## Common gotchas (things that have actually come up)

- **`jimp` version:** pinned to `0.22.12` specifically in `package.json` — newer major versions changed their export style and will break `classifier.js`'s `import Jimp from "jimp"` line. Don't let this drift on a fresh `npm install`.
- **Leaflet map showing blank/broken:** make sure `@import "leaflet/dist/leaflet.css";` is present at the top of `client/src/index.css` — without it, the map technically renders but collapses to zero visible height.
- **`react-leaflet` version:** pinned to `^4.2.1` — version 5+ requires React 19, which this project doesn't use. Don't let this drift either.
- **"Failed to submit report" with no clear cause:** check the browser Network tab's response body and the server terminal log — the controller's generic error message hides the real cause (usually: AI model failed to load because `server/ai-models/waste-classifier/` is missing or misplaced).

---

## Roadmap
- **Module 4 (Route Management):** admin route optimizer (nearest-neighbor + 2-opt), route status lifecycle, cascading status updates between reports and their parent route
