(function () {
  const config = window.CF_ANALYTICS || {};
  const script = document.currentScript;
  const scriptOrigin = script && script.src ? new URL(script.src, window.location.href).origin : window.location.origin;
  const endpoint = config.endpoint || `${normalizeApiBaseUrl(config.apiBaseUrl || scriptOrigin)}/api/events`;
  const storageKey = 'cf_session_id';

  function normalizeApiBaseUrl(value) {
    const trimmed = String(value || '').trim().replace(/\/$/, '');
    return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed;
  }

  function getSessionId() {
    try {
      const existing = window.localStorage.getItem(storageKey);
      if (existing) return existing;

      const next =
        (window.crypto && window.crypto.randomUUID && window.crypto.randomUUID()) ||
        `cf_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      window.localStorage.setItem(storageKey, next);
      return next;
    } catch (_error) {
      return `cf_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
  }

  function send(event) {
    const payload = {
      session_id: getSessionId(),
      type: event.type,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      x: event.x,
      y: event.y
    };

    const body = JSON.stringify(payload);

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    }).catch(() => {
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
      }
    });
  }

  send({ type: 'page_view' });

  document.addEventListener(
    'click',
    function (event) {
      send({ type: 'click', x: event.clientX, y: event.clientY });
    },
    { capture: true }
  );
})();
