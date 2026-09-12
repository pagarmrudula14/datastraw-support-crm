const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const databasePath = path.resolve(__dirname, process.env.DATABASE_PATH || '../database/support_crm.sqlite');
const clientDistPath = path.resolve(__dirname, '../client/dist');

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new sqlite3.Database(databasePath);

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function onRun(error) {
    if (error) reject(error);
    else resolve({ id: this.lastID, changes: this.changes });
  });
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (error, row) => {
    if (error) reject(error);
    else resolve(row);
  });
});

const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (error, rows) => {
    if (error) reject(error);
    else resolve(rows);
  });
});

const initializeDatabase = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT UNIQUE,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Closed')),
      priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Low', 'Medium', 'High')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT NOT NULL,
      note_text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE
    )
  `);
};

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Datastraw Support CRM API is running' });
});

app.post('/api/tickets', async (req, res, next) => {
  try {
    const { customer_name, customer_email, subject, description, priority = 'Medium' } = req.body;

    if (!customer_name?.trim() || !customer_email?.trim() || !subject?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, message: 'Customer name, email, subject and description are required.' });
    }

    if (!['Low', 'Medium', 'High'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Priority must be Low, Medium or High.' });
    }

    const now = new Date().toISOString();
    const result = await run(
      `INSERT INTO tickets (ticket_id, customer_name, customer_email, subject, description, status, priority, created_at, updated_at)
       VALUES (NULL, ?, ?, ?, ?, 'Open', ?, ?, ?)`,
      [customer_name.trim(), customer_email.trim(), subject.trim(), description.trim(), priority, now, now]
    );

    const ticketId = `TKT-${String(result.id).padStart(3, '0')}`;
    await run('UPDATE tickets SET ticket_id = ? WHERE id = ?', [ticketId, result.id]);

    return res.status(201).json({ ticket_id: ticketId, created_at: now });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/tickets', async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const conditions = [];
    const params = [];

    if (status && status !== 'All') {
      if (!['Open', 'In Progress', 'Closed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status filter.' });
      }
      conditions.push('status = ?');
      params.push(status);
    }

    if (search?.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push(`(ticket_id LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR subject LIKE ? OR description LIKE ?)`);
      params.push(term, term, term, term, term);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const tickets = await all(
      `SELECT ticket_id, customer_name, subject, status, priority, created_at, updated_at
       FROM tickets ${whereClause} ORDER BY datetime(created_at) DESC`,
      params
    );

    return res.json(tickets);
  } catch (error) {
    return next(error);
  }
});

app.get('/api/tickets/:ticket_id', async (req, res, next) => {
  try {
    const ticket = await get(
      `SELECT ticket_id, customer_name, customer_email, subject, description, status, priority, created_at, updated_at
       FROM tickets WHERE ticket_id = ?`,
      [req.params.ticket_id]
    );

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const notes = await all(
      `SELECT id, note_text, created_at FROM notes WHERE ticket_id = ? ORDER BY datetime(created_at) DESC`,
      [req.params.ticket_id]
    );

    return res.json({ ...ticket, notes });
  } catch (error) {
    return next(error);
  }
});

app.put('/api/tickets/:ticket_id', async (req, res, next) => {
  try {
    const { status, notes, priority } = req.body;
    const ticketId = req.params.ticket_id;
    const ticket = await get('SELECT id FROM tickets WHERE ticket_id = ?', [ticketId]);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    if (status && !['Open', 'In Progress', 'Closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    if (priority && !['Low', 'Medium', 'High'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Invalid priority.' });
    }

    const updatedAt = new Date().toISOString();
    const nextStatus = status || (await get('SELECT status FROM tickets WHERE ticket_id = ?', [ticketId])).status;
    const nextPriority = priority || (await get('SELECT priority FROM tickets WHERE ticket_id = ?', [ticketId])).priority;

    await run(
      `UPDATE tickets SET status = ?, priority = ?, updated_at = ? WHERE ticket_id = ?`,
      [nextStatus, nextPriority, updatedAt, ticketId]
    );

    if (notes?.trim()) {
      await run(
        `INSERT INTO notes (ticket_id, note_text, created_at) VALUES (?, ?, ?)`,
        [ticketId, notes.trim(), updatedAt]
      );
    }

    return res.json({ success: true, updated_at: updatedAt });
  } catch (error) {
    return next(error);
  }
});

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ success: false, message: 'Something went wrong on the server.' });
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Datastraw Support CRM API running on port ${PORT}`));
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
