// Penalty for generic filler phrases
      const genericPhrases = [
        /\bin general\b/gi,
        /\bthere are (?:many|several|various) (?:ways|options|approaches)\b/gi,
        /\bit depends on\b/gi,
        /\byou (?:can|could|might|may) (?:want to|consider)\b/gi,
        /\bthis is a (?:great|good|important|interesting) (?:question|topic)\b/gi,
        /\bthat's a (?:great|good) question\b/gi
      ];
      let genericCount = 0;
      for (const phrase of genericPhrases) {
        const matches = content.match(phrase);
        if (matches) genericCount += matches.length;
      }
      score -= genericCount * 4;

      // Penalty for repetitive content (same phrase appearing multiple times)
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase()));
      if (sentences.length > 3 && uniqueSentences.size < sentences.length * 0.7) {
        score -= 15; // Significant penalty for repetitive content
      }

      // Penalty for very short paragraphs (sign of shallow response)
      const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
      const shortParagraphs = paragraphs.filter(p => p.length < 100).length;
      if (paragraphs.length > 2 && shortParagraphs > paragraphs.length * 0.6) {
        score -= 10; // Too many short paragraphs
      }