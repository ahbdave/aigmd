// Interview
      if (/\b(?:interview|mock interview|practice interview|interview question|interview prep|behavioral question|situational question)\b/i.test(q)) {
        signals.push('interview-request');
        return QUERY_TYPES.INTERVIEW;
      }