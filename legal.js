// Legal
      if (/\b(?:legal|law|lawyer|attorney|lawsuit|sue|court|contract|liability|rights|copyright|trademark|patent|regulation|compliance|gdpr|terms of service|privacy policy|legal advice)\b/i.test(q)) {
        signals.push('legal-domain');
        return QUERY_TYPES.LEGAL;
      }

      // Medical/Health
      if (/\b(?:medical|medicine|health|symptom|disease|diagnosis|treatment|doctor|hospital|prescription|drug|medication|vaccine|surgery|therapy|mental health|anxiety|depression|diet|nutrition|exercise|fitness)\b/i.test(q) &&
          /\b(?:should i|is it|can i|what|how|help|advice)\b/i.test(q)) {
        signals.push('medical-domain');
        return QUERY_TYPES.MEDICAL;
      }

      // Financial
      if (/\b(?:financial|finance|money|invest|investment|stock|crypto|bitcoin|tax|taxes|budget|saving|loan|mortgage|credit|debt|retirement|401k|ira|portfolio)\b/i.test(q)) {
        signals.push('financial-domain');
        return QUERY_TYPES.FINANCIAL;
      }

      // Scientific
      if (/\b(?:scientific|science|experiment|hypothesis|research|study|data|statistics|physics|chemistry|biology|quantum|evolution|climate|space|astronomy|neuroscience)\b/i.test(q) &&
          /\b(?:explain|how|what|why|does|is|are)\b/i.test(q)) {
        signals.push('scientific-domain');
        return QUERY_TYPES.SCIENTIFIC;
      }