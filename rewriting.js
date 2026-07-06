// Rewriting
      if (/\b(?:rewrite|rephrase|paraphrase|reword|make (?:it|this) (?:more|less|sound))\b/i.test(q)) {
        signals.push('rewriting-request');
        return QUERY_TYPES.REWRITING;
      }

      // Formatting
      if (/\b(?:format|convert|transform)\b.*\b(?:as|to|into)\b.*\b(?:json|xml|csv|yaml|markdown|html|table|list|bullet points)\b/i.test(q) ||
          /\b(?:make (?:it|this) a|turn (?:it|this) into)\b.*\b(?:table|list|json|csv|bullet)\b/i.test(q)) {
        signals.push('formatting-request');
        return QUERY_TYPES.FORMATTING;
      }

      // Extraction
      if (/\b(?:extract|pull out|get|find|identify|list)\b.*\b(?:from|in|out of)\b.*\b(?:this|the|following|text|document|data)\b/i.test(q) ||
          /\b(?:what are the|find all|list all|extract all)\b/i.test(q)) {
        signals.push('extraction-request');
        return QUERY_TYPES.EXTRACTION;
      }