# CausalFunnel User Analytics

A small full-stack analytics app for tracking webpage interactions and reviewing them in a dashboard. It includes a drop-in JavaScript tracker, Node/Express API, MongoDB storage, a demo page, session journey view, and page click heatmap.

## Tech Stack

- Frontend: React, Vite, Lucide React, CSS
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Tracking: Vanilla JavaScript script served from `/tracker.js`

## Features

- Tracks `page_view` and `click` events.
- Persists a `session_id` in `localStorage`.
- Stores page URL, timestamp, event type, viewport size, and click coordinates.
- Lists sessions with total events, page views, and click counts.
- Shows ordered events for a selected session.
- Shows click positions for a selected page as a simple heatmap.
- Includes a demo webpage at `/demo.html`.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Start the full local stack with Docker.

This starts MongoDB, the Node API, and the Vite dashboard:

```bash
docker compose up
```

Or run it in the background:

```bash
docker compose up -d
```

Then open:

- Dashboard: `http://127.0.0.1:5173`
- Demo page: `http://127.0.0.1:5173/demo.html`
- API health: `http://127.0.0.1:4000/api/health`

3. If you prefer not to use Docker, start MongoDB locally.

Default connection:

```bash
mongodb://127.0.0.1:27017/causalfunnel_analytics
```

4. Copy environment variables:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

5. Start the app without Docker:

```bash
npm run dev
```

6. Open:

- Dashboard: `http://127.0.0.1:5173`
- Demo page: `http://127.0.0.1:5173/demo.html`
- API health: `http://127.0.0.1:4000/api/health`

## API Endpoints

### Create Event

`POST /api/events`

```json
{
  "session_id": "session-123",
  "type": "click",
  "page_url": "http://127.0.0.1:5173/demo.html",
  "timestamp": "2026-06-18T12:00:00.000Z",
  "x": 320,
  "y": 240,
  "viewport": {
    "width": 1440,
    "height": 900
  }
}
```

### List Sessions

`GET /api/sessions`

Returns sessions with event counts, click counts, page-view counts, first seen, last seen, and pages visited.

### Session Events

`GET /api/sessions/:sessionId/events`

Returns all events for a session ordered by timestamp.

### Pages

`GET /api/pages`

Returns page URLs with total event and click counts.

### Heatmap Data

`GET /api/heatmap?pageUrl=<encoded-page-url>`

Returns click events for the selected page.

## Adding the Tracker to a Page

```html
<script>
  window.CF_ANALYTICS = {
    endpoint: "http://127.0.0.1:4000/api/events"
  };
</script>
<script defer src="http://127.0.0.1:4000/tracker.js"></script>
```

For the included Vite demo, `/tracker.js` is also available through the frontend dev server.

## Assumptions and Trade-offs

- `localStorage` is used for the session ID because it is simple and reliable for a demo. A production tracker might use cookies with explicit consent controls and expiration.
- Click coordinates are stored as viewport-relative `clientX/clientY` values plus viewport dimensions. The dashboard normalizes them into percentages for a responsive heatmap.
- The API validates core fields but does not implement authentication, bot filtering, rate limiting, or tenant isolation.
- The heatmap is intentionally simple dots/grid rather than a weighted canvas renderer.
- The UI uses the supplied liquid-glass visual direction, but all analytics workflows remain accessible without a separate marketing landing page.

## Build

```bash
npm run build
```

## Render Deployment

If the frontend and backend are deployed as separate Render services, set one of these environment variables on the frontend/static service before building:

```bash
VITE_API_BASE_URL=https://your-backend-service.onrender.com
```

or:

```bash
VITE_API_URL=https://your-backend-service.onrender.com
```

The dashboard uses that URL for `/api/sessions`, `/api/pages`, session events, and heatmap data. The demo page also receives the same backend URL from dashboard links so its tracker posts events to the deployed API instead of `localhost`.

On the backend service, set:

```bash
MONGODB_URI=<your MongoDB Atlas connection string>
PORT=<Render-provided port, usually left unset>
```
