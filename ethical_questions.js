// Ethical questions
      if (/\b(?:ethical|ethics|moral|morality|right or wrong|should (?:we|society|people)|is it (?:wrong|right|ethical|moral)|dilemma)\b/i.test(q)) {
        signals.push('ethical-question');
        return QUERY_TYPES.ETHICAL;
      }

      // Philosophical
      if (/\b(?:philosophical|philosophy|meaning of life|consciousness|free will|existence|reality|truth|knowledge|what is the purpose|why do we exist|nature of|thought experiment)\b/i.test(q)) {
        signals.push('philosophical-question');
        return QUERY_TYPES.PHILOSOPHICAL;
      }

      // Debate
      if (/\b(?:debate|argue|argument|defend|make a case|persuade|convince|devil's advocate|both sides)\b/i.test(q)) {
        signals.push('debate-request');
        return QUERY_TYPES.DEBATE;
      }

      // Opinion (general)
      if (/\b(?:(?:what do you|what's your) (?:think|opinion|view|take|thought)|do you (?:think|believe|feel)|your (?:opinion|view|perspective|thoughts?)|how do you feel about)\b/i.test(q)) {
        signals.push('opinion-request');
        return QUERY_TYPES.OPINION;
      }