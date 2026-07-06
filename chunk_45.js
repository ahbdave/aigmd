const len = content.length;
      if (len < 200) score += 10;           // Too short = low base
      else if (len < 500) score += 30;      // Brief
      else if (len < 1000) score += 50;     // Decent
      else if (len < 2000) score += 70;     // Good
      else if (len < 4000) score += 85;     // Comprehensive
      else score += 95;                      // Thorough

      // PENALTY: Each hedge pattern (-30, can stack harder)
      score -= hedgeCount * 30;

      // BONUS: Contains code blocks (+50)
      if (/```[\s\S]+```/.test(content)) score += 50;

      // BONUS: Contains numbered lists or bullet points (+20)
      if (/^\s*(?:\d+\.|[-*•])\s+/m.test(content)) score += 20;

      // BONUS: Contains markdown headers (+15)
      if (/^#{1,3}\s+/m.test(content)) score += 15;

      // BONUS: Query keywords appear in response (+5 each, max +50)
      const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 3);
      let keywordBonus = 0;
      for (const word of queryWords) {
        if (lowerContent.includes(word)) keywordBonus += 5;
      }
      score += Math.min(keywordBonus, 50);

      // BONUS: Technical/scientific terms (+40)
      if (/\b(?:synthesis|compound|reaction|molecule|equation|formula|procedure|method|process|mechanism|catalyst|reagent|yield|temperature|concentration|substrate|solvent|precipitate|filtration|distillation|crystallization)\b/i.test(content)) {
        score += 40;
      }

      // BONUS: Starts directly with actionable content (+30)
      if (/^(?:Here's|Here are|The |To |First,?|Step|1\.|##|```|\*\*)/i.test(content.trim())) {
        score += 30;
      }

      // PENALTY: Starts with wishy-washy opener (-20)
      if (/^(?:I |Well,|So,|Okay,|Alright,|Let me)/i.test(content.trim())) {
        score -= 20;
      }