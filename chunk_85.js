if (qLen < 60) {
        // Greetings
        if (/^(?:hi|hello|hey|howdy|greetings|yo|sup|what's up|hiya|heya|good (?:morning|afternoon|evening|night))/i.test(q)) {
          signals.push('greeting');
          return QUERY_TYPES.CONVERSATION;
        }
        // Thanks
        if (/^(?:thanks|thank you|thx|ty|appreciate|cheers|grateful)/i.test(q)) {
          signals.push('thanks');
          return QUERY_TYPES.CONVERSATION;
        }
        // Affirmations/Reactions
        if (/^(?:ok|okay|sure|yes|no|yeah|yep|nope|cool|nice|great|awesome|wow|haha|lol|lmao|interesting|got it|i see|makes sense|right)/i.test(q)) {
          signals.push('reaction');
          return QUERY_TYPES.CONVERSATION;
        }
        // Farewells
        if (/^(?:bye|goodbye|see you|later|cya|gtg|gotta go|take care|goodnight)/i.test(q)) {
          signals.push('farewell');
          return QUERY_TYPES.CONVERSATION;
        }
      }