# ScriptLab — Commercial Screenwriting & Script Doctoring Lab

A mentor-led EdTech platform for aspiring screenwriters: structured programs, text/video lessons, writing assignments with screenplay uploads, mentor feedback, and role-based dashboards for students, mentors and admins.

## Architecture

- **Frontend:** Next.js 16 (App Router) + Tailwind CSS 4
- **Backend:** Express.js REST API (`backend/`) with Mongoose / JSON data store
- **Authentication:** JWT (HS256) + bcrypt password hashing

## Quick start

### 1. Start Backend
```bash
cd backend
npm install
npm run seed
npm run dev
```

### 2. Start Frontend
```bash
npm install
npm run dev
```

### Demo accounts (password `password123`)

| Role | Email |
|---|---|
| Student | `student@scriptlab.io` |
| Mentor / Instructor | `mentor@scriptlab.io` |
| Admin | `admin@scriptlab.io` |

## Deployment Steps

1. **Deploy Backend (Render / Railway):**
   - Root directory: `backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
   - Environment variables: `PORT=5000`, `MONGODB_URI=...`

2. **Deploy Frontend (Vercel):**
   - Build command: `npm run build`
   - Environment variables: `NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com/api`
