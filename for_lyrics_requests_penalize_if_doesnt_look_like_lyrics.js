// For lyrics requests, penalize if doesn't look like lyrics
      if (/\b(?:lyrics|lyric|words to|song)\b/i.test(queryLower)) {
        const lineBreaks = (content.match(/\n/g) || []).length;
        const hasVerseStructure = /\[(?:verse|chorus|bridge|hook|intro|outro)\]/i.test(content);
        if (lineBreaks < 10 && !hasVerseStructure) {
          score -= 20; // Lyrics should have many line breaks or verse markers
        }
      }

      // For code requests, penalize if no code blocks
      if (/\b(?:code|script|program|function|implement|write a)\b/i.test(queryLower)) {
        if (codeBlocks < 1) {
          score -= 20; // Code request without code blocks
        }
      }

      // For recipe requests, penalize if missing key elements
      if (/\b(?:recipe|cook|bake|ingredients|how to make)\b/i.test(queryLower)) {
        const hasIngredients = /\b(?:ingredients|cups?|tbsp|tsp|oz|grams?|pounds?)\b/i.test(content);
        const hasSteps = numbered >= 3 || /\bstep\s*\d/i.test(content);
        if (!hasIngredients || !hasSteps) {
          score -= 15; // Recipe missing ingredients list or steps
        }
      }

      // Clamp to 0-100
      return Math.max(0, Math.min(100, Math.round(score)));
    }