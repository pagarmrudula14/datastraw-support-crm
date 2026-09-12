# Datastraw Support CRM

A clean, full-stack Customer Support Ticketing CRM built for the Datastraw AI + Tech Intern assessment.

## Tech stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: SQLite
- Styling: Plain CSS
- Deployment: Render-ready single web service
# SupportFlow CRM — Datastraw Support Ticketing System

A full-stack customer support ticketing CRM built for the **Datastraw AI + Tech Intern Assessment**. It lets a support team create, search, filter, and resolve customer tickets through a clean, responsive dashboard backed by a REST API and a SQLite database.

**🔗 Live app:** https://datastraw-support-crm-6xz9.onrender.com/
**📦 Repo:** https://github.com/pagarmrudula14/datastraw-support-crm

> Note: the live app is hosted on Render's free tier, which spins down after periods of inactivity. The first request after idle time may take 30–50 seconds to respond while the server wakes up.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Database schema](#database-schema)
- [API reference](#api-reference)
- [Getting started locally](#getting-started-locally)
- [Environment variables](#environment-variables)
- [Deployment](#deployment)
- [Standout feature](#standout-feature)
- [Assessment checklist](#assessment-checklist)

---

## Features

- **Create tickets** — capture customer name, email, issue title, and description, with an auto-generated ticket ID (`TKT-001`, `TKT-002`, ...) and timestamp
- **List all tickets** — a clean table view showing ticket ID, customer, subject, priority, status, and creation date
- **Live search** — search-as-you-type across ticket ID, customer name, email, subject, and description
- **Filter by status** — Open / In Progress / Closed
- **Ticket detail view** — full description, customer contact info, and a running history of internal notes
- **Update tickets** — change status or priority and add timestamped internal notes
- **Priority levels** *(standout feature — see below)* — Low / Medium / High, visualized with color-coded badges and a dashboard stat card
- **Responsive UI** — usable on both desktop and mobile screen sizes


## Project structure

```text
datastraw-support-crm/
├── client/                  React + Vite frontend
│   ├── src/
│   │   ├── main.jsx          App entry point + all UI components
│   │   └── styles.css        Global styles
│   ├── index.html
│   ├── vite.config.js        Dev server + API proxy config
│   └── package.json
├── server/                  Express API
│   ├── src.js                 App entry point, routes, and DB access
│   ├── .env.example           Sample environment variables
│   └── package.json
├── database/                 SQLite file is created here at runtime
├── package.json              Root scripts (installs & runs both apps together)
└── README.md
```

## Database schema

The schema is intentionally kept to two tables, per the assessment's guidance to avoid over-engineering.

### `tickets`

| Column | Type | Notes |
|---|---|---|
| `id` | `INTEGER` | Primary key, auto-increment |
| `ticket_id` | `TEXT` | Unique, human-readable ID (e.g. `TKT-001`) |
| `customer_name` | `TEXT` | Required |
| `customer_email` | `TEXT` | Required |
| `subject` | `TEXT` | Required |
| `description` | `TEXT` | Required |
| `status` | `TEXT` | One of `Open`, `In Progress`, `Closed` — defaults to `Open` |
| `priority` | `TEXT` | One of `Low`, `Medium`, `High` — defaults to `Medium` |
| `created_at` | `TEXT` | ISO timestamp, set on creation |
| `updated_at` | `TEXT` | ISO timestamp, updated on every change |

### `notes`

| Column | Type | Notes |
|---|---|---|
| `id` | `INTEGER` | Primary key, auto-increment |
| `ticket_id` | `TEXT` | Foreign key → `tickets.ticket_id`, cascades on delete |
| `note_text` | `TEXT` | Required |
| `created_at` | `TEXT` | ISO timestamp, set on creation |

A ticket can have many notes (one-to-many), giving each ticket a running activity log.

## API reference

Base URL locally: `http://localhost:5000/api` (or whichever port is set in `.env`)
Base URL in production: `https://datastraw-support-crm-6xz9.onrender.com/api`

### `GET /api/health`

Simple liveness check.

```json
{ "success": true, "message": "Datastraw Support CRM API is running" }
```

### `POST /api/tickets`

Creates a new ticket.

**Request body:**
```json
{
  "customer_name": "Rahul Sharma",
  "customer_email": "rahul@example.com",
  "subject": "Payment failed",
  "description": "Payment failed while placing an order",
  "priority": "High"
}
```

**Response — `201 Created`:**
```json
{ "ticket_id": "TKT-001", "created_at": "2026-09-12T14:08:19.941Z" }
```

### `GET /api/tickets`

Lists tickets, newest first. Supports optional query parameters.

| Param | Description |
|---|---|
| `status` | Filter by `Open`, `In Progress`, or `Closed` |
| `search` | Matches against ticket ID, customer name, email, subject, or description |

Example: `GET /api/tickets?status=Open&search=rahul`

**Response:**
```json
[
  {
    "ticket_id": "TKT-001",
    "customer_name": "Rahul Sharma",
    "subject": "Payment failed",
    "status": "Open",
    "priority": "High",
    "created_at": "2026-09-12T14:08:19.941Z",
    "updated_at": "2026-09-12T14:08:19.941Z"
  }
]
```

### `GET /api/tickets/:ticket_id`

Returns full ticket details, including its notes history.

**Response:**
```json
{
  "ticket_id": "TKT-001",
  "customer_name": "Rahul Sharma",
  "customer_email": "rahul@example.com",
  "subject": "Payment failed",
  "description": "Payment failed while placing an order",
  "status": "Open",
  "priority": "High",
  "created_at": "2026-09-12T14:08:19.941Z",
  "updated_at": "2026-09-12T14:08:19.941Z",
  "notes": []
}
```

### `PUT /api/tickets/:ticket_id`

Updates a ticket's status and/or priority, and optionally appends a note.

**Request body:**
```json
{
  "status": "In Progress",
  "priority": "High",
  "notes": "Customer contacted support."
}
```

**Response:**
```json
{ "success": true, "updated_at": "2026-09-12T14:08:19.974Z" }
```

## Getting started locally

**Prerequisites:** Node.js 18+ and npm.

```bash
# 1. Clone the repo
git clone https://github.com/pagarmrudula14/datastraw-support-crm.git
cd datastraw-support-crm

# 2. Install dependencies for both server and client
npm run install:all

# 3. (Optional) set up environment variables — see below
cp server/.env.example server/.env

# 4. Start both the API and frontend together
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000 (or the port set in `server/.env`)

The Vite dev server proxies `/api` requests to the backend, so the frontend and API work together seamlessly during development.

### Production build

```bash
npm run build   # builds the React app into client/dist
npm start       # starts the Express server, which serves the built frontend
```

## Environment variables

Defined in `server/.env` (copy from `server/.env.example`):

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port the Express server listens on |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_PATH` | `../database/support_crm.sqlite` | Path to the SQLite file, relative to `server/` |

None of these are required in production — Render assigns `PORT` automatically, and `DATABASE_PATH` falls back to a sensible default.

## Deployment

Deployed as a single Render **Web Service**, which builds the React frontend and serves it directly from the same Express server that powers the API — no separate frontend/backend hosting needed.

| Setting | Value |
|---|---|
| Build command | `npm install && npm run install:all && npm run build` |
| Start command | `npm start` |
| Environment | `NODE_ENV=production` |

## Standout feature

**Ticket priority (Low / Medium / High).**

Support teams triaging a high volume of tickets need a fast way to spot what's urgent without introducing a complicated scoring or SLA system. Adding a simple, required priority field — visible as a color-coded badge in both the list and detail views, plus its own dashboard stat card — gives that visibility with almost no added complexity to the schema or UI. The tradeoff: it's a manual, self-reported field rather than an automatically calculated urgency score, which keeps the system simple but relies on the person creating the ticket to set it accurately.

## Assessment checklist

- [x] Full-stack app: database, REST API, frontend
- [x] Create tickets with auto-generated ID and timestamp
- [x] List view with ID, name, subject, status, date
- [x] Search across name, ID, email, and description
- [x] Filter by status
- [x] Ticket detail view with status/priority updates and notes
- [x] Two-table schema (`tickets`, `notes`)
- [x] Deployed, public, working URL
- [x] GitHub repo with README, `.env.example`, `.gitignore`
- [x] One deliberate standout feature (Priority)

---

Built by **Mrudula Pagar** — [LinkedIn](https://linkedin.com/in/mrudulapagar) · [GitHub](https://github.com/pagarmrudula14)
