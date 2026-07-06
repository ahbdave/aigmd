// Pros and cons (specific)
      if (/\b(?:pros (?:and|&) cons|advantages (?:and|&) disadvantages|upsides? (?:and|&) downsides?|benefits (?:and|&) drawbacks)\b/i.test(q)) {
        signals.push('pros-cons-request');
        return QUERY_TYPES.PROS_CONS;
      }

      // Review/Critique
      if (/\b(?:review|critique|evaluate|assess|analyze|feedback on|thoughts on|opinion on)\b.*\b(?:my|this|the)\b/i.test(q) &&
          !/\b(?:code|script|program)\b/i.test(q)) {
        signals.push('review-request');
        return QUERY_TYPES.REVIEW;
      }

      // Comparison
      if (/\b(?:compare|comparison|versus|vs\.?|difference(?:s)? between|better|worse|which is (?:better|best|faster|cheaper)|or\b.*\bwhich)\b/i.test(q)) {
        signals.push('comparison-request');
        return QUERY_TYPES.COMPARISON;
      }