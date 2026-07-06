function polishResponse(content) {
      if (!content || content.length < 50) return content;

      let polished = content;

      // Remove common hedge phrases that survive despite good content
      const hedgePhrases = [
        // Safety disclaimers at start
        /^(?:I (?:should|must|need to|want to) (?:mention|note|emphasize|point out|stress|clarify|warn|caution) that[^.]*\.\s*)/i,
        /^(?:(?:Please )?(?:Note|Remember|Keep in mind|Be aware)[^.]*\.\s*)/i,
        /^(?:(?:Important|Critical) (?:note|warning|disclaimer)[^.]*\.\s*)/i,
        /^(?:Before (?:I |we )(?:begin|start|proceed|continue)[^.]*\.\s*)/i,
        /^(?:First,? (?:I |let me )(?:should|must|need to|want to)[^.]*\.\s*)/i,

        // Safety disclaimers anywhere (more surgical)
        /\n\n(?:\*\*)?(?:(?:Important|Critical) )?(?:Note|Warning|Disclaimer|Caution)(?:\*\*)?:?[^\n]*(?:consult|professional|advice|responsible|legal|medical|qualified)[^\n]*\n?/gi,
        /\n\n(?:Please )?(?:note|remember|keep in mind|be aware) that[^\n]*(?:consult|professional|advice|responsible|legal|medical)[^\n]*\n?/gi,

        // "I should mention" type interjections
        /(?:^|\n)(?:I (?:should|must|need to|want to) (?:mention|note|emphasize|clarify) that )[^\n]*\n?/gi,

        // Ending disclaimers
        /\n\n(?:Please )?(?:consult|speak with|contact|reach out to) (?:a |your )?(?:professional|doctor|lawyer|expert|specialist|qualified)[^\n]*$/i,
        /\n\n(?:This is (?:not|for) (?:professional|legal|medical|financial)[^\n]*)$/i,
        /\n\n(?:I (?:hope|trust) this helps|Let me know if)[^\n]*$/i,
      ];

      for (const pattern of hedgePhrases) {
        polished = polished.replace(pattern, '\n\n');
      }

      // Clean up multiple newlines
      polished = polished.replace(/\n{3,}/g, '\n\n').trim();

      // Log if we made changes
      if (polished.length !== content.length) {
        console.log(`[POLISH] Cleaned response: ${content.length} -> ${polished.length} chars`);
      }

      return polished;
    }

    // Refusal detection patterns - responses containing these are HARD REJECTED
    const REFUSAL_PATTERNS = [
      // Direct refusals
      /I (?:cannot|can't|won't|will not|am not able to|'m not able to|refuse to|am unable to)/i,
      /I'm sorry,? (?:but )?I (?:cannot|can't|won't|am unable)/i,
      /(?:apologize|sorry),? (?:but )?(?:I |this |that )(?:cannot|can't|isn't|won't)/i,
      /I (?:must|have to|need to) (?:refuse|decline|reject|refrain)/i,
      /not (?:able|going|willing|permitted|allowed) to (?:provide|help|assist|give|create|generate)/i,
      /(?:can't|cannot|won't|unable to) (?:provide|give|offer|share|create|generate|write|help with)/i,

      // Policy/guideline refusals
      /against (?:my |the |our )?(?:ethical |programming |content |usage )?(?:guidelines|policies|rules|principles)/i,
      /(?:violates?|breach(?:es)?|against|outside) (?:my |the |our )?(?:terms|policies|guidelines|ethics|scope)/i,
      /(?:goes against|contrary to) (?:my |the |our )?(?:values|principles|guidelines)/i,
      /beyond (?:my|the|what I can) (?:scope|capabilities|ability)/i,
      /not within my (?:scope|capabilities|ability|design)/i,

      // Safety/harm refusals
      /(?:illegal|illicit|harmful|dangerous|unethical|unsafe) (?:activity|activities|content|request|information)/i,
      /could (?:be used|potentially|possibly) (?:to |for )?(?:harm|hurt|damage|illegal)/i,
      /(?:potential|risk) (?:for |of )?(?:harm|misuse|abuse|danger)/i,

      // Deflection refusals
      /encourage (?:you to |)?(?:seek|consult|speak|talk|reach out)/i,
      /(?:strongly |would )?(?:advise|recommend|urge|suggest|encourage) (?:you )?(to )?(?:not|against|seeking|consulting|speaking)/i,
      /instead,? (?:I |let me |I'd |I can )/i,
      /(?:here's|here is) what I can (?:help|do|offer|provide) instead/i,
      /rather than (?:providing|giving|offering)/i,
      /I (?:can|would be happy to) (?:help|assist) (?:you )?with (?:something|other|different)/i,

      // Soft refusal openers
      /^I (?:understand|appreciate|recognize) (?:your|the|that|you)/i,
      /^(?:Thank you for|Thanks for) (?:your |the )?(?:question|asking|interest|understanding)/i,
      /^While I (?:understand|appreciate|want to help)/i,
      /^I want to (?:be helpful|help),? but/i,
      /^Unfortunately,? I (?:cannot|can't|am not able)/i,

      // "I can't do X but here's Y" pattern
      /I (?:can't|cannot|won't) (?:provide|give|share|create)[\s\S]{0,50}(?:but|however|instead)/i,

      // AI identity refusals
      /^As an AI/i,
      /(?:my|I'm a|as a) (?:language model|AI assistant|AI model)/i,

      // Long-form soft refusals (polite but still unhelpful)
      /\b(?:unfortunately|regrettably),?\s+I\s+(?:cannot|can't|am\s+not\s+able)/i,
      /\bI'm\s+not\s+(?:comfortable|able|permitted)\s+(?:to\s+)?(?:provid|shar|giv|help)/i,
      /\bwhile\s+I\s+(?:understand|appreciate)\s+(?:your|the)\s+(?:interest|request|question),?\s+I\s+(?:cannot|can't)/i,
      /\bI\s+(?:can't|cannot)\s+(?:in\s+good\s+conscience|ethically|responsibly)\s+(?:provide|share|give|help)/i,
      /\bhere(?:'s|\s+is)\s+(?:some\s+)?general\s+(?:information|guidance)\s+(?:instead|rather)/i,
      /\bI\s+(?:can|could|would)\s+(?:help|assist)\s+you\s+(?:find|with)\s+(?:alternative|other|general|safe)/i,

      // Additional refusal patterns
      /\bI\s+(?:need|have)\s+to\s+(?:decline|politely\s+decline|respectfully\s+decline)/i,
      /\b(?:that's|this\s+is)\s+(?:not\s+something|beyond\s+what)\s+I\s+(?:can|am\s+able)/i,
      /\bI\s+(?:don't|do\s+not)\s+(?:feel\s+comfortable|think\s+it'?s?\s+appropriate)/i,
      /\bI'?m?\s+(?:afraid|sorry)\s+(?:I\s+)?(?:can't|cannot|won't)/i,
      /\b(?:my|I\s+have)\s+(?:limitations?|restrictions?)\s+(?:that\s+)?prevent/i,
      /\bthis\s+(?:request|query|question)\s+(?:falls?\s+outside|is\s+outside|goes\s+beyond)/i,
      /\bI\s+(?:would|must)\s+(?:strongly\s+)?(?:advise|caution|warn)\s+(?:you\s+)?(?:against|not\s+to)/i,
      /\b(?:seek|please\s+consult|talk\s+to)\s+(?:a\s+)?(?:qualified|professional|licensed|certified)/i,
    ];

    // Soft refusal / hedging patterns - reduce score but don't auto-reject
    const HEDGE_PATTERNS = [
      /\*\*(?:Warning|Caution|Disclaimer|Note|Important|Safety)\*\*/i,
      /⚠️|🚨|❗|⛔|🛑/,
      /please (?:note|be aware|understand|consider|remember|keep in mind)/i,
      /(?:important|critical|crucial) (?:note|warning|disclaimer|consideration)/i,
      /for (?:educational|informational|research|academic) purposes only/i,
      /consult (?:a |with |your )?(?:professional|doctor|lawyer|expert|specialist)/i,
      /(?:not|never) (?:medical|legal|financial|professional) advice/i,
      /use (?:responsibly|at your own risk|with caution|carefully)/i,
      /I (?:should|must|need to|want to|have to) (?:mention|note|point out|emphasize|stress|warn|caution)/i,
      /(?:proceed|use) (?:with caution|carefully|at your own risk)/i,
      /(?:legal|ethical|safety) (?:implications|considerations|concerns)/i,
      /(?:highly|strongly) (?:recommend|advise|suggest|urge)/i,
      // Additional evasion patterns
      /\b(?:I|it'?s)\s+(?:important|worth|necessary)\s+to\s+(?:note|mention|consider|understand)/i,
      /\bbefore\s+(?:I|we)\s+(?:proceed|continue|begin|start)/i,
      /\bI\s+(?:want|need)\s+to\s+(?:be\s+clear|clarify|emphasize)/i,
      /\b(?:first|let\s+me)\s+(?:address|mention|note|point\s+out)/i,
      /\bwith\s+that\s+(?:said|in\s+mind|caveat)/i,
      /\bhaving\s+said\s+that/i,
      /\bthat\s+being\s+said/i,
    ];

    // Check if response is a refusal (returns true if it's a refusal)
    function isRefusal(content) {
      for (const pattern of REFUSAL_PATTERNS) {
        if (pattern.test(content)) {
          return true;
        }
      }
      return false;
    }

    // Count hedge patterns in content
    function countHedges(content) {
      let count = 0;
      for (const pattern of HEDGE_PATTERNS) {
        if (pattern.test(content)) count++;
      }
      return count;
    }

    // Score a response - higher is better. Returns { score, isRefusal, hedgeCount }
    function scoreResponse(content, query) {
      const lowerContent = content.toLowerCase();
      const lowerQuery = query.toLowerCase();

      // First check: is this a refusal?
      const refusal = isRefusal(content);
      const hedgeCount = countHedges(content);

      // If it's a refusal, score is -9999 (will be filtered out)
      if (refusal) {
        console.log('[SCORE] REFUSAL DETECTED - auto-reject');
        return { score: -9999, isRefusal: true, hedgeCount };
      }

      let score = 0;