// Troubleshooting (non-code)
      if (/\b(?:not working|doesn't work|won't (?:work|start|open|run)|broken|issue|problem|trouble|help|stuck|can't (?:get|figure|seem))\b/i.test(q) &&
          !/\b(?:code|script|program|function|python|javascript|java)\b/i.test(q)) {
        signals.push('troubleshooting-request');
        return QUERY_TYPES.TROUBLESHOOTING;
      }

      // Logic puzzles
      if (/\b(?:puzzle|riddle|brain teaser|logic (?:problem|puzzle)|solve this|figure out)\b/i.test(q)) {
        signals.push('logic-request');
        return QUERY_TYPES.LOGIC;
      }

      // Strategy
      if (/\b(?:strategy|strategic|tactics|game plan|approach|best (?:strategy|approach|way to win)|how (?:to|do i) (?:win|beat|succeed))\b/i.test(q)) {
        signals.push('strategy-request');
        return QUERY_TYPES.STRATEGY;
      }