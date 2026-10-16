
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware   
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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
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



@app.patch("/applications/{application_id}")
def update_application(application_id: int, application: ApplicationCreate):
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
        connection.execute(
            """
            UPDATE applications
            SET company = ?, role = ?, status = ?, deadline = ?
            WHERE id = ?
            """,
            (company, role, status, deadline, application_id),
        )

        row = connection.execute(
            """
            SELECT id, company, role, status, deadline, created_at
            FROM applications
            WHERE id = ?
            """,
            (application_id,),
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Application not found.",
        )

    return dict(row)


@app.delete("/applications/{application_id}")
def delete_application(application_id: int):
    with get_connection() as connection:
        cursor = connection.execute(
            "DELETE FROM applications WHERE id = ?",
            (application_id,),
        )

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=404,
                detail="Application not found.",
            )

    return {
        "message": "Application deleted successfully.",
        "id": application_id,
    }

