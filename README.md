
# CareerCompass 🎯

CareerCompass is a web-based job application tracking system that helps users organize and monitor their job search in one place.

## Features

- **Application Tracking:** Add and manage job applications.
- **Status Management:** Update application statuses, such as Wishlist and Applied.
- **Application Deletion:** Remove applications when they are no longer needed.
- **Persistent Storage:** Store application records in an SQLite database through a FastAPI backend.
- **Dashboard:** View application information and progress.
- **Application Preparation:** Access preparation checklists and track tasks.
- **Search and Filtering:** Find applications more easily.
- **Deadline Tracking:** Keep track of application deadlines.

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Python
- FastAPI
- Uvicorn

### Database
- SQLite

## Project Structure

```text
Careercompass/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── app-backup.js
└── backend/
    ├── main.py
    ├── database.py
    └── careercompass.db
```

## Getting Started

### Prerequisites

- Python 3.10 or later
- Visual Studio Code
- A modern web browser
- The Live Server extension for VS Code

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd Careercompass
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual GitHub repository URL.

### 2. Create a Virtual Environment

```bash
python -m venv .venv
```

Activate it in Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Install Dependencies

```bash
pip install fastapi "uvicorn[standard]"
```

### 4. Start the Backend

From the project root, run:

```bash
python -m uvicorn backend.main:app --reload
```

The backend will run at:

http://127.0.0.1:8000

Interactive API documentation is available at:

http://127.0.0.1:8000/docs

### 5. Start the Frontend

Open `index.html` using the VS Code Live Server extension.

The frontend will typically be available at:

http://127.0.0.1:5500/index.html

Keep the backend running while using the application.

## API Overview

The FastAPI backend supports application operations, including:

- `GET /applications` — Retrieve applications.
- `POST /applications` — Create an application.
- `PATCH /applications/{application_id}` — Update an application.
- `DELETE /applications/{application_id}` — Delete an application.

## Data Storage

Application records are stored in SQLite through the backend.

The local database file is created and maintained by the application. Do not commit your local database or sensitive information to a public repository.

Some checklist information may be stored separately in browser local storage.

## Future Improvements

- User authentication and individual user accounts.
- Improved dashboard analytics.
- Notifications for upcoming deadlines.
- Deployment to a public hosting platform.

## Author

Developed as a project to explore web development, REST APIs, and database integration.
