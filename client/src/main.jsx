import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  BookOpen,
  Database,
  Download,
  ExternalLink,
  MousePointerClick,
  RefreshCw,
  Route,
  Trash2
} from 'lucide-react';
import './styles.css';

const api = {
  sessions: () => fetchJson(apiUrl('/api/sessions')),
  pages: () => fetchJson(apiUrl('/api/pages')),
  sessionEvents: (sessionId) => fetchJson(apiUrl(`/api/sessions/${encodeURIComponent(sessionId)}/events`)),
  heatmap: (pageUrl) => fetchJson(apiUrl(`/api/heatmap?pageUrl=${encodeURIComponent(pageUrl)}`)),
  clear: () => fetchJson(apiUrl('/api/events'), { method: 'DELETE' })
};

const apiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '');

function apiUrl(path) {
  return `${apiBaseUrl}${path}`;
}

function demoUrl() {
  if (!apiBaseUrl) return '/demo.html';
  return `/demo.html?api=${encodeURIComponent(apiBaseUrl)}`;
}

function normalizeApiBaseUrl(value) {
  const trimmed = value.trim().replace(/\/$/, '');
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function App() {
  const [sessions, setSessions] = useState([]);
  const [pages, setPages] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [events, setEvents] = useState([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [clicks, setClicks] = useState([]);
  const [activeView, setActiveView] = useState('sessions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    try {
      setLoading(true);
      setError('');
      const [nextSessions, nextPages] = await Promise.all([api.sessions(), api.pages()]);
      setSessions(nextSessions);
      setPages(nextPages);

      const sessionId = selectedSession || nextSessions[0]?.sessionId || '';
      const pageUrl = selectedPage || nextPages.find((page) => page.clicks > 0)?.pageUrl || nextPages[0]?.pageUrl || '';
      setSelectedSession(sessionId);
      setSelectedPage(pageUrl);
    } catch (err) {
      setError('Could not load analytics data. Make sure the API and MongoDB are running.');
    } finally {
      setLoading(false);
    }
  }

  async function clearAnalytics() {
    if (!window.confirm('Clear all stored analytics events?')) return;

    try {
      setLoading(true);
      setError('');
      await api.clear();
      setSessions([]);
      setPages([]);
      setSelectedSession('');
      setEvents([]);
      setSelectedPage('');
      setClicks([]);
    } catch (_err) {
      setError('Could not clear analytics data. Make sure the API and MongoDB are running.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!selectedSession) return setEvents([]);
    api.sessionEvents(selectedSession).then(setEvents).catch(() => setEvents([]));
  }, [selectedSession]);

  useEffect(() => {
    if (!selectedPage) return setClicks([]);
    api.heatmap(selectedPage).then(setClicks).catch(() => setClicks([]));
  }, [selectedPage]);

  const totals = useMemo(
    () => ({
      sessions: sessions.length,
      events: sessions.reduce((sum, session) => sum + session.eventCount, 0),
      clicks: sessions.reduce((sum, session) => sum + session.clicks, 0)
    }),
    [sessions]
  );

  return (
    <main className="app-shell">
      <video
        className="background-video"
        autoPlay
        muted
        loop
        playsInline
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4"
      />
      <aside className="sidebar liquid-glass-strong">
        <nav className="sidebar-nav">
          <div className="brand-mark">
            <div className="logo-bloom">cf</div>
            <div>
              <span>CausalFunnel</span>
              <small>User Analytics</small>
            </div>
          </div>
          <button className={`nav-item ${activeView === 'sessions' ? 'active' : ''}`} onClick={() => setActiveView('sessions')}>
            <Activity size={18} />
            <span>Sessions</span>
          </button>
          <button className={`nav-item ${activeView === 'heatmap' ? 'active' : ''}`} onClick={() => setActiveView('heatmap')}>
            <MousePointerClick size={18} />
            <span>Heatmap</span>
          </button>
          <a className="nav-item" href={demoUrl()} target="_blank" rel="noreferrer">
            <ExternalLink size={18} />
            <span>Demo page</span>
          </a>
        </nav>

        <div className="sidebar-card liquid-glass">
          <Database size={18} />
          <div>
            <strong>MongoDB</strong>
            <span>Event store</span>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="app-header">
          <div>
            <span className="eyebrow">Assignment dashboard</span>
            <h1>User behavior analytics</h1>
            <p>Monitor page views, clicks, session journeys, and heatmap data from the tracking script.</p>
          </div>
          <div className="header-actions">
            <a className="action-button liquid-glass" href="/tracker.js" target="_blank" rel="noreferrer">
              <Download size={16} />
              Tracker
            </a>
            <a className="action-button liquid-glass" href={demoUrl()} target="_blank" rel="noreferrer">
              <ExternalLink size={16} />
              Demo
            </a>
            <button className="action-button liquid-glass-strong" onClick={refresh}>
              <RefreshCw size={16} />
              Refresh
            </button>
            <button className="action-button liquid-glass" onClick={clearAnalytics}>
              <Trash2 size={16} />
              Clear
            </button>
          </div>
        </header>

        <div className="metric-grid">
          <Metric title="Sessions" value={totals.sessions} icon={<Route size={18} />} />
          <Metric title="Events" value={totals.events} icon={<BookOpen size={18} />} />
          <Metric title="Clicks" value={totals.clicks} icon={<MousePointerClick size={18} />} />
        </div>

        <DashboardPanel
          activeView={activeView}
          setActiveView={setActiveView}
          sessions={sessions}
          selectedSession={selectedSession}
          setSelectedSession={setSelectedSession}
          events={events}
          pages={pages}
          selectedPage={selectedPage}
          setSelectedPage={setSelectedPage}
          clicks={clicks}
          totals={totals}
          loading={loading}
          error={error}
        />
      </section>
    </main>
  );
}

function DashboardPanel(props) {
  return (
    <section className="dashboard liquid-glass-strong">
      <div className="dashboard-heading">
        <div>
          <span>{props.activeView === 'sessions' ? 'Sessions view' : 'Heatmap view'}</span>
          <h2>{props.activeView === 'sessions' ? 'User journey' : 'Click distribution'}</h2>
        </div>
        <div className="tabs liquid-glass">
          <button className={props.activeView === 'sessions' ? 'active' : ''} onClick={() => props.setActiveView('sessions')}>
            Sessions
          </button>
          <button className={props.activeView === 'heatmap' ? 'active' : ''} onClick={() => props.setActiveView('heatmap')}>
            Heatmap
          </button>
        </div>
      </div>

      {props.error && <p className="status-text">{props.error}</p>}
      {props.loading && <p className="status-text">Loading analytics...</p>}
      {!props.loading && props.activeView === 'sessions' && <SessionsView {...props} />}
      {!props.loading && props.activeView === 'heatmap' && <HeatmapView {...props} />}
    </section>
  );
}

function Metric({ title, value, icon }) {
  return (
    <div className="metric liquid-glass">
      <span className="icon-container">{icon}</span>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function SessionsView({ sessions, selectedSession, setSelectedSession, events }) {
  return (
    <div className="work-grid">
      <div className="session-list">
        {sessions.length === 0 && <EmptyState text="Open the demo page and click around to create a session." />}
        {sessions.map((session) => (
          <button
            key={session.sessionId}
            className={`session-row liquid-glass ${session.sessionId === selectedSession ? 'selected' : ''}`}
            onClick={() => setSelectedSession(session.sessionId)}
          >
            <span>{session.sessionId.slice(0, 14)}...</span>
            <strong>{session.eventCount} events</strong>
            <small>{session.pageViews} page views / {session.clicks} clicks</small>
          </button>
        ))}
      </div>
      <div className="timeline liquid-glass">
        <div className="section-heading">
          <h2>User journey</h2>
          <span>{events.length} events</span>
        </div>
        {events.length === 0 && <EmptyState text="Select a session to inspect its ordered event trail." />}
        {events.map((event, index) => (
          <article className="event-row" key={event.id}>
            <span className="event-index">{index + 1}</span>
            <div>
              <strong>{event.type.replace('_', ' ')}</strong>
              <p>{compactUrl(event.pageUrl)}</p>
              <small>
                {new Date(event.timestamp).toLocaleString()}
                {event.click ? ` - x:${Math.round(event.click.x)}, y:${Math.round(event.click.y)}` : ''}
              </small>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function HeatmapView({ pages, selectedPage, setSelectedPage, clicks }) {
  return (
    <div className="heatmap-view">
      <label className="select-label">
        Page URL
        <select value={selectedPage} onChange={(event) => setSelectedPage(event.target.value)}>
          {pages.map((page) => (
            <option key={page.pageUrl} value={page.pageUrl}>
              {page.pageUrl} ({page.clicks} clicks)
            </option>
          ))}
        </select>
      </label>
      <div className="heatmap liquid-glass">
        {clicks.length === 0 && <EmptyState text="No click points for this page yet." />}
        {clicks.map((click) => (
          <span
            className="heat-dot"
            key={click.id}
            title={`${Math.round(click.click.x)}, ${Math.round(click.click.y)}`}
            style={{
              left: `${toPercent(click.click.x, click.viewport?.width)}%`,
              top: `${toPercent(click.click.y, click.viewport?.height)}%`
            }}
          />
        ))}
      </div>
      <a className="demo-link" href={demoUrl()} target="_blank" rel="noreferrer">
        Generate more clicks <ExternalLink size={14} />
      </a>
    </div>
  );
}

function EmptyState({ text }) {
  return <p className="empty-state">{text}</p>;
}

function compactUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}` || parsed.href;
  } catch (_error) {
    return url;
  }
}

function toPercent(value, max = 1) {
  if (!max || max <= 0) return 50;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

createRoot(document.getElementById('root')).render(<App />);
