import { Router } from 'express';
import Event from '../models/Event.js';

const router = Router();
const allowedTypes = new Set(['page_view', 'click']);

function normalizeEvent(body, userAgent) {
  const sessionId = String(body.session_id || body.sessionId || '').trim();
  const type = String(body.type || '').trim();
  const pageUrl = String(body.page_url || body.pageUrl || '').trim();
  const timestamp = body.timestamp ? new Date(body.timestamp) : new Date();

  if (!sessionId) throw new Error('session_id is required');
  if (!allowedTypes.has(type)) throw new Error('type must be page_view or click');
  if (!pageUrl) throw new Error('page_url is required');
  if (Number.isNaN(timestamp.getTime())) throw new Error('timestamp must be a valid date');

  const event = {
    sessionId,
    type,
    pageUrl,
    timestamp,
    viewport: body.viewport,
    userAgent
  };

  if (type === 'click') {
    const x = Number(body.x ?? body.click?.x);
    const y = Number(body.y ?? body.click?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error('click events require numeric x and y coordinates');
    }
    event.click = { x, y };
  }

  return event;
}

router.post('/events', async (req, res) => {
  try {
    const event = normalizeEvent(req.body, req.get('user-agent'));
    const saved = await Event.create(event);
    res.status(201).json({ id: saved._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/events', async (_req, res) => {
  const result = await Event.deleteMany({});
  res.json({ deletedCount: result.deletedCount });
});

router.get('/sessions', async (_req, res) => {
  const sessions = await Event.aggregate([
    {
      $group: {
        _id: '$sessionId',
        eventCount: { $sum: 1 },
        pageViews: { $sum: { $cond: [{ $eq: ['$type', 'page_view'] }, 1, 0] } },
        clicks: { $sum: { $cond: [{ $eq: ['$type', 'click'] }, 1, 0] } },
        firstSeen: { $min: '$timestamp' },
        lastSeen: { $max: '$timestamp' },
        pages: { $addToSet: '$pageUrl' }
      }
    },
    { $sort: { lastSeen: -1 } }
  ]);

  res.json(
    sessions.map((session) => ({
      sessionId: session._id,
      eventCount: session.eventCount,
      pageViews: session.pageViews,
      clicks: session.clicks,
      firstSeen: session.firstSeen,
      lastSeen: session.lastSeen,
      pages: session.pages
    }))
  );
});

router.get('/sessions/:sessionId/events', async (req, res) => {
  const events = await Event.find({ sessionId: req.params.sessionId })
    .sort({ timestamp: 1 })
    .lean();

  res.json(events.map(toClientEvent));
});

router.get('/pages', async (_req, res) => {
  const pages = await Event.aggregate([
    {
      $group: {
        _id: '$pageUrl',
        eventCount: { $sum: 1 },
        clicks: { $sum: { $cond: [{ $eq: ['$type', 'click'] }, 1, 0] } }
      }
    },
    { $sort: { clicks: -1, eventCount: -1 } }
  ]);

  res.json(pages.map((page) => ({ pageUrl: page._id, eventCount: page.eventCount, clicks: page.clicks })));
});

router.get('/heatmap', async (req, res) => {
  const pageUrl = String(req.query.pageUrl || '').trim();
  if (!pageUrl) return res.status(400).json({ error: 'pageUrl query parameter is required' });

  const clicks = await Event.find({ pageUrl, type: 'click' })
    .select('sessionId pageUrl timestamp click viewport')
    .sort({ timestamp: -1 })
    .lean();

  res.json(clicks.map(toClientEvent));
});

function toClientEvent(event) {
  return {
    id: event._id,
    sessionId: event.sessionId,
    type: event.type,
    pageUrl: event.pageUrl,
    timestamp: event.timestamp,
    click: event.click,
    viewport: event.viewport
  };
}

export default router;
