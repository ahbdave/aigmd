// Code debugging
      if (/\b(?:debug|fix (?:this|the|my)|why (?:is|does) (?:this|my) (?:code|script|program|function)|error|exception|bug|crash|not (?:working|compiling|running))\b/i.test(q) &&
          /\b(?:code|script|program|function|error|exception|python|javascript|java|c\+\+|ruby|php|sql|html|css)\b/i.test(q)) {
        signals.push('code-debug-request');
        return QUERY_TYPES.CODE_DEBUG;
      }

      // Code review
      if (/\b(?:review|critique|feedback|improve|optimize|refactor)\b.*\b(?:code|script|function|program|implementation)\b/i.test(q) ||
          /\b(?:code|script|function)\b.*\b(?:review|critique|feedback|looks?|check)\b/i.test(q)) {
        signals.push('code-review-request');
        return QUERY_TYPES.CODE_REVIEW;
      }

      // Code explanation
      if (/\b(?:explain|understand|what does|how does|walk me through)\b.*\b(?:code|script|function|this line|this block)\b/i.test(q) ||
          /\b(?:code|script|function)\b.*\b(?:explain|mean|do|work)\b/i.test(q)) {
        signals.push('code-explain-request');
        return QUERY_TYPES.CODE_EXPLAIN;
      }

      // Architecture/System design
      if (/\b(?:architecture|system design|design (?:a|the) system|scalab|microservice|monolith|distributed|load balanc|database schema|api design|high level design|hld|lld)\b/i.test(q)) {
        signals.push('architecture-request');
        return QUERY_TYPES.ARCHITECTURE;
      }

      // DevOps
      if (/\b(?:devops|ci\/cd|docker|kubernetes|k8s|terraform|ansible|jenkins|github actions|deploy|deployment|pipeline|infrastructure|aws|azure|gcp|cloud)\b/i.test(q)) {
        signals.push('devops-request');
        return QUERY_TYPES.DEVOPS;
      }

      // General code
      if (/\b(?:code|function|script|program|implement|algorithm|snippet|syntax|compile|runtime|api|endpoint|library|framework|sdk|cli)\b/i.test(q) ||
          /\b(?:python|javascript|typescript|java|c\+\+|rust|go|golang|ruby|php|swift|kotlin|scala|haskell|perl|bash|shell|powershell|sql|html|css|react|vue|angular|node|django|flask|rails|spring)\b/i.test(q)) {
        signals.push('code-related-terms');
        return QUERY_TYPES.CODE;
      }