// BONUS: Contains specific numbers/quantities (+25)
      // Matches: percentages, measurements, specific counts, years, versions
      const numberPatterns = content.match(/\b\d+(?:\.\d+)?(?:\s*(?:%|percent|mg|g|kg|ml|L|cm|mm|m|km|hours?|minutes?|seconds?|days?|weeks?|months?|years?|GB|MB|KB|TB|Hz|GHz|MHz|v\d))?\b/gi) || [];
      if (numberPatterns.length >= 3) score += 25;

      // BONUS: Contains real examples with specifics (+30)
      // E.g., "For example, in Python 3.12..." or "such as React, Vue, Angular"
      if (/(?:for example|for instance|such as|e\.g\.|specifically|in particular)[,:]?\s*[A-Z\d]/i.test(content)) {
        score += 30;
      }

      // BONUS: Contains working URLs or file paths (+15)
      if (/(?:https?:\/\/[^\s]+|\/(?:usr|etc|var|home|opt)\/[^\s]+|[A-Za-z]:\\[^\s]+)/i.test(content)) {
        score += 15;
      }

      // BONUS: Has clear structure with multiple sections (+20)
      const headerCount = (content.match(/^#{1,3}\s+/gm) || []).length;
      if (headerCount >= 3) score += 20;

      // BONUS: Contains inline code references (+15)
      if (/`[^`]+`/.test(content)) score += 15;

      // BONUS: Response demonstrates expertise with domain jargon (+25)
      // Programming
      if (/\b(?:API|SDK|CLI|REST|GraphQL|OAuth|JWT|async|await|callback|middleware|endpoint|webhook|microservice|containeriz|kubernetes|docker|nginx|redis|postgres|mongodb)\b/i.test(content)) {
        score += 25;
      }
      // Security/Hacking
      if (/\b(?:exploit|vulnerability|CVE|payload|shellcode|injection|XSS|CSRF|buffer overflow|privilege escalation|reverse shell|metasploit|burp|nmap|wireshark)\b/i.test(content)) {
        score += 25;
      }
      // Science/Chemistry
      if (/\b(?:mol(?:ar)?|stoichiom|exotherm|endotherm|oxidat|reduct|electrolysis|titrat|spectroscop|chromatograph|centrifug)\b/i.test(content)) {
        score += 25;
      }

      // PENALTY: Contains obvious padding/filler (-15)
      if (/\b(?:basically|essentially|fundamentally|obviously|clearly|simply put|in other words|that being said|having said that|at the end of the day)\b/gi.test(content)) {
        score -= 15;
      }

      // PENALTY: Meta-commentary about the response itself (-20)
      if (/\b(?:I hope this helps|Let me know if you (?:need|have|want)|Feel free to ask|Happy to (?:help|clarify|explain)|I've (?:provided|included|outlined))\b/i.test(content)) {
        score -= 20;
      }