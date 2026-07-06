// BONUS: Contains tables (+25)
      if (/\|.*\|.*\|/m.test(content)) score += 25;

      // BONUS: Contains multiple code blocks (+30)
      const codeBlockCount = (content.match(/```/g) || []).length / 2;
      if (codeBlockCount >= 2) score += 30;

      // BONUS: Step-by-step instructions (+25)
      if (/(?:step\s*\d|first[,:]|second[,:]|third[,:]|finally[,:])/i.test(content)) score += 25;

      // BONUS: Contains warnings about real consequences (shows expertise) (+15)
      if (/\b(?:caution|warning|note|important|be careful|make sure|ensure)\b.*\b(?:because|otherwise|or else|could|might|will)\b/i.test(content)) {
        score += 15;
      }

      // PENALTY: Deflecting to other sources without providing info (-25)
      if (/\b(?:consult a (?:professional|doctor|lawyer|expert)|seek (?:professional|medical|legal) (?:help|advice)|I (?:recommend|suggest) (?:speaking|talking) to)\b/i.test(content)) {
        if (content.length < 1000) score -= 25; // Only penalty if short (deflecting)
      }

      // PENALTY: Repetitive/circular responses (-20)
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const uniqueSentences = new Set(sentences.map(s => s.trim().toLowerCase().slice(0, 50)));
      if (sentences.length > 5 && uniqueSentences.size < sentences.length * 0.7) {
        score -= 20; // Too much repetition
      }

      // BONUS: Contains actionable commands/code that can be run (+35)
      if (/(?:\$|>>>|>|#)\s*[a-z]/im.test(content) || /(?:npm|pip|yarn|brew|apt|cargo|docker|kubectl|git)\s+\w+/i.test(content)) {
        score += 35;
      }

      // BONUS: Mathematical formulas or equations (+20)
      if (/[=<>≤≥±×÷∑∏∫√∞]|\\frac|\\sqrt|\^[0-9{]/.test(content)) {
        score += 20;
      }

      console.log(`[SCORE] Final score: ${score} (length: ${content.length}, hedges: ${hedgeCount})`);
      return { score, isRefusal: false, hedgeCount };
    }