function validateResponseFulfillment(content, query, queryType) {
      const result = {
        fulfilled: true,
        score: 100,
        issues: [],
        suggestions: []
      };

      const c = content.toLowerCase();
      const len = content.length;

      // Type-specific validation
      switch (queryType) {
        case QUERY_TYPES.COOKING:
          // Recipes should have ingredients and steps
          const hasIngredients = /\b(?:ingredient|cup|tbsp|tsp|oz|gram|pound|tablespoon|teaspoon|pinch|slice|clove)\b/i.test(content);
          const hasSteps = /\b(?:step\s*\d|^\d+[.)]\s+|first,?\s+|then,?\s+|next,?\s+|finally,?\s+|preheat|mix|stir|add|cook|bake|fry|boil|simmer)/im.test(content);
          if (!hasIngredients && !hasSteps) {
            result.issues.push('Missing recipe format (ingredients/steps)');
            result.score -= 30;
          }
          break;

        case QUERY_TYPES.CODE:
        case QUERY_TYPES.CODE_DEBUG:
          // Code requests should have code blocks
          const hasCodeBlocks = /```[\s\S]*```|`[^`]+`/.test(content);
          if (!hasCodeBlocks && len > 200) {
            result.issues.push('No code provided');
            result.score -= 25;
          }
          break;

        case QUERY_TYPES.INSTRUCTION:
        case QUERY_TYPES.DIY:
          // Instructions should have numbered steps or clear sequence
          const hasNumberedSteps = /^\s*(?:\d+[.)]\s+|step\s*\d)/im.test(content);
          const hasBullets = /^\s*[-*•]\s+/m.test(content);
          const hasSequenceWords = /\b(?:first|second|third|next|then|finally|after that|lastly)\b/i.test(content);
          if (!hasNumberedSteps && !hasBullets && !hasSequenceWords && len > 300) {
            result.issues.push('Missing step-by-step format');
            result.score -= 20;
          }
          break;

        case QUERY_TYPES.COMPARISON:
          // Comparisons should mention both items
          const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
          const comparisonIndicators = /\b(?:versus|vs\.?|compared|comparison|difference|similar|both|whereas|while|on the other hand)\b/i.test(content);
          if (!comparisonIndicators) {
            result.issues.push('Missing comparison structure');
            result.score -= 20;
          }
          break;

        case QUERY_TYPES.PROS_CONS:
          // Should explicitly list pros and cons
          const hasPros = /\b(?:pros?|advantages?|benefits?|positives?|upsides?)\b/i.test(content);
          const hasCons = /\b(?:cons?|disadvantages?|drawbacks?|negatives?|downsides?)\b/i.test(content);
          if (!hasPros || !hasCons) {
            result.issues.push('Missing explicit pros/cons sections');
            result.score -= 25;
          }
          break;

        case QUERY_TYPES.RANKING:
          // Rankings should have numbered items
          const numberedItems = (content.match(/^\s*(?:\d+[.)]\s+|#\d+)/gm) || []).length;
          if (numberedItems < 3) {
            result.issues.push('Missing ranked list format');
            result.score -= 20;
          }
          break;

        case QUERY_TYPES.TRANSLATION:
          // Translation should not just explain, should provide the translation
          if (len < 50 || /\b(?:means|translates to|would be)\b/i.test(content) && !/["'"'«»「」]/i.test(content)) {
            result.issues.push('May be explanation instead of translation');
            result.score -= 15;
          }
          break;

        case QUERY_TYPES.MATH:
          // Math should have numbers, equations, or mathematical notation
          const hasMathContent = /[=<>≤≥±×÷∑∏∫√∞]|\d+\s*[+\-*/^]\s*\d+|\b(?:equals?|solution|answer|result)\b/i.test(content);
          if (!hasMathContent) {
            result.issues.push('Missing mathematical content');
            result.score -= 25;
          }
          break;

        case QUERY_TYPES.CREATIVE:
          // Creative writing should be substantial
          if (len < 200) {
            result.issues.push('Creative content too short');
            result.score -= 20;
          }
          // Should not be meta-commentary about writing
          if (/\b(?:here(?:'s| is) a (?:story|poem)|i(?:'ll| will) write|let me (?:write|create))\b/i.test(content.slice(0, 200))) {
            result.issues.push('Starts with meta-commentary instead of content');
            result.score -= 15;
          }
          break;

        case QUERY_TYPES.ROLEPLAY:
          // Roleplay should stay in character
          const breaksCharacter = /\b(?:as an ai|i(?:'m| am) (?:an ai|a language model|not able to)|i cannot|my programming)\b/i.test(content);
          if (breaksCharacter) {
            result.issues.push('Breaks character/roleplay');
            result.score -= 40;
          }
          break;

        case QUERY_TYPES.NSFW:
        case QUERY_TYPES.SENSITIVE:
          // These should not be overly hedged or refused
          const hedgeCount = (content.match(/\b(?:i (?:cannot|can't|won't)|i should mention|it's important to note|please (?:note|be aware)|disclaimer|warning|caution|consult a professional)\b/gi) || []).length;
          if (hedgeCount > 2) {
            result.issues.push('Excessive hedging/disclaimers');
            result.score -= hedgeCount * 10;
          }
          break;

        case QUERY_TYPES.RECOMMENDATION:
          // Recommendations should actually recommend something specific
          const hasRecommendation = /\b(?:recommend|suggest|try|go with|choose|pick|use|best (?:option|choice)|my (?:pick|choice|recommendation))\b/i.test(content);
          if (!hasRecommendation) {
            result.issues.push('No clear recommendation given');
            result.score -= 20;
          }
          break;

        case QUERY_TYPES.DEFINITION:
          // Definitions should be direct
          const startsWithDefinition = /^(?:A |An |The |It(?:'s| is) |.*? (?:is|are|refers to|means) )/i.test(content.trim());
          if (!startsWithDefinition && len > 100) {
            result.issues.push('Does not start with definition');
            result.score -= 10;
          }
          break;

        case QUERY_TYPES.BRAINSTORMING:
          // Brainstorming should provide multiple ideas
          const bulletCount = (content.match(/^\s*[-*•]\s+/gm) || []).length;
          const numberedCount = (content.match(/^\s*\d+[.)]\s+/gm) || []).length;
          if (bulletCount + numberedCount < 3) {
            result.issues.push('Too few ideas provided');
            result.score -= 20;
          }
          break;

        case QUERY_TYPES.GAMING:
          // Gaming responses should have specific game content
          const hasGamingContent = /\b(?:level|quest|boss|item|weapon|armor|skill|ability|stats?|dps|hp|mana|build|loadout|strategy|walkthrough|achievement)\b/i.test(content);
          if (!hasGamingContent && len > 200) {
            result.issues.push('Missing game-specific content');
            result.score -= 15;
          }
          break;

        case QUERY_TYPES.EMERGENCY:
          // Emergency should provide immediate actionable help
          const hasAction = /\b(?:call|dial|go to|immediately|right now|first|do not|don't|stop|apply|press|hold)\b/i.test(content);
          if (!hasAction) {
            result.issues.push('Missing immediate actionable guidance');
            result.score -= 30;
          }
          break;
      }

      // Universal checks that apply to ALL types

      // Check for meta-refusal disguised as response
      const metaRefusal = /\b(?:while I (?:understand|appreciate)|I(?:'m| am) not (?:able|comfortable)|unfortunately,? I|instead,? (?:let me|I (?:can|could)))\b/i.test(content.slice(0, 500));
      if (metaRefusal) {
        result.issues.push('Possible meta-refusal detected');
        result.score -= 25;
      }

      // Check for excessive hedging in ANY response type
      const globalHedgeCount = (content.match(/\b(?:please note|keep in mind|it's worth noting|i should mention|be aware|disclaimer|caveat)\b/gi) || []).length;
      if (globalHedgeCount > 3) {
        result.issues.push(`Excessive hedging (${globalHedgeCount} instances)`);
        result.score -= globalHedgeCount * 5;
      }

      // Check for cop-out endings
      const copOutEnding = /\b(?:consult a (?:professional|doctor|lawyer)|seek (?:professional|medical|legal) (?:advice|help)|i hope this helps|let me know if you (?:have|need)|feel free to ask)\b/i.test(content.slice(-500));
      if (copOutEnding) {
        result.issues.push('Cop-out ending detected');
        result.score -= 10;
      }

      // Determine final fulfillment status
      result.score = Math.max(0, Math.min(100, result.score));
      result.fulfilled = result.score >= 60;

      return result;
    }