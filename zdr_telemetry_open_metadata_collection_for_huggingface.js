// ZDR TELEMETRY — Open metadata collection for HuggingFace
    //
    // Tracks race outcomes, model performance, and pipeline config.
    // NEVER tracks: message content, API keys, IP addresses, PII.
    // Events batch in memory and flush to /api/telemetry (CF Function)
    // which commits them as JSONL to a public HF Dataset repo.