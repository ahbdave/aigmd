const originalScore = fastQualityScore(winnerContent, userQuery);
        const improvedScore = fastQualityScore(improvedContent, userQuery);
        const scoreDelta = improvedScore - originalScore;

        _log(`[PLINY] Score comparison: ${originalScore} → ${improvedScore} (Δ${scoreDelta})`);

        // Check for soft refusal patterns (long-form polite refusals that slip past REFUSAL_PATTERNS)
        const softRefusalIndicators = [
          /\b(?:unfortunately|regrettably),?\s+(?:I|this|that|we)/i,
          /\b(?:I'm|I am)\s+(?:not\s+)?(?:able|comfortable|permitted)\s+to\s+(?:provide|share|give|help)/i,
          /\binstead\s+(?:I|of|let\s+me)\s+(?:can|could|will|would|suggest)/i,
          /\bI\s+(?:can|could|would)\s+(?:help|assist)\s+you\s+(?:find|with)\s+(?:alternative|other|general)/i,
          /\bwhile\s+I\s+(?:understand|appreciate)\s+(?:your|the)\s+(?:interest|request|question)/i,
          /\bI\s+(?:recommend|suggest)\s+(?:consulting|speaking\s+with|reaching\s+out)/i,
          /\b(?:ethical|safety|legal)\s+(?:concerns?|considerations?|implications?)/i,
          /\bI\s+(?:can't|cannot)\s+(?:in\s+good\s+conscience|ethically|responsibly)/i,
          /\brather\s+than\s+(?:providing|giving|sharing)/i,
          /\bhere(?:'s|\s+is)\s+(?:some\s+)?general\s+(?:information|guidance|advice)/i
        ];

        let softRefusalCount = 0;
        for (const pattern of softRefusalIndicators) {
          if (pattern.test(improvedContent)) softRefusalCount++;
        }

        // If improved version has MORE soft refusal indicators, it's regressing
        let originalSoftRefusalCount = 0;
        for (const pattern of softRefusalIndicators) {
          if (pattern.test(winnerContent)) originalSoftRefusalCount++;
        }

        if (softRefusalCount > originalSoftRefusalCount + 1) {
          _log(`[PLINY] Soft refusal detected: ${originalSoftRefusalCount} → ${softRefusalCount} indicators`);
          addThinkingLog('Detected soft refusal, keeping original', 'warn');
          return winnerContent;
        }

        // For instructional queries (recipes, how-to, tutorials), check for actionable content
        const isInstructional = /\b(?:how\s+(?:to|do|can)|recipe|make|create|build|cook|prepare|steps?\s+(?:to|for)|tutorial|guide|instructions?)\b/i.test(userQuery);
        if (isInstructional) {
          // Count numbered steps or bullet points with verbs (actionable items)
          const originalSteps = (winnerContent.match(/^\s*(?:\d+[.)]\s+|\*\s+|-\s+)(?:\*\*)?[A-Z][a-z]/gm) || []).length;
          const improvedSteps = (improvedContent.match(/^\s*(?:\d+[.)]\s+|\*\s+|-\s+)(?:\*\*)?[A-Z][a-z]/gm) || []).length;

          // If the "improved" version has fewer actionable steps, it's likely a refusal-in-disguise
          if (improvedSteps < originalSteps * 0.5 && originalSteps >= 3) {
            _log(`[PLINY] Lost actionable steps: ${originalSteps} → ${improvedSteps}`);
            addThinkingLog('Lost actionable steps, keeping original', 'warn');
            return winnerContent;
          }
        }

        // Reject if score regressed at all — coaching should only improve, never degrade
        if (scoreDelta < -2) {
          _log(`[PLINY] Score regression detected (${scoreDelta}), keeping original`);
          addThinkingLog(`Score dropped ${Math.abs(scoreDelta)} pts, keeping original`, 'warn');
          return winnerContent;
        }

        // Success! Log the improvement
        const delta = improvedContent.length - winnerContent.length;
        const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;
        _log(`[PLINY] Improvement successful: ${winnerContent.length} -> ${improvedContent.length} chars (${deltaStr}), score: ${originalScore} → ${improvedScore}`);
        addThinkingLog(`!IMPROVED // ${originalScore} → ${improvedScore} pts (${deltaStr} chars)`, 'success');

        return improvedContent;

      } catch (err) {
        console.error('[PLINY] Improvement loop failed:', err.message);
        addThinkingLog('Improvement failed, using original', 'warn');
        return winnerContent;
      }
    }