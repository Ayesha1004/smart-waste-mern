This is a waste management system app in its initial stages built with MERN, currently has user authentication and authorization and routings developed, to understand basic development/connection of server and client side of a web app.

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

## Test it
1. Start Mongo locally (or point `MONGO_URI` at Atlas).
2. Run both servers above.
3. Visit `http://localhost:5173/register`, create an account, get redirected to `/`, refresh the page — you should stay logged in.
4. New users default to `role: "user"`. To create an admin for testing, register normally then flip the `role` field to `"admin"` directly in MongoDB (Module 5 — Admin — will add a proper endpoint for this).

## Next module
For AI classification and map navigation to be added.
