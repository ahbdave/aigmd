// Planning
      if (/\b(?:plan|planning|schedule|timeline|roadmap|project plan|action plan|help me plan|create a plan)\b/i.test(q)) {
        signals.push('planning-request');
        return QUERY_TYPES.PLANNING;
      }

      // Career advice
      if (/\b(?:resume|cv|cover letter|job (?:interview|application|search)|career|salary|negotiate|linkedin|portfolio|hire|hiring|recruiter)\b/i.test(q)) {
        signals.push('career-request');
        return QUERY_TYPES.CAREER;
      }

      // Decision making
      if (/\b(?:should i|would you|which (?:one|should)|help me (?:decide|choose)|torn between|can't decide|decision|what would you do)\b/i.test(q)) {
        signals.push('decision-request');
        return QUERY_TYPES.DECISION;
      }

      // Recommendations
      if (/\b(?:recommend|suggestion|suggest|what (?:should i|do you suggest)|best (?:way|option|choice|tool|app|book|movie)|any (?:good|recommendations))\b/i.test(q)) {
        signals.push('recommendation-request');
        return QUERY_TYPES.RECOMMENDATION;
      }

      // Instructions/How-to
      if (/^how (?:do|can|to|would|should|does one)/i.test(q) ||
          /\b(?:step[- ]by[- ]step|steps to|guide|tutorial|instructions|teach me|show me how|walk me through|how do i|how can i|how to)\b/i.test(q)) {
        signals.push('instruction-request');
        return QUERY_TYPES.INSTRUCTION;
      }