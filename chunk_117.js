const codeBlocks = (content.match(/```/g) || []).length / 2;
      const headers = (content.match(/^#{1,3}\s+/gm) || []).length;
      const bullets = (content.match(/^\s*[-*•]\s+/gm) || []).length;
      const numbered = (content.match(/^\s*\d+\.\s+/gm) || []).length;

      if (codeBlocks >= 1) score += 4;  // Reduced from 8
      if (codeBlocks >= 3) score += 3;  // Reduced from 4
      if (headers >= 3) score += 3;     // Reduced from 5, requires 3 headers
      if (bullets + numbered >= 5) score += 2;  // Reduced from 5, requires 5 items