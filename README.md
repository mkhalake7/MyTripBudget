# MyTripBudget

A premium trip budget management application built with FastAPI and React.

## Features
- Glassmorphic UI with modern aesthetics.
- Group-based expense tracking.
- Secure authentication.
- Responsive design.

## Deployment

The application is configured for a high-performance free deployment:
- **Frontend & API**: [Vercel](https://vercel.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)

For detailed deployment instructions, see the [Walkthrough](.gemini/antigravity/brain/d4d1676c-d300-49bc-a9df-5a80fa135558/walkthrough.md).

## Local Development

### Backend
1. `cd backend`
2. `python -m venv venv`
3. `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
4. `pip install -r requirements.txt`
5. `uvicorn main:app --reload`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`
