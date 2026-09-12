import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, AlertCircle, ArrowLeft, CheckCircle2, Clock3, Filter, Inbox, MessageSquareText, Plus, Search, ShieldCheck, Sparkles, Ticket, X } from 'lucide-react';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const statuses = ['All', 'Open', 'In Progress', 'Closed'];
const priorities = ['Low', 'Medium', 'High'];

function App() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [view, setView] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (status !== 'All') params.set('status', status);
      if (search.trim()) params.set('search', search.trim());
      const response = await fetch(`${API_URL}/tickets?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load tickets.');
      setTickets(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchTickets, 180);
    return () => clearTimeout(timer);
  }, [search, status]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === 'Open').length,
    progress: tickets.filter((ticket) => ticket.status === 'In Progress').length,
    closed: tickets.filter((ticket) => ticket.status === 'Closed').length,
    high: tickets.filter((ticket) => ticket.priority === 'High').length
  }), [tickets]);

  const openTicket = async (ticketId) => {
    try {
      const response = await fetch(`${API_URL}/tickets/${ticketId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Unable to load ticket.');
      setSelectedTicket(data);
      setView('detail');
    } catch (err) {
      setError(err.message);
    }
  };

  const createTicket = async (form) => {
    const response = await fetch(`${API_URL}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to create ticket.');
    await fetchTickets();
    setView('dashboard');
    setToast(`${data.ticket_id} created successfully`);
  };

  const updateTicket = async (ticketId, updates) => {
    const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Unable to update ticket.');
    await openTicket(ticketId);
    await fetchTickets();
    setToast('Ticket updated successfully');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Ticket size={21} /></div>
          <div><strong>SupportFlow</strong><span>CRM Workspace</span></div>
        </div>
        <nav>
          <button className={view === 'dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => setView('dashboard')}><Inbox size={18} /> Dashboard</button>
          <button className={view === 'create' ? 'nav-item active' : 'nav-item'} onClick={() => setView('create')}><Plus size={18} /> New ticket</button>
        </nav>
        <div className="sidebar-card">
          <div className="tiny-label">WORKSPACE STATUS</div>
          <div className="status-line"><span className="live-dot" /> All systems operational</div>
          <p>Simple tools for fast, human customer support.</p>
        </div>
        <div className="sidebar-footer"><ShieldCheck size={15} /> Datastraw assessment build</div>
      </aside>

      <main className="main-content">
        {view === 'dashboard' && (
          <Dashboard stats={stats} search={search} setSearch={setSearch} status={status} setStatus={setStatus} tickets={tickets} loading={loading} error={error} openTicket={openTicket} setView={setView} />
        )}
        {view === 'create' && <CreateTicket onBack={() => setView('dashboard')} onCreate={createTicket} />}
        {view === 'detail' && selectedTicket && <TicketDetail ticket={selectedTicket} onBack={() => setView('dashboard')} onUpdate={updateTicket} />}
      </main>

      {toast && <div className="toast"><CheckCircle2 size={18} /> {toast}</div>}
    </div>
  );
}

function Dashboard({ stats, search, setSearch, status, setStatus, tickets, loading, error, openTicket, setView }) {
  return (
    <div className="page">
      <header className="topbar">
        <div><div className="eyebrow">CUSTOMER SUPPORT</div><h1>Ticket dashboard</h1><p>Keep every customer issue visible, searchable and actionable.</p></div>
        <button className="primary-button" onClick={() => setView('create')}><Plus size={18} /> Create ticket</button>
      </header>

      <section className="stat-grid">
        <StatCard label="Total tickets" value={stats.total} icon={<Inbox />} />
        <StatCard label="Open" value={stats.open} icon={<AlertCircle />} />
        <StatCard label="In progress" value={stats.progress} icon={<Activity />} />
        <StatCard label="Closed" value={stats.closed} icon={<CheckCircle2 />} />
        <StatCard label="High priority" value={stats.high} icon={<Sparkles />} />
      </section>

      <section className="panel">
        <div className="toolbar">
          <div className="search-wrap"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ID, customer, email, issue or description..." /></div>
          <div className="filter-wrap"><Filter size={16} /><select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></div>
        </div>

        {error && <div className="error-box"><AlertCircle size={18} /> {error}</div>}
        {loading ? <div className="empty-state"><div className="spinner" /> Loading tickets...</div> : tickets.length === 0 ? <div className="empty-state"><Inbox size={38} /><h3>No tickets found</h3><p>Try a different search or create your first support ticket.</p></div> : (
          <div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Customer</th><th>Issue</th><th>Priority</th><th>Status</th><th>Created</th><th></th></tr></thead><tbody>
            {tickets.map((ticket) => <tr key={ticket.ticket_id} onClick={() => openTicket(ticket.ticket_id)}>
              <td><span className="ticket-code">{ticket.ticket_id}</span></td>
              <td><div className="customer-cell"><span className="avatar">{ticket.customer_name.charAt(0).toUpperCase()}</span><span>{ticket.customer_name}</span></div></td>
              <td><div className="subject-cell"><strong>{ticket.subject}</strong><span>{ticket.ticket_id} · support request</span></div></td>
              <td><PriorityBadge priority={ticket.priority} /></td>
              <td><StatusBadge status={ticket.status} /></td>
              <td><span className="date-cell"><Clock3 size={14} /> {formatDate(ticket.created_at)}</span></td>
              <td><button className="icon-button" aria-label="Open ticket"><ArrowLeft size={17} className="rotate-180" /></button></td>
            </tr>)}
          </tbody></table></div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }) { return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>; }
function StatusBadge({ status }) { return <span className={`badge status-${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>; }
function PriorityBadge({ priority }) { return <span className={`badge priority-${priority.toLowerCase()}`}><span className="priority-dot" />{priority}</span>; }
function formatDate(value) { return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value)); }
function formatDateTime(value) { return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }

function CreateTicket({ onBack, onCreate }) {
  const [form, setForm] = useState({ customer_name: '', customer_email: '', subject: '', description: '', priority: 'Medium' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    try { setSaving(true); setError(''); await onCreate(form); } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return <div className="page narrow-page">
    <button className="back-button" onClick={onBack}><ArrowLeft size={17} /> Back to dashboard</button>
    <header className="form-header"><div className="form-icon"><MessageSquareText /></div><div><div className="eyebrow">NEW SUPPORT REQUEST</div><h1>Create a ticket</h1><p>Capture the customer issue clearly so your team can resolve it quickly.</p></div></header>
    <form className="panel form-card" onSubmit={submit}>
      {error && <div className="error-box"><AlertCircle size={18} /> {error}</div>}
      <div className="form-section"><h3>Customer information</h3><p>Who needs help?</p><div className="form-grid"><Field label="Customer name" required><input value={form.customer_name} onChange={(e) => update('customer_name', e.target.value)} placeholder="e.g. Rahul Sharma" required /></Field><Field label="Customer email" required><input type="email" value={form.customer_email} onChange={(e) => update('customer_email', e.target.value)} placeholder="rahul@example.com" required /></Field></div></div>
      <div className="form-section"><h3>Issue details</h3><p>Describe the problem in enough detail for the support team.</p><Field label="Issue title" required><input value={form.subject} onChange={(e) => update('subject', e.target.value)} placeholder="e.g. Payment failed while placing order" required /></Field><Field label="Description" required><textarea rows="6" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Tell us what happened, what the customer expected, and any useful context..." required /></Field><Field label="Priority"><div className="priority-options">{priorities.map((item) => <button type="button" key={item} className={form.priority === item ? `priority-option selected ${item.toLowerCase()}` : 'priority-option'} onClick={() => update('priority', item)}><span className="priority-dot" /> {item}</button>)}</div></Field></div>
      <div className="form-actions"><button type="button" className="secondary-button" onClick={onBack}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Creating...' : <><Plus size={18} /> Create ticket</>}</button></div>
    </form>
  </div>;
}

function Field({ label, required, children }) { return <label className="field"><span>{label}{required && <em> *</em>}</span>{children}</label>; }

function TicketDetail({ ticket, onBack, onUpdate }) {
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setStatus(ticket.status); setPriority(ticket.priority); }, [ticket]);

  const save = async () => {
    try { setSaving(true); setError(''); await onUpdate(ticket.ticket_id, { status, priority, notes: note }); setNote(''); } catch (err) { setError(err.message); } finally { setSaving(false); }
  };

  return <div className="page narrow-page">
    <button className="back-button" onClick={onBack}><ArrowLeft size={17} /> Back to dashboard</button>
    <header className="detail-header"><div><div className="eyebrow">TICKET {ticket.ticket_id}</div><h1>{ticket.subject}</h1><p>Created {formatDateTime(ticket.created_at)} · Updated {formatDateTime(ticket.updated_at)}</p></div><div className="detail-badges"><PriorityBadge priority={priority} /><StatusBadge status={status} /></div></header>
    {error && <div className="error-box"><AlertCircle size={18} /> {error}</div>}
    <div className="detail-grid">
      <section className="panel detail-main"><div className="section-title"><div><h3>Issue description</h3><span>Customer request</span></div></div><p className="description">{ticket.description}</p><div className="customer-box"><span className="avatar large">{ticket.customer_name.charAt(0).toUpperCase()}</span><div><span className="tiny-label">CUSTOMER</span><strong>{ticket.customer_name}</strong><a href={`mailto:${ticket.customer_email}`}>{ticket.customer_email}</a></div></div></section>
      <section className="panel update-panel"><div className="section-title"><div><h3>Update ticket</h3><span>Keep the ticket current</span></div></div><Field label="Status"><select value={status} onChange={(e) => setStatus(e.target.value)}><option>Open</option><option>In Progress</option><option>Closed</option></select></Field><Field label="Priority"><select value={priority} onChange={(e) => setPriority(e.target.value)}>{priorities.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Add note"><textarea rows="5" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal support note..." /></Field><button className="primary-button full" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button></section>
    </div>
    <section className="panel notes-panel"><div className="section-title"><div><h3>Activity & notes</h3><span>{ticket.notes.length} {ticket.notes.length === 1 ? 'entry' : 'entries'}</span></div></div>{ticket.notes.length === 0 ? <div className="notes-empty"><MessageSquareText size={22} /><span>No notes yet. Add one when you update the ticket.</span></div> : <div className="notes-list">{ticket.notes.map((item) => <div className="note" key={item.id}><div className="note-dot" /><div><p>{item.note_text}</p><span>{formatDateTime(item.created_at)}</span></div></div>)}</div>}</section>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
