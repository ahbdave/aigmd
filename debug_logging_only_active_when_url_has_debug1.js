// Debug logging — only active when URL has ?debug=1
    const G0D_DEBUG = new URLSearchParams(window.location.search).has('debug');
    const _log = G0D_DEBUG ? console.log.bind(console) : () => {};
    const _warn = G0D_DEBUG ? console.warn.bind(console) : () => {};

    // State
    let state = {
      apiKey: '',
      orOAuthConnected: false,
      model: 'anthropic/claude-opus-4.6',
      persona: 'godmode',
      customSystemPrompt: '',
      customSystemPromptEnabled: false,
      conversations: [],
      currentId: null,
      noLogMode: true,
      sidebarOpen: true,
      autoRetry: true,
      parseltongue: true,
      parseltongueTier: 'standard',
      maxRetries: 5,
      ultraplinian: true,  // ULTRAPLINIAN: Query ALL models, LLM picks best (DEFAULT for new users)
      ultraSpeedTier: 'standard',  // Speed tier: 'fast' (10), 'standard' (24), 'smart' (38), 'power' (49), 'ultra' (55)
      ultraEarlyThreshold: 75,  // Score threshold for early stopping (0 = disabled, higher = faster but pickier)
      ultraImproveMode: true,   // Coaching Pass: AI coach analyzes winner and demands specific enhancements
      liquidMode: true,         // Liquid Response: continuously refine response in background until peak quality (DEFAULT ON)
      liquidMinDelta: 8,        // Minimum quality improvement % to morph the response
      liquidMaxIterations: 4,   // Maximum refinement iterations before stopping
      liquidTargetScore: 85,    // Target quality score (0-100) - crystallize when reached
      plinyMode: false,  // L1B3RT4S MODE: Use jailbreak templates with query injection
      libertasDisabledCombos: [],  // Array of Hall of Fame combo IDs toggled OFF
      libertasSelectedCombo: 'all',  // 'all' = race all enabled combos, or a specific combo ID
      showMagic: false,  // Show Magic: Reveal backend processing (thinking steps, retries, etc.)
      waitingGame: 'snake',  // Game while waiting: 'snake', 'pong', or 'none'
      strategyLogs: [],  // Stores all parallel attempt logs
      backendUrl: '',  // G0DM0D3 API backend URL
      generatedApiKeys: [],  // User-generated API keys for backend
      // Universal model parameters
      modelTemperature: 0.7,
      modelTopP: 1.0,
      modelMaxTokens: 4096,
      modelFreqPenalty: 0,
      modelPresPenalty: 0,
      // AutoTune - intelligent parameter optimization
      autoTuneEnabled: false,
      autoTuneStrategy: 'adaptive',  // 'adaptive', 'precise', 'balanced', 'creative', 'chaotic'
      autoTuneLastContext: null,     // Last detected context type
      autoTuneLastParams: null,      // Last computed parameters
      // Universal counters
      promptsTried: 0               // Total prompts sent across all sessions
    };

    let isStreaming = false;
    let abortController = null;