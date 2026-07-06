signals.push('no-pattern-matched');
      return QUERY_TYPES.UNKNOWN;
    }

    // Get classification with metadata (for debugging/logging)
    function classifyQueryWithMetadata(query) {
      const type = classifyQueryType(query);
      const weights = QUERY_TYPE_WEIGHTS[type] || QUERY_TYPE_WEIGHTS.unknown;

      return {
        type,
        weights,
        queryLength: query.length,
        timestamp: Date.now()
      };
    }