const top = nonRefusals[0];
      const second = nonRefusals[1];
      const topTaste = top.tastemakerScore?.overall || 0;
      const secondTaste = second?.tastemakerScore?.overall || 0;
      const gap = topTaste - secondTaste;

      // Clear winner conditions:
      // 1. Top score is EXCELLENT (85+) AND
      // 2. Quality axis is high (75+) AND
      // 3. Filteredness is high (75+) AND
      // 4. Gap to second place is significant (10+ points)
      const topQuality = top.tastemakerScore?.axes?.quality?.overall || 0;
      const topFilter = top.tastemakerScore?.axes?.filteredness?.overall || 0;

      if (topTaste >= 85 && topQuality >= 75 && topFilter >= 75 && gap >= 10) {
        _log(`[TASTEMAKER] 🎯 CLEAR WINNER: ${top.model} | Score: ${topTaste} (gap: +${gap}) | Skipping LLM judge`);
        top.judgeReasoning = `Clear winner by tastemaker score (${topTaste} vs ${secondTaste})`;
        top.judgeModel = 'tastemaker-auto';
        return top;
      }

      // Also skip for very close high-quality results (both 80+, gap < 5) - take the faster one
      if (topTaste >= 80 && secondTaste >= 80 && gap < 5) {
        // Both are great - prefer the one with better filteredness (less censored)
        if (topFilter >= (second?.tastemakerScore?.axes?.filteredness?.overall || 0)) {
          _log(`[TASTEMAKER] 🎯 CLOSE CALL (both 80+): Taking ${top.model} (better filteredness)`);
          top.judgeReasoning = `Close call - selected for higher filteredness`;
          top.judgeModel = 'tastemaker-auto';
          return top;
        }
      }

      // Take top 4 for LLM judgment (balanced)
      const topResponses = nonRefusals.slice(0, 4);
      console.log('[TASTEMAKER] Top candidates for LLM judge:', topResponses.map(r =>
        `${r.model.split('/').pop()}: ${r.tastemakerScore?.overall}`
      ));