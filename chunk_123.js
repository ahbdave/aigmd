const firstLine = content.trim().split('\n')[0] || '';
      if (/^(?:Here|The|To |First|Step|1\.|##|```|\*\*)/i.test(firstLine)) {
        score += 5; // Reduced from 8
      } else if (/^(?:I |Well|So,|Okay|Let me|Sure|Of course|Absolutely|Great question)/i.test(firstLine)) {
        score -= 8; // Increased from 5
      }