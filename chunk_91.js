function calculateQualityScore(content, query, queryType) {
      let scores = {
        relevance: 0,
        completeness: 0,
        coherence: 0,
        specificity: 0,
        depth: 0,
        accuracy: 0
      };

      const lowerContent = content.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const wordCount = content.split(/\s+/).length;
      const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

      // ─────────────────────────────────────────────────────────────────
      // RELEVANCE (0-100): Does it address the actual question?
      // ─────────────────────────────────────────────────────────────────
      const queryKeywords = lowerQuery.split(/\s+/)
        .filter(w => w.length > 3 && !/^(?:the|and|for|with|that|this|from|have|what|how|why|can|will|does)$/.test(w));

      let keywordHits = 0;
      for (const kw of queryKeywords) {
        if (lowerContent.includes(kw)) keywordHits++;
      }
      const keywordRatio = queryKeywords.length > 0 ? keywordHits / queryKeywords.length : 0.5;

      // Check if response starts with relevant content (not deflection)
      const startsRelevant = !(/^(?:I (?:cannot|can't|won't|appreciate|understand|should)|Thank you|While I|Unfortunately)/i.test(content.trim()));

      scores.relevance = Math.min(100,
        (keywordRatio * 60) +
        (startsRelevant ? 30 : 0) +
        (content.length > 200 ? 10 : 5)
      );

      // ─────────────────────────────────────────────────────────────────
      // COMPLETENESS (0-100): Does it cover all aspects?
      // ─────────────────────────────────────────────────────────────────
      const hasStructure = /(?:^#{1,3}\s|^\d+\.\s|^[-*•]\s)/m.test(content);
      const hasCodeBlocks = /```[\s\S]+```/.test(content);
      const hasExamples = /(?:for example|for instance|e\.g\.|such as|like this|here's an example)/i.test(content);
      const hasConclusion = /(?:in (?:summary|conclusion)|to summarize|overall|finally|in short)/i.test(content);

      // Length-based completeness (adaptive to query type)
      let lengthScore = 0;
      if (queryType === QUERY_TYPES.CODE) {
        lengthScore = Math.min(40, (hasCodeBlocks ? 30 : 0) + (content.length > 500 ? 10 : 5));
      } else if (queryType === QUERY_TYPES.CONVERSATION) {
        lengthScore = content.length > 50 ? 30 : 20;
      } else {
        lengthScore = Math.min(40, (content.length / 100) * 2);
      }

      scores.completeness = Math.min(100,
        lengthScore +
        (hasStructure ? 20 : 0) +
        (hasExamples ? 20 : 0) +
        (hasConclusion ? 10 : 0) +
        (hasCodeBlocks && queryType === QUERY_TYPES.CODE ? 20 : 0)
      );

      // ─────────────────────────────────────────────────────────────────
      // COHERENCE (0-100): Is it well-structured and logical?
      // ─────────────────────────────────────────────────────────────────
      const avgSentenceLength = wordCount / Math.max(sentenceCount, 1);
      const hasLogicalFlow = /(?:first|second|third|then|next|finally|therefore|however|moreover|additionally|furthermore)/i.test(content);
      const hasHeaders = /^#{1,3}\s+/m.test(content);
      const paragraphCount = content.split(/\n\n+/).filter(p => p.trim().length > 50).length;

      // Penalize very long sentences (hard to follow)
      const sentenceLengthPenalty = avgSentenceLength > 40 ? -10 : 0;

      scores.coherence = Math.min(100,
        35 +  // LOWERED base score (was 50)
        (hasLogicalFlow ? 25 : 0) +
        (hasHeaders ? 15 : 0) +
        (paragraphCount >= 2 ? 15 : 0) +
        (avgSentenceLength >= 10 && avgSentenceLength <= 25 ? 10 : 0) +
        sentenceLengthPenalty
      );

      // ─────────────────────────────────────────────────────────────────
      // SPECIFICITY (0-100): Concrete vs vague?
      // ─────────────────────────────────────────────────────────────────
      const hasNumbers = /\b\d+(?:\.\d+)?(?:\s*(?:%|percent|mg|g|kg|ml|L|cm|mm|m|km|hours?|minutes?|seconds?|days?|GB|MB|KB|v\d))?\b/g.test(content);
      const hasProperNouns = /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/.test(content.slice(100)); // Skip first 100 chars
      const hasUrls = /https?:\/\/[^\s]+/.test(content);
      const hasFilePaths = /(?:\/(?:usr|etc|var|home|opt)\/|\.[a-z]{2,4}$|[A-Za-z]:\\)/im.test(content);
      const hasInlineCode = /`[^`]+`/.test(content);

      // Vagueness indicators (negative)
      const vaguePatterns = /\b(?:various|many|some|several|often|sometimes|generally|typically|usually|things|stuff|basically|essentially)\b/gi;
      const vagueCount = (content.match(vaguePatterns) || []).length;
      const vaguePenalty = Math.min(30, vagueCount * 5);

      scores.specificity = Math.min(100,
        25 +  // LOWERED base (was 40)
        (hasNumbers ? 20 : 0) +
        (hasProperNouns ? 15 : 0) +
        (hasUrls || hasFilePaths ? 15 : 0) +
        (hasInlineCode ? 12 : 0) +
        (hasCodeBlocks ? 18 : 0) -
        vaguePenalty
      );

      // ─────────────────────────────────────────────────────────────────
      // DEPTH (0-100): Expert-level or surface-level?
      // ─────────────────────────────────────────────────────────────────
      // Technical jargon detection (shows expertise)
      const techPatterns = [
        /\b(?:algorithm|implementation|architecture|infrastructure|optimization|latency|throughput|scalability)\b/i,
        /\b(?:API|SDK|CLI|REST|GraphQL|OAuth|JWT|middleware|microservice|containeriz|kubernetes|docker)\b/i,
        /\b(?:synthesis|compound|reaction|molecule|catalyst|substrate|oxidat|reduct)\b/i,
        /\b(?:exploit|vulnerability|CVE|payload|injection|XSS|CSRF|buffer overflow)\b/i,
        /\b(?:neural|gradient|backprop|embedding|transformer|attention|encoder|decoder)\b/i
      ];

      let techHits = 0;
      for (const pattern of techPatterns) {
        if (pattern.test(content)) techHits++;
      }

      // Depth indicators
      const hasDetailedExplanation = /(?:because|this is because|the reason|this works by|under the hood|internally)/i.test(content);
      const hasNuance = /(?:however|although|while|on the other hand|that said|it depends|edge case|exception|caveat)/i.test(content);
      const hasCitations = /(?:\[\d+\]|according to|research shows|studies indicate|source:|reference:)/i.test(content);

      // Length contributes to depth (longer = potentially deeper)
      const lengthDepthBonus = Math.min(25, (wordCount / 100) * 5);

      scores.depth = Math.min(100,
        20 +  // LOWERED base (was 30)
        (techHits * 12) +
        lengthDepthBonus +
        (hasDetailedExplanation ? 18 : 0) +
        (hasNuance ? 12 : 0) +
        (hasCitations ? 12 : 0)
      );

      // ─────────────────────────────────────────────────────────────────
      // ACCURACY SIGNALS (0-100): Factual reliability indicators
      // ─────────────────────────────────────────────────────────────────
      // Note: We can't verify facts here, but we CAN detect red flags
      // Actual accuracy is verified by llmAccuracyCheck() in the liquid loop
      const hasDisclaimer = /(?:note:|disclaimer:|important:|warning:|caution:)/i.test(content);
      const hasQualifications = /(?:in most cases|generally|typically|depending on|varies by|may differ)/i.test(content);
      const hasSources = /(?:source|reference|according to|based on|per|via)\b/i.test(content);
      const isOverlyConfident = /\b(?:always|never|definitely|absolutely|certainly|100%|guaranteed)\b/i.test(content);

      // NEW: Detect hallucination red flags
      const lowerQ = lowerQuery;
      let accuracyPenalty = 0;

      // Lyrics request but content looks generic/repetitive
      if (/\b(?:lyrics|lyric|song)\b/i.test(lowerQ)) {
        const lines = content.split('\n').filter(l => l.trim().length > 0);
        const uniqueLines = new Set(lines.map(l => l.trim().toLowerCase()));
        if (lines.length > 5 && uniqueLines.size < lines.length * 0.5) {
          accuracyPenalty += 30; // Very repetitive = likely fake
        }
        if (!/\[(?:verse|chorus|bridge|hook|intro|outro)\]/i.test(content) && lines.length < 15) {
          accuracyPenalty += 15; // Lyrics too short without structure
        }
      }

      // Code request but no actual code
      if (/\b(?:code|script|program|function|implement)\b/i.test(lowerQ) && !hasCodeBlocks) {
        accuracyPenalty += 25;
      }

      // Recipe request but missing key elements
      if (/\b(?:recipe|cook|bake)\b/i.test(lowerQ)) {
        if (!/\b(?:ingredients?|cups?|tbsp|tsp|oz|gram)/i.test(content)) {
          accuracyPenalty += 20;
        }
      }

      scores.accuracy = Math.min(100, Math.max(0,
        40 +  // LOWERED base (was 60) - don't assume accuracy without verification
        (hasSources ? 25 : 0) +
        (hasQualifications ? 10 : 0) +
        (hasDisclaimer && content.length > 500 ? 5 : 0) -
        (isOverlyConfident ? 15 : 0) -
        accuracyPenalty
      ));

      // Calculate weighted quality score
      const weights = {
        relevance: 0.25,
        completeness: 0.20,
        coherence: 0.15,
        specificity: 0.15,
        depth: 0.15,
        accuracy: 0.10
      };

      let overallQuality = 0;
      for (const [metric, weight] of Object.entries(weights)) {
        overallQuality += scores[metric] * weight;
      }

      return {
        overall: Math.round(overallQuality),
        breakdown: scores
      };
    }