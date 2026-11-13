# ScriptLab — Commercial Screenwriting & Script Doctoring Lab

A mentor-led EdTech platform for aspiring screenwriters: structured programs, text/video lessons, writing assignments with screenplay uploads, mentor feedback, and role-based dashboards for students, mentors and admins.

## Stack (and one important deviation)

| Layer | Used here | Why |
|---|---|---|
| Frontend | **Next.js 16 (App Router)** + **Tailwind CSS 4** | as requested |
| Backend | **REST API via Next.js Route Handlers** (`src/app/api/**`) organised Express-style: controllers → validators (Zod) → middleware (`requireAuth`, `requireRole`) → centralised error handler | The sandbox this project was built in only provides a Node runtime and a **PostgreSQL** instance; there is no MongoDB service and no separate process port for an Express server. |
| Database | **PostgreSQL via Drizzle ORM** (`src/db/schema.ts`) | same reason — see "Porting to Express + MongoDB" below |
| Auth | **JWT (HS256, `jose`) + bcrypt password hashing**, token in httpOnly cookie **and** `Authorization: Bearer` header | as requested |

The domain model is identical to the requested Mongoose set — `User`, `Course`, `Module`, `Lesson`, `Enrollment`, `Assignment`, `Submission`, `Feedback` (plus `Category`, `LessonProgress`, `ActivityLog`) — and all frontend↔backend communication is plain REST over JSON with a uniform `{ success, data | error }` envelope, so the API layer can be lifted into a standalone Express app without touching the UI.

## Quick start

```bash
npm install
cp .env.example .env            # or edit .env
npx drizzle-kit push            # create tables
npx tsx scripts/seed.ts         # realistic demo data (also auto-seeds an empty DB on first /api/health hit)
npm run dev                     # http://localhost:3000
```

Re-seed from scratch: `npx tsx scripts/seed.ts --force`.

### Environment variables

| Var | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://postgres:postgres@127.0.0.1:5432/app_db` |
| `JWT_SECRET` | Secret used to sign/verify JWTs. **Change in production.** |

### Demo accounts (password `password123`)

| Role | Email |
|---|---|
| Student | `student@scriptlab.io` |
| Mentor / Instructor | `mentor@scriptlab.io` (also `priya@scriptlab.io`) |
| Admin | `admin@scriptlab.io` |

## Features

- **Landing page** – cinematic hero, intro, featured programs (live from the API), how-it-works, outcomes, clearly labelled sample testimonials, CTAs, footer.
- **Auth** – register (student or mentor), login, logout, hashed passwords, JWT, protected routes, role-based redirect (`/dashboard`, `/mentor`, `/admin`).
- **Catalog** – 9 craft categories, search + category filters, course detail with curriculum, outcomes, enrollment.
- **Learning interface** – module/lesson outline, markdown lesson content, video lessons with embed support (YouTube/Vimeo/direct) and a placeholder when no URL is set, mark complete / undo, progress tracking, prev/next navigation, "continue learning".
- **Assignments** – mentors create assignments with description, instructions, deadline, max score; students submit text + optional file (PDF/FDX/Fountain stored as base64, ≤1.4 MB), revise before review; status Pending → Submitted → Reviewed; feedback with score, notes and rewrite suggestions.
- **Student dashboard** – enrolled courses, overall progress, recently accessed lessons, pending assignments, recent feedback, continue-learning shortcut.
- **Mentor studio** – stats, review queue, courses; course manager with modules/lessons CRUD (text/video), assignments CRUD, settings; submission review interface with download of attachments.
- **Admin** – totals (students, instructors, courses, enrollments, submissions), activity feed, user management (role change, deactivate, delete), course management (publish/feature/delete), category creation.
- Loading / empty / error / success states throughout; toasts; responsive layouts.

## Project structure

```
src/
  app/                      # Next.js App Router pages
    api/                    # REST API (route handlers)
      auth/ courses/ modules/ lessons/ enrollments/ assignments/ submissions/ dashboard/ admin/ categories/
    courses/ learn/ assignments/ dashboard/ mentor/ admin/ login/ register/
  server/                   # "backend" layer
    auth.ts                 # JWT sign/verify, bcrypt, requireAuth / requireRole middleware
    http.ts                 # response envelope, ApiError, centralized error handler, body parsing
    validators.ts           # Zod schemas (input validation)
    services.ts             # shared queries (progress, curriculum, activity log)
    seed.ts                 # realistic demo data
  db/schema.ts              # Drizzle models
  components/               # reusable UI (ui/, layout/, mentor/, landing/, providers/)
  lib/                      # client API wrapper, formatting, markdown renderer
scripts/seed.ts
```

## REST API

All responses: `{ "success": true, "data": … }` or `{ "success": false, "error": "…" }` with proper HTTP codes (400/401/403/404/409/422/500).

| Method | Path | Auth |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | – |
| GET | `/api/auth/me` | – |
| GET / POST | `/api/categories` | – / admin |
| GET / POST | `/api/courses` (`?q=&category=&featured=`) | – / instructor, admin |
| GET / PATCH / DELETE | `/api/courses/:id` | – / owner or admin / admin |
| POST | `/api/courses/:id/enroll` | student |
| POST | `/api/courses/:id/modules` | owner, admin |
| PATCH / DELETE | `/api/modules/:id` | owner, admin |
| POST | `/api/lessons` | owner, admin |
| GET / PATCH / DELETE | `/api/lessons/:id` | enrolled or owner |
| POST | `/api/lessons/:id/complete` (`?undo=true`) | enrolled student |
| GET | `/api/enrollments` | user |
| GET / POST | `/api/assignments` (`?courseId=`) | user / owner, admin |
| GET / DELETE | `/api/assignments/:id` | enrolled or owner |
| POST | `/api/assignments/:id/submissions` | enrolled student |
| GET | `/api/submissions` (`?status=`) | role-scoped |
| GET | `/api/submissions/:id` | student owner, course mentor, admin |
| POST | `/api/submissions/:id/feedback` | course mentor, admin |
| GET | `/api/dashboard/student`, `/api/dashboard/instructor` | role |
| GET | `/api/admin/stats`, `/api/admin/users` | admin |
| PATCH / DELETE | `/api/admin/users/:id` | admin |

## Porting to Express + MongoDB (if required)

The code is layered to make this mechanical:
1. Create an Express app; mount each `src/app/api/**/route.ts` handler as a router (the handlers already read `Request`/return `Response`, take `req` first and use `requireAuth(req)`/`requireRole(req, …)` as middleware equivalents).
2. Replace the Drizzle queries in `src/server/services.ts` and the route files with Mongoose models mirroring `src/db/schema.ts`.
3. Point `src/lib/api.ts` at `NEXT_PUBLIC_API_URL`; it already sends `Authorization: Bearer <jwt>`.

## Known limitations / not implemented

- File attachments are stored base64 in PostgreSQL (fine for the MVP, cap 1.4 MB); swap for S3/Cloudinary for production.
- Video lessons use placeholders unless a URL is attached — no video hosting is bundled.
- No email notifications, password reset, or pagination (datasets are small).
- Deliberately out of scope per brief: AI generation, real-time collaboration, video conferencing, payments, recommendations.
