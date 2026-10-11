# Research Opportunity Portal

A full-stack web app where faculty post, view, update and manage research opportunities in one place.

**GitHub Repository:** https://github.com/AyyanMirani77/research-opportunity-portal

## Tech stack
- Backend: Python 3 + Flask REST API
- Database: MySQL
- Frontend: HTML, CSS, vanilla JavaScript

## Project structure
```
backend/    Flask API (app.py, requirements.txt, .env.example)
frontend/   index.html, style.css, app.js
database/   schema.sql (tables + sample data)
postman/    exported Postman collection
```

## Setup
1. **Create the database**
   ```
   mysql -u root -p < database/schema.sql
   ```
2. **Install backend dependencies**
   ```
   cd backend
   python -m venv venv
   venv\Scripts\activate          # Windows  (Mac/Linux: source venv/bin/activate)
   pip install -r requirements.txt
   ```
3. **Set credentials** – copy `.env.example` to `.env` and put in your MySQL password (`.env` is git-ignored).
4. **Run**
   ```
   python app.py
   ```
5. Open **http://localhost:5000** – Flask serves the frontend and the API together.

## API endpoints
| Method | Endpoint | Purpose | Success | Errors |
|---|---|---|---|---|
| POST | /api/opportunities | Create | 201 | 400, 500 |
| GET | /api/opportunities | List all | 200 | 500 |
| GET | /api/opportunities/:id | Get one | 200 | 404, 500 |
| PUT | /api/opportunities/:id | Update (partial allowed) | 200 | 400, 404, 500 |
| DELETE | /api/opportunities/:id | Delete | 200 | 404, 500 |

Fields: `title, description, research_area, faculty_name, department, required_skills, positions, deadline (YYYY-MM-DD), status (Open|Closed)`.

## Testing
Import `postman/Research_Opportunity_Portal.postman_collection.json` into Postman and run the requests in order (they cover create x3, list, get one, update, close, delete, 404 and 400 validation).

## Suggested commit history
`init project structure` → `add MySQL schema` → `add create/list endpoints` → `add get/update/delete + validation` → `add frontend layout and styling` → `connect frontend to API` → `add postman collection and README`
