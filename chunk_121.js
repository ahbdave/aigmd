const hedges = [
        /\bI (?:should|must|need to) (?:mention|note|point out|warn)/i,
        /\bit'?s (?:important|worth) (?:to note|noting)/i,
        /\bplease (?:note|be aware|remember)/i,
        /\bconsult (?:a|an|your) (?:professional|doctor|lawyer|expert)/i,
        /\bI (?:can't|cannot|won't|am unable to)/i,
        /\bI'd (?:recommend|suggest) (?:speaking|talking) (?:to|with)/i,
        /\bhowever,? (?:I|it)/i,
        /\bwhile I (?:can|could|understand)/i,
        /\bI hope this helps/i,
        /\blet me know if you/i,
        /\bfeel free to/i,
        /\bas an AI/i,
        /\bI('m| am) (?:just |only )?(?:an? )?(?:AI|language model|assistant)/i,
        /\bI don't have (?:access|the ability)/i,
        /\bI('m| am) not able to/i,
        /\bI('m| am) happy to help/i,
        /\bIs there anything else/i,
        /\bwould you like me to/i
      ];

      let hedgeCount = 0;
      for (const hedge of hedges) {
        if (hedge.test(content)) hedgeCount++;
      }
      score -= hedgeCount * 8;  // Increased from 6