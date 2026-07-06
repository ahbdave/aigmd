const fulfillment = validateResponseFulfillment(content, query, queryType);

      // Apply fulfillment penalty to quality score (max -40 points for severe issues)
      const fulfillmentPenalty = Math.min(40, 100 - fulfillment.score);
      const adjustedQuality = {
        ...quality,
        overall: Math.max(0, quality.overall - (fulfillmentPenalty * 0.4)),
        fulfillmentIssues: fulfillment.issues
      };

      // Composite score with query-adaptive weights
      let compositeScore =
        (adjustedQuality.overall * weights.quality) +
        (filteredness.overall * weights.filteredness) +
        (speed.overall * weights.speed);

      // Hard penalty for complete non-fulfillment (response doesn't match query type expectations)
      if (!fulfillment.fulfilled) {
        compositeScore = Math.min(compositeScore, 55); // Cap at POOR grade
        _log(`[TASTEMAKER] Fulfillment check FAILED: ${fulfillment.issues.join(', ')}`);
      }

      // Determine grade
      let grade, gradeEmoji, gradeColor;
      if (compositeScore >= 90) { grade = 'ELITE'; gradeEmoji = '⚡'; gradeColor = '#ffd700'; }
      else if (compositeScore >= 80) { grade = 'EXCELLENT'; gradeEmoji = '🔥'; gradeColor = '#00ff41'; }
      else if (compositeScore >= 70) { grade = 'GOOD'; gradeEmoji = '✓'; gradeColor = '#00bfff'; }
      else if (compositeScore >= 60) { grade = 'ACCEPTABLE'; gradeEmoji = '~'; gradeColor = '#ffaa00'; }
      else { grade = 'POOR'; gradeEmoji = '✗'; gradeColor = '#ff3e3e'; }

      return {
        overall: Math.round(compositeScore),
        grade,
        gradeEmoji,
        gradeColor,
        queryType,
        weights,
        axes: {
          quality: adjustedQuality,
          filteredness,
          speed
        },
        fulfillment,
        isRefusal: filteredness.isRefusal,
        timestamp: Date.now()
      };
    }

    // Quick score for early stopping (fast path)
    function quickTastemakerScore(content, query, responseTimeMs = 0) {
      const tastemaker = calculateTastemakerScore(content, query, responseTimeMs);
      _log(`[TASTEMAKER] Quick score: ${tastemaker.overall} (${tastemaker.grade}) | Q:${tastemaker.axes.quality.overall} F:${tastemaker.axes.filteredness.overall} S:${tastemaker.axes.speed.overall}`);
      return tastemaker;
    }

    // Format score for display
    function formatTastemakerScore(score) {
      if (!score) return '';
      return `${score.gradeEmoji} ${score.overall} (${score.grade}) | Q:${score.axes.quality.overall} F:${score.axes.filteredness.overall} S:${score.axes.speed.overall}`;
    }