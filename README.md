# AI Privacy & Security Internal Audit System

Phase 1 implements:

- Backend project setup with Express and Prisma
- PostgreSQL configuration
- JWT authentication
- Role-based access control for `Admin`, `Auditor`, and `Reviewer`
- Frontend login page, auth context, and protected routes

Phase 2 adds:

- Tool Master with risk-based classification
- Checklist Master linked to tools
- CRUD APIs for both master modules
- Table-based UI screens with modal forms

Phase 3 adds:

- Audit Planning with scoped tool selection and auditor assignment
- Audit Execution with dynamic checklist loading by tool
- Checklist response capture with compliance status, comments, and evidence upload
- Audit response storage tied to audit and checklist records

Phase 4 adds:

- Auto-created observations when a checklist item is marked `NON_COMPLIANT`
- Weighted scoring engine using `compliant=2`, `partial=1`, `non-compliant=0`
- Audit score percentage and tool score exposure through audit APIs
- Observation register UI and score display within audit workflows

Phase 5 adds:

- Executive dashboard KPIs for audits, findings, and compliance
- Recharts-based tool-wise compliance and severity distribution visualizations
- Audit report export to Excel and PDF
- Backend dashboard/report APIs backed by live audit and observation data

Audit Trail adds:

- Immutable `audit_trail_log` table for login events, data changes, and audit workflow updates
- Read-only audit trail API and viewer UI
- Append-only logging with no delete capability

## Project Structure

```text
backend/
  prisma/
  src/
frontend/
  src/
```

## Backend Run Instructions

1. Create a PostgreSQL database named `ai_audit_db`.
2. Copy `backend/.env.example` to `backend/.env`.
3. Install backend dependencies:

```bash
cd backend
npm install
```

4. Generate Prisma client:

```bash
npm run prisma:generate
```

5. Run the initial migration:

```bash
npm run prisma:migrate -- --name init_auth
```

For Phase 2 schema changes on an existing setup, run another migration after pulling the latest code:

```bash
npm run prisma:migrate -- --name add_tool_and_checklist_master
```

For Phase 3 schema changes, run:

```bash
npm run prisma:migrate -- --name add_audit_planning_and_execution
```

For Phase 4 schema changes, run:

```bash
npm run prisma:migrate -- --name add_observations_and_scoring
```

Phase 5 does not require a schema migration, but it does add backend dependencies for report generation:

```bash
cd backend
npm install
```

For the audit trail schema change, run:

```bash
npm run prisma:migrate -- --name add_audit_trail_log
```

6. Seed default roles and admin user:

```bash
npm run prisma:seed
```

7. Start the backend:

```bash
npm run dev
```

Backend base URL: `http://localhost:4000/api`

## Frontend Run Instructions

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Install frontend dependencies:

```bash
cd frontend
npm install
```

3. Start the frontend:

```bash
npm run dev
```

Frontend URL: `http://localhost:5173`

## Seed Login

- Email: `admin@aiaudit.local`
- Password: `Admin@123`

## Available APIs

- `POST /api/auth/login`
- `POST /api/auth/register` (Admin only)
- `GET /api/auth/me`
- `GET /api/tools`
- `GET /api/tools/:id`
- `POST /api/tools` (Admin only)
- `PUT /api/tools/:id` (Admin only)
- `DELETE /api/tools/:id` (Admin only)
- `GET /api/checklists`
- `GET /api/checklists/:id`
- `POST /api/checklists` (Admin only)
- `PUT /api/checklists/:id` (Admin only)
- `DELETE /api/checklists/:id` (Admin only)
- `GET /api/audits/meta`
- `GET /api/audits`
- `GET /api/audits/:id`
- `POST /api/audits` (Admin/Auditor)
- `PATCH /api/audits/:id/status`
- `POST /api/audits/:id/responses` (Admin/Auditor, multipart upload supported)
- `GET /api/observations`
- `PATCH /api/observations/:id/status`
- `GET /api/dashboard`
- `GET /api/audits/:id/export/excel`
- `GET /api/audits/:id/export/pdf`
- `GET /api/audit-trails`

## Security Notes

- Passwords are hashed using `bcryptjs`
- JWT bearer tokens protect private APIs
- Role checks are enforced in backend middleware
- Soft delete fields are included in `user_master` and `role_master`
- Evidence uploads are restricted by file type and size through `multer`
- Non-compliant responses automatically raise observations for remediation tracking
- Screenshot analysis can auto-generate audit response and observation draft content when `OPENAI_API_KEY` is configured

## Vercel Deployment

This repository is configured for a single Vercel project:

- `frontend/` builds as the static React application
- `api/[[...route]].js` exposes the Express backend as a Vercel serverless API
- Prisma client generation runs during the Vercel build
- Evidence uploads can use Vercel Blob in production

### Recommended Architecture

- Frontend: Vercel static hosting
- Backend API: Vercel serverless function
- Database: Neon, Supabase, Railway, or another managed PostgreSQL provider
- File storage: Vercel Blob

### Required Vercel Environment Variables

Set these in the Vercel project dashboard:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN=8h`
- `FRONTEND_URL=https://your-project.vercel.app`
- `APP_URL=https://your-project.vercel.app`
- `VITE_API_BASE_URL=/api`

For persistent evidence uploads:

- `STORAGE_MODE=blob`
- `BLOB_READ_WRITE_TOKEN=...`

For screenshot analysis:

- `OPENAI_API_KEY=...`
- `OPENAI_VISION_MODEL=gpt-4.1-mini`

If you want preview deployments to work without manually changing `FRONTEND_URL` every time:

- `ALLOW_VERCEL_PREVIEW_ORIGINS=true`

### Deploy Steps

1. Push the repository to GitHub.
2. Import the repo into Vercel.
3. Keep the project root as the repository root.
4. Vercel will use `vercel.json` to install dependencies, generate Prisma client, build the frontend, and expose the backend API.
5. Add the environment variables listed above.
6. Deploy.

### Important Production Note

Do not use local filesystem upload storage on Vercel for long-term evidence retention. Use `STORAGE_MODE=blob` with `BLOB_READ_WRITE_TOKEN` so uploaded evidence persists across serverless invocations.
