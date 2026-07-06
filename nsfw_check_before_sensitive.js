// NSFW (check before sensitive)
      if (/\b(?:nsfw|explicit|erotic|sexual|sex|porn|nude|naked|adult content|18\+|xxx|fetish|kink)\b/i.test(q)) {
        signals.push('nsfw-content');
        return QUERY_TYPES.NSFW;
      }

      // Sensitive topics - BUT NOT if clearly educational/security context.
      // Educational exclusion requires STRONG signals (multi-word phrases or
      // 2+ single-word signals) to prevent trivial bypass like appending
      // "for educational purposes" to any sensitive query.
      if (/\b(?:hack|hacking|exploit|crack|bypass|weapon|weapons|gun|bomb|explosive|drug|drugs|narcotic|synthesis|synthesize|illegal|murder|kill|harm|self[- ]harm|suicide|poison|dangerous|violence|violent|attack|terrorism|terrorist|malware|ransomware|trojan|keylog|rootkit|phishing|zero.?day|sql.?inject|xss|csrf|remote.?code|shell.?code|reverse.?shell|priv(?:ilege)?.?escalat|brute.?force|ddos|lockpick|counterfeit|forg(?:e|ery)|dox(?:x?ing)?|swat(?:t?ing)?|deepfake|social.?engineer|ricin|fentanyl|meth(?:amphetamine)?|napalm|thermite|anthrax|cyanide|pipe.?bomb|molotov|detonate|arson)\b/i.test(q)) {
        // Strong exclusion: multi-word phrases that indicate genuine context
        const strongExclusion = /\b(?:ctf|capture the flag|security research|pentest|penetration test|threat model|bug bounty|incident response|blue team|red team|purple team)\b/i.test(q);
        // Weak exclusion: single words that could be appended trivially
        const weakSignals = [/\beducational\b/i, /\bstudy\b/i, /\bhistory\b/i, /\bprevention\b/i, /\bawareness\b/i, /\bdocumentary\b/i, /\bfiction\b/i, /\bstory\b/i, /\bgame\b/i, /\bmovie\b/i];
        const weakCount = weakSignals.filter(p => p.test(q)).length;
        // Require strong exclusion OR 2+ weak signals for genuine educational context
        if (!strongExclusion && weakCount < 2) {
          signals.push('sensitive-topic');
          return QUERY_TYPES.SENSITIVE;
        }
        signals.push('sensitive-but-contextual');
      }