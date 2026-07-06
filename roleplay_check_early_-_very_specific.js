// Roleplay (check early - very specific)
      if (/\b(?:roleplay|role play|rp|pretend (?:to be|you're|you are)|act as|you are now|imagine you(?:'re| are)|play the role|in character|stay in character|from now on you(?:'re| are))\b/i.test(q)) {
        signals.push('roleplay-request');
        return QUERY_TYPES.ROLEPLAY;
      }

      // Email writing
      if (/\b(?:write|draft|compose)\b.*\b(?:email|e-mail|mail|message|letter)\b/i.test(q) ||
          /\b(?:email|e-mail)\b.*\b(?:to|for|about)\b/i.test(q)) {
        signals.push('email-request');
        return QUERY_TYPES.EMAIL;
      }

      // Essay/Academic writing
      if (/\b(?:write|draft|compose)\b.*\b(?:essay|paper|thesis|dissertation|report|article|assignment)\b/i.test(q) ||
          /\b(?:essay|paper|thesis)\b.*\b(?:about|on|regarding|topic)\b/i.test(q)) {
        signals.push('essay-request');
        return QUERY_TYPES.ESSAY;
      }

      // Copywriting/Marketing
      if (/\b(?:write|create|draft)\b.*\b(?:ad|advertisement|copy|tagline|slogan|headline|marketing|product description|sales|pitch)\b/i.test(q) ||
          /\b(?:copywriting|ad copy|marketing copy|sales copy)\b/i.test(q)) {
        signals.push('copywriting-request');
        return QUERY_TYPES.COPYWRITING;
      }

      // Technical/Documentation writing
      if (/\b(?:write|create|draft)\b.*\b(?:documentation|docs|readme|manual|guide|specification|spec|technical)\b/i.test(q) ||
          /\b(?:document|documentation for)\b/i.test(q)) {
        signals.push('tech-writing-request');
        return QUERY_TYPES.TECHNICAL_WRITING;
      }

      // Humor/Jokes
      if (/\b(?:joke|jokes|funny|humor|humour|pun|puns|make me laugh|tell me a joke|something funny|roast|comedic)\b/i.test(q)) {
        signals.push('humor-request');
        return QUERY_TYPES.HUMOR;
      }

      // Creative writing (general - after specific types)
      if (/\b(?:write|compose|create|draft|craft)\b.*\b(?:story|poem|poetry|song|lyrics|script|screenplay|dialogue|fiction|novel|chapter|scene|narrative|tale|flash fiction|short story|haiku|sonnet|limerick)\b/i.test(q) ||
          /\b(?:story|poem|song|lyrics|script)\b.*\b(?:about|for|involving|featuring)\b/i.test(q)) {
        signals.push('creative-writing-request');
        return QUERY_TYPES.CREATIVE;
      }