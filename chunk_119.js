const numbers = (content.match(/\b\d+(?:\.\d+)?(?:%|px|em|rem|ms|s|gb|mb|kb)?\b/gi) || []).length;
      const urls = (content.match(/https?:\/\/[^\s]+/g) || []).length;
      const inlineCode = (content.match(/`[^`]+`/g) || []).length;
      const examples = (content.match(/(?:for example|e\.g\.|such as|specifically)/gi) || []).length;

      if (numbers >= 5) score += 3;   // Reduced from 5, requires more numbers
      if (numbers >= 12) score += 2;  // Reduced from 3
      if (urls >= 2) score += 2;      // Reduced from 3, requires 2 URLs
      if (inlineCode >= 4) score += 2; // Reduced from 4, requires more inline code
      if (examples >= 2) score += 3;   // Reduced from 5, requires 2 examples