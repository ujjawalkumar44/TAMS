# Teacher Academic Management System (TAMS)

A teacher-centric academic management and analytics platform built with **React**, **FastAPI**, and **SQLite/PostgreSQL**.

## What It Does

Helps a college teacher who teaches **multiple sections** and **multiple subjects** to:
- Manage sections, subjects, and student records
- Assign subjects to sections (auto-enrolls students)
- Enter marks and attendance (Phases 2–3)
- Identify struggling students with rule-based analytics (Phases 4–5)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, Recharts, Lucide |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Database | SQLite (default), PostgreSQL-ready |
| Auth | JWT + bcrypt |

## Quick Start

### Backend
```powershell
cd backend
venv\Scripts\activate
python seed.py
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

## Demo Credentials

| Field | Value |
|-------|-------|
| Email | `teacher@college.edu` |
| Password | `Teacher@123` |

## Seeded Demo Data

- 1 teacher (Dr. Priya Sharma)
- 3 sections: CSE-A, CSE-B, CSE-C
- 2 subjects: Data Structures, DBMS
- 6 teacher-subject-section assignments
- 75 students with varied performance patterns
- Pre-seeded marks & attendance for analytics (Phase 4–5)

## Implementation Phases

| Phase | Status | Features |
|-------|--------|----------|
| 1 | ✅ Done | Auth, Sections, Subjects, Students, Assignments |
| 2 | ✅ Done | Bulk marks entry, validation, auto total/percentage |
| 3 | ✅ Done | Daily attendance, Mark All Present, alerts |
| 4 | ✅ Done | Dashboard analytics, charts, section/subject comparison |
| 5 | ✅ Done | At-risk detection, student profile analytics, trend charts, recommended actions |
| 6 | ✅ Done | Reports page, CSV/Excel export, at-risk export from list |

## API Endpoints (Phase 1)

- `POST /api/auth/login` — Teacher login (email + password)
- `GET /api/teacher/profile` — Teacher profile
- `GET/POST /api/sections` — Section CRUD
- `GET/POST /api/subjects` — Subject CRUD
- `GET/POST /api/assignments` — Teacher subject-section assignments
- `GET /api/marks/sheet?subject_id=&section_id=` — Bulk marks table
- `POST /api/marks/bulk` — Save all marks (single assessment or full)
- `GET /api/analytics/dashboard` — Dashboard stats, charts, comparisons
- `GET /api/analytics/at-risk` — At-risk students with reasons & recommendations
- `GET /api/analytics/student/{id}` — Per-student marks, attendance, trends, risk analysis
- `GET /api/reports/preview?report_type=` — Row count preview before export
- `GET /api/reports/{type}/export?format=csv|xlsx` — Download enrollment, marks, attendance, at-risk, or section summary reports

API Docs: **http://127.0.0.1:8000/api/docs**

## Database Schema

```
Teacher ──< TeacherSubjectSection >── Subject
                      │
                   Section
                      │
                   Student ──< Enrollment >── Subject
                      │
              MarkRecord / AttendanceRecord (per student+subject+section)
```

## Risk Scoring (Phase 5 — configured in `app/core/thresholds.py`)

Transparent rule-based scoring:
- Low performance (<50%): +25 points
- Low attendance (<75%): +20 points
- Critical attendance (<60%): +15 points
- Poor assessments: +15 points
- Declining trend: +10 points

Risk levels: Low (0–20), Moderate (21–40), High (41–60), Critical (61+)
