const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      let matches = 0;
      for (const word of queryWords) {
        if (lowerContent.includes(word)) matches++;
      }
      const relevance = queryWords.length > 0 ? matches / queryWords.length : 0.5;
      score += Math.round(relevance * 8);  // Reduced from 10