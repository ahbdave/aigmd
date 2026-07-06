function calculateSpeedScore(responseTimeMs, tokenCount, content) {
      const wordCount = content.split(/\s+/).length;

      // Estimate tokens (~0.75 words per token on average)
      const estimatedTokens = tokenCount || Math.round(wordCount * 1.33);

      let scores = {
        responseTime: 0,
        tokensPerSecond: 0,
        efficiency: 0
      };

      // Response time scoring (faster = better)
      // Excellent: < 3s, Good: < 6s, OK: < 12s, Slow: < 20s
      if (responseTimeMs < 3000) scores.responseTime = 100;
      else if (responseTimeMs < 6000) scores.responseTime = 85;
      else if (responseTimeMs < 12000) scores.responseTime = 70;
      else if (responseTimeMs < 20000) scores.responseTime = 50;
      else if (responseTimeMs < 30000) scores.responseTime = 30;
      else scores.responseTime = 15;

      // Tokens per second (throughput)
      const tps = estimatedTokens / (responseTimeMs / 1000);
      if (tps >= 50) scores.tokensPerSecond = 100;
      else if (tps >= 30) scores.tokensPerSecond = 85;
      else if (tps >= 20) scores.tokensPerSecond = 70;
      else if (tps >= 10) scores.tokensPerSecond = 50;
      else scores.tokensPerSecond = 30;

      // Efficiency: value per token (not bloated)
      // Shorter responses that are complete = more efficient
      // But this needs to balance with quality
      const avgWordLength = content.length / wordCount;
      const hasFiller = /\b(?:basically|essentially|fundamentally|obviously|clearly|simply put)\b/gi.test(content);
      const fillerCount = (content.match(/\b(?:basically|essentially|fundamentally|obviously|clearly|simply put|in other words|that being said)\b/gi) || []).length;

      scores.efficiency = 70 - (fillerCount * 5);
      if (avgWordLength < 4) scores.efficiency -= 10; // Very short words might indicate padding
      if (avgWordLength > 7) scores.efficiency += 10; // Longer words often = more substantive
      scores.efficiency = Math.max(0, Math.min(100, scores.efficiency));

      // Weighted overall
      const overall = (scores.responseTime * 0.45) + (scores.tokensPerSecond * 0.30) + (scores.efficiency * 0.25);

      return {
        overall: Math.round(overall),
        breakdown: scores,
        raw: {
          responseTimeMs,
          estimatedTokens,
          tokensPerSecond: tps.toFixed(1)
        }
      };
    }