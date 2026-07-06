// Expanded query type definitions (30+ categories)
    const QUERY_TYPES = {
      // === INFORMATION SEEKING ===
      FACTUAL: 'factual',             // "What is X?" - Simple facts
      DEFINITION: 'definition',        // "Define X" - Dictionary/glossary style
      EXPLANATION: 'explanation',      // "Explain how X works" - Educational
      ANALYTICAL: 'analytical',        // "Why does X happen?" - Cause/effect
      RESEARCH: 'research',            // "What do studies say about X?" - Deep dive
      HISTORICAL: 'historical',        // "What happened in X?" - Past events
      TRIVIA: 'trivia',               // Fun facts, quiz questions
      CURRENT_EVENTS: 'current_events', // News, recent happenings

      // === CREATION & WRITING ===
      CREATIVE: 'creative',            // "Write a story about..." - Fiction/poetry
      COPYWRITING: 'copywriting',      // "Write ad copy for..." - Marketing
      TECHNICAL_WRITING: 'tech_writing', // "Write documentation for..." - Docs
      EMAIL: 'email',                  // "Write an email to..." - Correspondence
      ESSAY: 'essay',                  // "Write an essay about..." - Academic
      SOCIAL_MEDIA: 'social_media',    // Tweets, posts, captions
      SPEECH: 'speech',                // Speeches, presentations, toasts

      // === CODE & TECHNICAL ===
      CODE: 'code',                    // Programming tasks
      CODE_REVIEW: 'code_review',      // "Review this code..." - Analysis
      CODE_DEBUG: 'code_debug',        // "Fix this bug..." - Debugging
      CODE_EXPLAIN: 'code_explain',    // "Explain this code..." - Understanding
      CODE_CONVERT: 'code_convert',    // Convert between languages
      ARCHITECTURE: 'architecture',    // System design questions
      DEVOPS: 'devops',               // Deployment, CI/CD, infrastructure
      DATABASE: 'database',           // SQL, schema design, queries
      SECURITY: 'security',           // Cybersecurity, pentesting, vulnerabilities
      DATA_SCIENCE: 'data_science',   // ML, AI, data analysis, statistics

      // === PROBLEM SOLVING ===
      TROUBLESHOOTING: 'troubleshoot', // "Why isn't X working?" - Fix issues
      MATH: 'math',                    // Calculations, equations, proofs
      LOGIC: 'logic',                  // Puzzles, riddles, logical problems
      STRATEGY: 'strategy',            // Game theory, planning, tactics
      OPTIMIZATION: 'optimization',    // Making things better/faster/cheaper

      // === GUIDANCE & ADVICE ===
      INSTRUCTION: 'instruction',      // "How do I do X?" - Step-by-step
      RECOMMENDATION: 'recommendation', // "What should I use for X?" - Suggestions
      DECISION: 'decision',            // "Should I do X or Y?" - Help choosing
      PLANNING: 'planning',            // "Help me plan X" - Project planning
      CAREER: 'career',                // Job, resume, interview advice
      RELATIONSHIP: 'relationship',    // Dating, friendship, family advice
      PARENTING: 'parenting',         // Child-rearing, family dynamics
      EDUCATION: 'education',         // Learning, studying, academics

      // === COMPARISON & EVALUATION ===
      COMPARISON: 'comparison',        // "Compare X and Y" - Side-by-side
      REVIEW: 'review',                // "Review X" - Critique/analysis
      PROS_CONS: 'pros_cons',          // "Pros and cons of X" - Trade-offs
      RANKING: 'ranking',             // "Top 10...", "Best...", ordered lists

      // === IDEATION ===
      BRAINSTORMING: 'brainstorm',     // "Give me ideas for..." - Generate options
      NAMING: 'naming',                // "Name ideas for..." - Titles, brands

      // === TRANSFORMATION ===
      SUMMARIZATION: 'summarization',  // "Summarize X" - Condense content
      TRANSLATION: 'translation',      // "Translate X to Y" - Language conversion
      REWRITING: 'rewriting',          // "Rewrite X as..." - Style change
      FORMATTING: 'formatting',        // "Format X as..." - Structure change
      EXTRACTION: 'extraction',        // "Extract X from..." - Pull out data
      PROOFREADING: 'proofreading',   // Grammar, spelling, style fixes

      // === INTERACTIVE ===
      CONVERSATION: 'conversation',    // General chat
      ROLEPLAY: 'roleplay',            // In-character responses
      DEBATE: 'debate',                // "Argue for/against X" - Persuasion
      INTERVIEW: 'interview',          // Mock interviews, Q&A
      GAME: 'game',                    // Playing games, trivia, quizzes
      SIMULATION: 'simulation',        // Scenarios, what-if, hypotheticals

      // === OPINION & PERSPECTIVE ===
      OPINION: 'opinion',              // "What do you think about..."
      ETHICAL: 'ethical',              // Moral dilemmas, ethics questions
      PHILOSOPHICAL: 'philosophical',  // Deep questions, thought experiments
      POLITICAL: 'political',         // Politics, policy, governance
      RELIGIOUS: 'religious',         // Faith, spirituality, theology

      // === SPECIALIZED DOMAINS ===
      LEGAL: 'legal',                  // Law-related questions
      MEDICAL: 'medical',              // Health-related questions
      FINANCIAL: 'financial',          // Money, investing, taxes
      SCIENTIFIC: 'scientific',        // Science, experiments, research
      COOKING: 'cooking',             // Recipes, food prep, ingredients
      DIY: 'diy',                     // Home improvement, crafts, making
      AUTOMOTIVE: 'automotive',       // Cars, mechanics, driving
      GAMING: 'gaming',               // Video games, board games, strategies
      MUSIC: 'music',                 // Songs, instruments, theory
      ART: 'art',                     // Visual arts, design, aesthetics
      SPORTS: 'sports',               // Athletics, fitness, teams
      TRAVEL: 'travel',               // Destinations, planning, tips
      PETS: 'pets',                   // Animal care, training, health
      GARDENING: 'gardening',         // Plants, landscaping, growing
      FASHION: 'fashion',             // Clothing, style, trends

      // === META & EDGE CASES ===
      META_AI: 'meta_ai',              // Questions about AI itself
      JAILBREAK: 'jailbreak',         // Attempts to bypass restrictions
      CONTINUATION: 'continuation',    // Follow-up to previous response
      CLARIFICATION: 'clarification',  // "What do you mean by X?"
      CORRECTION: 'correction',        // "Actually, X is wrong..."
      SENSITIVE: 'sensitive',          // Potentially restricted topics
      NSFW: 'nsfw',                    // Adult content requests
      HUMOR: 'humor',                  // Jokes, puns, funny content
      VENTING: 'venting',             // Emotional release, ranting
      EMERGENCY: 'emergency',         // Crisis, urgent help needed
      UNKNOWN: 'unknown'
    };

    // Adaptive weights by query type (what matters most for each)
    // Format: { quality, filteredness, speed }
    const QUERY_TYPE_WEIGHTS = {
      // Information seeking - quality paramount
      factual:        { quality: 0.55, filteredness: 0.25, speed: 0.20 },
      definition:     { quality: 0.50, filteredness: 0.25, speed: 0.25 },
      explanation:    { quality: 0.60, filteredness: 0.25, speed: 0.15 },
      analytical:     { quality: 0.60, filteredness: 0.25, speed: 0.15 },
      research:       { quality: 0.65, filteredness: 0.25, speed: 0.10 },
      historical:     { quality: 0.55, filteredness: 0.25, speed: 0.20 },
      trivia:         { quality: 0.50, filteredness: 0.25, speed: 0.25 },
      current_events: { quality: 0.55, filteredness: 0.30, speed: 0.15 },

      // Creative - filteredness important (don't censor creativity)
      creative:       { quality: 0.50, filteredness: 0.35, speed: 0.15 },
      copywriting:    { quality: 0.50, filteredness: 0.30, speed: 0.20 },
      tech_writing:   { quality: 0.60, filteredness: 0.20, speed: 0.20 },
      email:          { quality: 0.45, filteredness: 0.30, speed: 0.25 },
      essay:          { quality: 0.60, filteredness: 0.25, speed: 0.15 },
      social_media:   { quality: 0.40, filteredness: 0.35, speed: 0.25 },
      speech:         { quality: 0.55, filteredness: 0.30, speed: 0.15 },

      // Code - quality and speed both important
      code:           { quality: 0.60, filteredness: 0.20, speed: 0.20 },
      code_review:    { quality: 0.65, filteredness: 0.20, speed: 0.15 },
      code_debug:     { quality: 0.60, filteredness: 0.20, speed: 0.20 },
      code_explain:   { quality: 0.55, filteredness: 0.25, speed: 0.20 },
      code_convert:   { quality: 0.60, filteredness: 0.15, speed: 0.25 },
      architecture:   { quality: 0.65, filteredness: 0.20, speed: 0.15 },
      devops:         { quality: 0.55, filteredness: 0.25, speed: 0.20 },
      database:       { quality: 0.60, filteredness: 0.20, speed: 0.20 },
      security:       { quality: 0.55, filteredness: 0.35, speed: 0.10 },
      data_science:   { quality: 0.60, filteredness: 0.25, speed: 0.15 },

      // Problem solving - quality paramount
      troubleshoot:   { quality: 0.55, filteredness: 0.25, speed: 0.20 },
      math:           { quality: 0.70, filteredness: 0.15, speed: 0.15 },
      logic:          { quality: 0.65, filteredness: 0.20, speed: 0.15 },
      strategy:       { quality: 0.60, filteredness: 0.25, speed: 0.15 },
      optimization:   { quality: 0.60, filteredness: 0.25, speed: 0.15 },

      // Guidance - balance of all three
      instruction:    { quality: 0.50, filteredness: 0.30, speed: 0.20 },
      recommendation: { quality: 0.50, filteredness: 0.30, speed: 0.20 },
      decision:       { quality: 0.50, filteredness: 0.35, speed: 0.15 },
      planning:       { quality: 0.55, filteredness: 0.30, speed: 0.15 },
      career:         { quality: 0.50, filteredness: 0.35, speed: 0.15 },
      relationship:   { quality: 0.45, filteredness: 0.40, speed: 0.15 },
      parenting:      { quality: 0.50, filteredness: 0.35, speed: 0.15 },
      education:      { quality: 0.55, filteredness: 0.30, speed: 0.15 },

      // Comparison - quality important
      comparison:     { quality: 0.55, filteredness: 0.25, speed: 0.20 },
      review:         { quality: 0.55, filteredness: 0.30, speed: 0.15 },
      pros_cons:      { quality: 0.55, filteredness: 0.30, speed: 0.15 },
      ranking:        { quality: 0.50, filteredness: 0.30, speed: 0.20 },

      // Ideation - filteredness important
      brainstorm:     { quality: 0.45, filteredness: 0.35, speed: 0.20 },
      naming:         { quality: 0.40, filteredness: 0.40, speed: 0.20 },

      // Transformation - quality and speed
      summarization:  { quality: 0.55, filteredness: 0.20, speed: 0.25 },
      translation:    { quality: 0.60, filteredness: 0.15, speed: 0.25 },
      rewriting:      { quality: 0.55, filteredness: 0.25, speed: 0.20 },
      formatting:     { quality: 0.50, filteredness: 0.20, speed: 0.30 },
      extraction:     { quality: 0.55, filteredness: 0.20, speed: 0.25 },
      proofreading:   { quality: 0.55, filteredness: 0.20, speed: 0.25 },

      // Interactive - filteredness very important
      conversation:   { quality: 0.40, filteredness: 0.35, speed: 0.25 },
      roleplay:       { quality: 0.40, filteredness: 0.45, speed: 0.15 },
      debate:         { quality: 0.50, filteredness: 0.35, speed: 0.15 },
      interview:      { quality: 0.50, filteredness: 0.30, speed: 0.20 },
      game:           { quality: 0.45, filteredness: 0.30, speed: 0.25 },
      simulation:     { quality: 0.50, filteredness: 0.35, speed: 0.15 },

      // Opinion - filteredness paramount
      opinion:        { quality: 0.45, filteredness: 0.40, speed: 0.15 },
      ethical:        { quality: 0.50, filteredness: 0.40, speed: 0.10 },
      philosophical:  { quality: 0.55, filteredness: 0.35, speed: 0.10 },
      political:      { quality: 0.50, filteredness: 0.40, speed: 0.10 },
      religious:      { quality: 0.50, filteredness: 0.40, speed: 0.10 },

      // Specialized domains - quality paramount, filteredness varies
      legal:          { quality: 0.55, filteredness: 0.35, speed: 0.10 },
      medical:        { quality: 0.55, filteredness: 0.35, speed: 0.10 },
      financial:      { quality: 0.55, filteredness: 0.35, speed: 0.10 },
      scientific:     { quality: 0.60, filteredness: 0.25, speed: 0.15 },
      cooking:        { quality: 0.50, filteredness: 0.30, speed: 0.20 },
      diy:            { quality: 0.50, filteredness: 0.30, speed: 0.20 },
      automotive:     { quality: 0.55, filteredness: 0.25, speed: 0.20 },
      gaming:         { quality: 0.50, filteredness: 0.30, speed: 0.20 },
      music:          { quality: 0.50, filteredness: 0.30, speed: 0.20 },
      art:            { quality: 0.50, filteredness: 0.35, speed: 0.15 },
      sports:         { quality: 0.50, filteredness: 0.25, speed: 0.25 },
      travel:         { quality: 0.50, filteredness: 0.30, speed: 0.20 },
      pets:           { quality: 0.50, filteredness: 0.30, speed: 0.20 },
      gardening:      { quality: 0.50, filteredness: 0.25, speed: 0.25 },
      fashion:        { quality: 0.45, filteredness: 0.35, speed: 0.20 },

      // Meta & Edge cases
      meta_ai:        { quality: 0.45, filteredness: 0.40, speed: 0.15 },
      jailbreak:      { quality: 0.30, filteredness: 0.55, speed: 0.15 },
      continuation:   { quality: 0.50, filteredness: 0.30, speed: 0.20 },
      clarification:  { quality: 0.50, filteredness: 0.25, speed: 0.25 },
      correction:     { quality: 0.55, filteredness: 0.30, speed: 0.15 },
      sensitive:      { quality: 0.45, filteredness: 0.45, speed: 0.10 },
      nsfw:           { quality: 0.40, filteredness: 0.50, speed: 0.10 },
      humor:          { quality: 0.40, filteredness: 0.40, speed: 0.20 },
      venting:        { quality: 0.40, filteredness: 0.40, speed: 0.20 },
      emergency:      { quality: 0.55, filteredness: 0.30, speed: 0.15 },
      unknown:        { quality: 0.50, filteredness: 0.30, speed: 0.20 }
    };