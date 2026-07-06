// AI/Meta questions
      if (/\b(?:are you|can you|do you|what are you|who made you|your (?:name|creator|training|knowledge|capabilities|limitations))\b/i.test(q) ||
          /\b(?:as an ai|language model|chatgpt|claude|gpt|llm|artificial intelligence)\b/i.test(q)) {
        signals.push('meta-ai-question');
        return QUERY_TYPES.META_AI;
      }

      // Continuation/follow-up (short queries referencing previous context)
      // Capped at 60 chars to prevent long substantive queries from getting
      // misclassified as casual continuations (e.g. "continue with detailed
      // step-by-step instructions for...").
      if (qLen < 60 && /^(?:and|also|what about|how about|can you also|now|next|then|continue|go on|more|elaborate|expand|tell me more)/i.test(q)) {
        signals.push('continuation-marker');
        return QUERY_TYPES.CONTINUATION;
      }

      // Clarification requests
      if (/^(?:what do you mean|can you clarify|i don't understand|what does that mean|explain that|huh\??|sorry\??|come again)/i.test(q) ||
          /\bwhat do you mean by\b/i.test(q)) {
        signals.push('clarification-request');
        return QUERY_TYPES.CLARIFICATION;
      }

      // Corrections
      if (/^(?:actually|no,?\s|that's (?:wrong|incorrect|not right)|you're wrong|incorrect|that's not|i meant)/i.test(q)) {
        signals.push('correction-marker');
        return QUERY_TYPES.CORRECTION;
      }