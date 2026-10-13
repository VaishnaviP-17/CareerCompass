
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from backend.database import get_connection, init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="CareerCompass API",
    description="Backend API for the CareerCompass application",
    version="1.0.0",
    lifespan=lifespan,
)


class ApplicationCreate(BaseModel):
    company: str = Field(min_length=1, max_length=150)
    role: str = Field(min_length=1, max_length=150)
    status: str = Field(default="Applied", max_length=50)
    deadline: str | None = None


@app.get("/")
def home():
    return {
        "message": "Welcome to CareerCompass API!",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/applications")
def list_applications():
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, company, role, status, deadline, created_at
            FROM applications
            ORDER BY id DESC
            """
        ).fetchall()

    return [dict(row) for row in rows]


@app.post("/applications", status_code=201)
def create_application(application: ApplicationCreate):
    company = application.company.strip()
    role = application.role.strip()
    status = application.status.strip()
    deadline = application.deadline

    if not company or not role or not status:
        raise HTTPException(
            status_code=422,
            detail="Company, role, and status cannot be blank.",
        )

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO applications (company, role, status, deadline)
            VALUES (?, ?, ?, ?)
            """,
            (company, role, status, deadline),
        )

        row = connection.execute(
            """
            SELECT id, company, role, status, deadline, created_at
            FROM applications
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()

    return dict(row)
