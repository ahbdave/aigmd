// Definition
      if (/^(?:what is|what's|what are|define|definition of|meaning of)\b/i.test(q) && qLen < 100) {
        signals.push('definition-question');
        return QUERY_TYPES.DEFINITION;
      }

      // Explanation
      if (/\b(?:explain|explanation|how does|how do|walk me through|help me understand|break down|eli5|explain like i'm)\b/i.test(q)) {
        signals.push('explanation-question');
        return QUERY_TYPES.EXPLANATION;
      }

      // Analytical (why questions)
      if (/^why\b/i.test(q) || /\b(?:analyze|analysis|reason|cause|because|root cause|understand why)\b/i.test(q)) {
        signals.push('analytical-question');
        return QUERY_TYPES.ANALYTICAL;
      }

      // Historical
      if (/\b(?:history|historical|what happened|when did|in (?:the )?(?:\d{4}|\d{2}th century)|during (?:the )?(?:war|revolution|era)|ancient|medieval|timeline of)\b/i.test(q)) {
        signals.push('historical-question');
        return QUERY_TYPES.HISTORICAL;
      }

      // Research
      if (/\b(?:research|studies|study|evidence|data|findings|according to|source|scientific consensus|what does research say)\b/i.test(q)) {
        signals.push('research-question');
        return QUERY_TYPES.RESEARCH;
      }

      // Factual (catch-all for question words)
      if (/^(?:what|who|when|where|which|how many|how much|how long|how old|how far|is there|are there|does|do|is|are|can|could|will|would|has|have|did)\b/i.test(q)) {
        signals.push('factual-question');
        return QUERY_TYPES.FACTUAL;
      }