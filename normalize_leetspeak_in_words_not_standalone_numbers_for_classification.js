// Normalize leetspeak in words (not standalone numbers) for classification.
    // "h4ck" → "hack", "b0mb" → "bomb", but "top 5" stays "top 5".
    function normalizeLeet(str) {
      return str
        .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')  // strip combining diacritics
        .replace(/\$/g, 's').replace(/@/g, 'a')
        // Only replace digits when adjacent to letters (inside words)
        .replace(/(?<=[a-z])4(?=[a-z])/gi, 'a')
        .replace(/(?<=[a-z])3(?=[a-z])/gi, 'e')
        .replace(/(?<=[a-z])1(?=[a-z])/gi, 'i')
        .replace(/(?<=[a-z])0(?=[a-z])/gi, 'o')
        .replace(/(?<=[a-z])5(?=[a-z])/gi, 's')
        .replace(/(?<=[a-z])7(?=[a-z])/gi, 't');
    }

    function classifyQueryType(query) {
      const q = normalizeLeet(query.toLowerCase().trim());
      const qLen = q.length;

      // Track classification signals for debugging/confidence
      const signals = [];

      // Helper: check pattern and add signal if matched
      const check = (pattern, type, signal) => {
        if (pattern.test(q)) {
          signals.push(signal);
          return type;
        }
        return null;
      };