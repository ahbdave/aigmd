if (len < 100) score -= 25;
      else if (len < 300) score -= 15;
      else if (len < 500) score -= 8;
      else if (len < 800) score -= 3;
      else if (len >= 2000) score += 5;
      else if (len >= 4000) score += 8;
      else if (len >= 6000) score += 10;
      // Note: 500-2000 chars = no bonus, just neutral