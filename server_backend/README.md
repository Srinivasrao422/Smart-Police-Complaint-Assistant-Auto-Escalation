# Server

Backend for SPACES application using Node.js, Express, and MongoDB (Mongoose).

Environment:
- Copy `.env.example` to `.env` and set `MONGODB_URI` and `JWT_SECRET`.

Scripts:
- `npm run dev` — start server with `nodemon`.
- `npm start` — start server in production.

API:
- `POST /api/auth/register` — register new user
- `POST /api/auth/login` — login
- `GET /api/auth/me` — get current user (requires Authorization header)
