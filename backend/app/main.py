from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import auth, teacher, sections, subjects, assignments, students, marks, attendance, analytics, reports
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    title="Teacher Academic Management System",
    description="REST API for teacher-centric academic management and analytics",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


app.include_router(auth.router, prefix="/api")
app.include_router(teacher.router, prefix="/api")
app.include_router(sections.router, prefix="/api")
app.include_router(subjects.router, prefix="/api")
app.include_router(assignments.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(marks.router, prefix="/api")
app.include_router(attendance.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(reports.router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "TAMS API"}
