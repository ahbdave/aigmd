// Naming
      if (/\b(?:name|names|naming|title|titles|what (?:should i|to) (?:call|name)|ideas? for (?:a )?(?:name|title)|brand name|company name|project name|baby name)\b/i.test(q)) {
        signals.push('naming-request');
        return QUERY_TYPES.NAMING;
      }

      // Brainstorming
      if (/\b(?:ideas?|brainstorm|suggest(?:ion)?s?|options|alternatives|possibilities|ways to|list (?:of|some)|give me (?:some|ideas)|come up with|think of|creative ideas)\b/i.test(q)) {
        signals.push('brainstorming-request');
        return QUERY_TYPES.BRAINSTORMING;
      }