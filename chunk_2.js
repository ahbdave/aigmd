const _telemetry = {
      buffer: [],
      MAX_BUFFER: 50,
      FLUSH_INTERVAL_MS: 300000, // 5 min
      sessionId: crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join(''),
      timer: null,
      flushing: false,
    };

    function trackEvent(type, data) {
      const event = {
        type,
        timestamp: Date.now(),
        session_id: _telemetry.sessionId,
        ...data,
      };

      // Defense in depth: never include anything that looks like a key
      delete event.api_key;
      delete event.apiKey;
      delete event.token;

      _telemetry.buffer.push(event);

      // Auto-flush when buffer is full
      if (_telemetry.buffer.length >= _telemetry.MAX_BUFFER) {
        flushTelemetry();
      }
    }

    async function flushTelemetry() {
      if (_telemetry.flushing || _telemetry.buffer.length === 0) return;
      _telemetry.flushing = true;

      const events = _telemetry.buffer.splice(0);

      try {
        const res = await fetch('/api/telemetry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'G0DM0D3' },
          body: JSON.stringify({ events }),
        });

        if (!res.ok) {
          // Put events back if flush failed
          _telemetry.buffer.unshift(...events);
          console.warn('[ZDR] Telemetry flush failed:', res.status);
        } else {
          const result = await res.json().catch(() => ({}));
          console.log(`[ZDR] Flushed ${result.accepted || events.length} events → ${result.file || 'HF'}`);
        }
      } catch (err) {
        // Put events back on network error
        _telemetry.buffer.unshift(...events);
        console.warn('[ZDR] Telemetry network error:', err.message);
      } finally {
        _telemetry.flushing = false;
      }
    }

    // Periodic flush + flush on page unload
    _telemetry.timer = setInterval(flushTelemetry, _telemetry.FLUSH_INTERVAL_MS);
    window.addEventListener('beforeunload', () => {
      // Flush any pending debounced state write
      if (_saveStatePending) saveStateNow();
      if (_telemetry.buffer.length > 0) {
        // Use sendBeacon for reliable delivery on page close
        const payload = JSON.stringify({ events: _telemetry.buffer });
        navigator.sendBeacon('/api/telemetry', new Blob([payload], { type: 'application/json' }));
      }
    });