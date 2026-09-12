# Datastraw Support CRM

A clean, full-stack Customer Support Ticketing CRM built for the Datastraw AI + Tech Intern assessment.

## Tech stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: SQLite
- Styling: Plain CSS
- Deployment: Render-ready single web service

## Core requirements covered

- Create support tickets
- Auto-generated ticket IDs and timestamps
- List all tickets
- Search by ticket ID, customer name, email, subject, and description
- Filter by Open / In Progress / Closed
- View ticket details
- Update ticket status
- Add notes/comments
- Responsive professional UI
- REST API
- SQLite database

## Standout feature

**Ticket Priority** (Low / Medium / High) was added as one thoughtful extension. Support teams need a quick way to identify urgent customer issues without introducing a complicated scoring system.

## Project structure

```text
client/     React + Vite frontend
server/     Express API and SQLite access
 database/  SQLite database file is created here at runtime
```

## Run locally

### 1. Install dependencies

```bash
npm install
npm run install:all
```

### 2. Start development servers

```bash
npm run dev
```

Frontend: http://localhost:5173  
API: http://localhost:5000

### 3. Production build

```bash
npm run build
npm start
```

The Express server serves the built React app in production.

## API endpoints

### POST `/api/tickets`
Creates a ticket.

```json
{
  "customer_name": "Rahul Sharma",
  "customer_email": "rahul@example.com",
  "subject": "Payment failed",
  "description": "Payment failed while placing an order",
  "priority": "High"
}
```

### GET `/api/tickets`
Supports optional query parameters:

```text
/api/tickets?status=Open&search=rahul
```

### GET `/api/tickets/:ticket_id`
Returns complete ticket details and notes.

### PUT `/api/tickets/:ticket_id`
Updates status and/or adds a note.

```json
{
  "status": "In Progress",
  "notes": "Customer contacted support."
}
```

## Database

The project intentionally keeps the schema simple with two tables: `tickets` and `notes`.

## Environment variables

Copy `.env.example` to `.env` if you want to customize the server configuration.

## Deployment

The server is configured to serve `client/dist` after a production build, so it can be deployed as one Render web service. Set the build command to:

```text
npm install && npm run install:all && npm run build
```

and the start command to:

```text
npm start
```

## Assessment submission checklist

- Public deployed application URL
- GitHub repository
- 3–5 minute demo video
- Submission email containing approach, proud features, challenges, improvements, live URL, repository, video, and LinkedIn profile
