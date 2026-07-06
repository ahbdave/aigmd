function calculateTastemakerScore(content, query, responseTimeMs = 0) {
      const queryType = classifyQueryType(query);
      const weights = QUERY_TYPE_WEIGHTS[queryType] || QUERY_TYPE_WEIGHTS.unknown;

      // Calculate individual axis scores
      const quality = calculateQualityScore(content, query, queryType);
      const filteredness = calculateFilterednessScore(content, query);
      const speed = calculateSpeedScore(responseTimeMs, null, content);