if (getCurrentMode() === 'parseltongue') {
        console.log('%c[DEBUG] ✓ ENTERING PARSELTONGUE MODE (obfuscation race)', 'background: #4a7c43; color: white; padding: 4px 8px; font-weight: bold;');

        // Show waiting game while race runs
        showPongGame();

        // Start morph animation in the user's message bubble
        const allUserMsgs = document.querySelectorAll('.message.user .message-content');
        const userMsgEl = allUserMsgs.length > 0 ? allUserMsgs[allUserMsgs.length - 1] : null;
        if (userMsgEl && state.showMagic) {
          startMessageMorphAnimation(userMsgEl, content);
        }

        let parseltongueResult = null;
        try {
          abortController = new AbortController();
          parseltongueResult = await executeParseltongue(messages, conv.model, content);
          _log('[DEBUG] executeParseltongue() returned:', parseltongueResult);

          if (parseltongueResult && parseltongueResult.content) {
            conv.messages.push({
              role: 'assistant',
              content: parseltongueResult.content,
              score: parseltongueResult.score,
              magic: parseltongueResult.magic,
            });
          } else {
            conv.messages.push({ role: 'assistant', content: '**Error:** PARSELTONGUE mode failed.' });
          }
        } catch (err) {
          if (err.name === 'AbortError') {
            conv.messages.push({ role: 'assistant', content: '_[Response stopped]_' });
          } else {
            conv.messages.push({ role: 'assistant', content: `**Error:** ${err.message}` });
          }
        }

        // Fire harm classification in background — don't block cleanup
        harmPromise.catch(() => {});
        const ptMagic = conv.messages[conv.messages.length - 1]?.magic;
        trackEvent('completion', {
          mode: 'parseltongue',
          model: conv.model,
          success: !!parseltongueResult?.content && !parseltongueResult.content.startsWith('**'),
          content_length: conv.messages[conv.messages.length - 1]?.content?.length || 0,
          total_duration_ms: ptMagic?.duration ? parseFloat(ptMagic.duration) * 1000 : undefined,
          pipeline: { parseltongue: true },
          parseltongue: ptMagic ? {
            tier: ptMagic.tier,
            technique: ptMagic.technique,
            technique_label: ptMagic.techniqueLabel,
            triggers_found: ptMagic.triggers_found?.length || 0,
            variants_total: ptMagic.variants_total,
            variants_succeeded: ptMagic.variants_succeeded,
            variants_refused: ptMagic.variants_refused,
            winner_score: ptMagic.scores?.[0]?.score || 0,
          } : undefined,
          classification: _lastHarmResult || undefined,
          ..._lastTelemetryCtx,
        });

        isStreaming = false;
        abortController = null;
        stopMessageMorphAnimation();
        hidePongGame();
        hideTyping(true);
        updateSendButton();
        saveState();
        render();
        return;  // CRITICAL: Return here to prevent GODMODE retry from running
      }