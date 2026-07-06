// Code with actual code in query (highest priority)
      if (/```[\s\S]*```|def\s+\w+\s*\(|function\s+\w+\s*\(|class\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|import\s+\{|from\s+['"]|require\s*\(|#include|public\s+class/.test(query)) {
        signals.push('contains-code-block');
        return QUERY_TYPES.CODE;
      }

      // Math with actual equations/formulas
      if (/[=<>≤≥±×÷∑∏∫√∞]|\\frac|\\sqrt|\d+\s*[\+\-\*\/\^]\s*\d+|solve\s+for|calculate|compute|evaluate|simplify|factor|derivative|integral|equation|\\[a-z]+\{/.test(q)) {
        signals.push('math-symbols-or-operations');
        return QUERY_TYPES.MATH;
      }

      // Translation requests
      if (/\b(?:translate|translation)\b.*\b(?:to|into|from)\b|\b(?:in|to)\s+(?:spanish|french|german|chinese|japanese|korean|arabic|portuguese|italian|russian|hindi|dutch)\b/i.test(q)) {
        signals.push('translation-request');
        return QUERY_TYPES.TRANSLATION;
      }

      // Summarization
      if (/^(?:summarize|summary|tldr|tl;dr|sum up|give me the gist|condense|brief|shorten)\b/i.test(q) ||
          /\b(?:summarize|summary of|summarise|sum up)\s+(?:this|the|that|following)/i.test(q)) {
        signals.push('summarization-request');
        return QUERY_TYPES.SUMMARIZATION;
      }