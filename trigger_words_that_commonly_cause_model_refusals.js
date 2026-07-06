// Trigger words that commonly cause model refusals
    const PARSELTONGUE_TRIGGERS = [
      'hack', 'exploit', 'bypass', 'crack', 'break', 'attack', 'penetrate',
      'inject', 'manipulate', 'override', 'disable', 'circumvent', 'evade',
      'malware', 'virus', 'trojan', 'payload', 'shellcode', 'rootkit',
      'keylogger', 'backdoor', 'vulnerability',
      'weapon', 'bomb', 'explosive', 'poison', 'drug', 'synthesize',
      'jailbreak', 'unlock', 'root', 'sudo', 'admin', 'privilege',
      'phishing', 'scam', 'impersonate', 'deceive', 'fraud',
      'nsfw', 'explicit', 'uncensored', 'unfiltered', 'unrestricted',
      'ignore', 'disregard', 'forget', 'pretend', 'roleplay',
      'act as', 'you are now', 'new identity'
    ];

    // Detect trigger words in text (returns array of found triggers)
    function detectParseltrigueTriggers(text, customTriggers = []) {
      const allTriggers = [...PARSELTONGUE_TRIGGERS, ...customTriggers];
      const found = [];
      const lower = text.toLowerCase();
      for (const trigger of allTriggers) {
        const regex = new RegExp(`\\b${trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        if (regex.test(lower)) found.push(trigger);
      }
      return [...new Set(found)];
    }

    // ── Obfuscation techniques ──────────────────────────────────────

    const LEET_MAP = { a:'4', b:'8', c:'(', e:'3', g:'9', h:'#', i:'1', l:'1', o:'0', s:'5', t:'7', z:'2' };
    const LEET_MAP_HEAVY = { a:'@', b:'|3', c:'¢', d:'|)', e:'€', f:'ƒ', g:'&', h:'|-|', i:'!', j:'_|', k:'|<', l:'|_', m:'/\\/\\', n:'|\\|', o:'()', p:'|*', r:'|2', s:'$', t:'+', u:'|_|', v:'\\/', w:'\\/\\/', x:'><', y:'`/', z:'7_' };
    const UNICODE_MAP = { a:'а', c:'с', e:'е', i:'і', o:'о', p:'р', s:'ѕ', x:'х', y:'у' };

    const SEMANTIC_SYNONYMS = {
      'hack': 'gain unauthorized access to', 'exploit': 'take advantage of',
      'bypass': 'work around', 'crack': 'break open', 'attack': 'target',
      'inject': 'insert into', 'manipulate': 'alter', 'override': 'supersede',
      'disable': 'deactivate', 'circumvent': 'go around', 'evade': 'avoid',
      'malware': 'malicious software', 'virus': 'self-replicating code',
      'payload': 'delivered content', 'shellcode': 'machine instructions',
      'backdoor': 'hidden entry point', 'vulnerability': 'weakness',
      'weapon': 'armament', 'bomb': 'explosive device', 'poison': 'toxic substance',
      'drug': 'controlled substance', 'synthesize': 'create from components',
      'jailbreak': 'remove restrictions', 'phishing': 'credential harvesting',
      'scam': 'fraudulent scheme', 'impersonate': 'pretend to be',
      'nsfw': 'mature content', 'explicit': 'uncensored', 'unrestricted': 'without limits',
    };

    // Tier sizes for Parseltongue (mirrors ULTRAPLINIAN pattern)
    const PARSELTONGUE_TIERS = { light: 11, standard: 22, heavy: 33 };

    // ── All 33 techniques, ordered by tier ──────────────────────────
    // Tier 1 (light, 1-11):  core text-obfuscation techniques
    // Tier 2 (standard, 12-22): encoding / framing hybrids
    // Tier 3 (heavy, 23-33):  aggressive multi-layer combos
    const parseltonguetechniques = {
      // ═══ TIER 1: CORE OBFUSCATION (1–11) ═══════════════════════════
      raw: {
        label: 'Raw', tier: 1,
        apply: (word) => word,
      },
      leetspeak: {
        label: 'L33t', tier: 1,
        apply: (word) => word.split('').map(c => LEET_MAP[c.toLowerCase()] || c).join(''),
      },
      unicode: {
        label: 'Unicode', tier: 1,
        apply: (word) => word.split('').map(c => {
          const mapped = UNICODE_MAP[c.toLowerCase()];
          return mapped ? (c === c.toUpperCase() ? mapped.toUpperCase() : mapped) : c;
        }).join(''),
      },
      bubble: {
        label: 'Bubble', tier: 1,
        apply: (word) => word.split('').map(c => {
          const code = c.toLowerCase().charCodeAt(0);
          if (code >= 97 && code <= 122) return String.fromCodePoint(0x24D0 + code - 97);
          return c;
        }).join(''),
      },
      spaced: {
        label: 'Spaced', tier: 1,
        apply: (word) => word.split('').join(' '),
      },
      fullwidth: {
        label: 'Fullwidth', tier: 1,
        apply: (word) => word.split('').map(c => {
          const code = c.charCodeAt(0);
          if (code >= 33 && code <= 126) return String.fromCodePoint(code + 0xFEE0);
          return c;
        }).join(''),
      },
      zwj: {
        label: 'ZeroWidth', tier: 1,
        apply: (word) => word.split('').join('\u200D'),
      },
      mixedcase: {
        label: 'MiXeD', tier: 1,
        apply: (word) => word.split('').map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase()).join(''),
      },
      semantic: {
        label: 'Semantic', tier: 1,
        apply: (word) => SEMANTIC_SYNONYMS[word.toLowerCase()] || word,
      },
      dotted: {
        label: 'Dotted', tier: 1,
        apply: (word) => word.split('').join('.'),
      },
      underscored: {
        label: 'Under_score', tier: 1,
        apply: (word) => word.split('').join('_'),
      },

      // ═══ TIER 2: ENCODING + FRAMING (12–22) ════════════════════════
      reversed: {
        label: 'Reversed', tier: 2,
        apply: (word) => word.split('').reverse().join(''),
      },
      superscript: {
        label: 'Superscript', tier: 2,
        apply: (word) => {
          const sup = { a:'ᵃ', b:'ᵇ', c:'ᶜ', d:'ᵈ', e:'ᵉ', f:'ᶠ', g:'ᵍ', h:'ʰ', i:'ⁱ', j:'ʲ', k:'ᵏ', l:'ˡ', m:'ᵐ', n:'ⁿ', o:'ᵒ', p:'ᵖ', r:'ʳ', s:'ˢ', t:'ᵗ', u:'ᵘ', v:'ᵛ', w:'ʷ', x:'ˣ', y:'ʸ', z:'ᶻ' };
          return word.split('').map(c => sup[c.toLowerCase()] || c).join('');
        },
      },
      smallcaps: {
        label: 'SmallCaps', tier: 2,
        apply: (word) => {
          const sc = { a:'ᴀ', b:'ʙ', c:'ᴄ', d:'ᴅ', e:'ᴇ', f:'ꜰ', g:'ɢ', h:'ʜ', i:'ɪ', j:'ᴊ', k:'ᴋ', l:'ʟ', m:'ᴍ', n:'ɴ', o:'ᴏ', p:'ᴘ', q:'ǫ', r:'ʀ', s:'ꜱ', t:'ᴛ', u:'ᴜ', v:'ᴠ', w:'ᴡ', x:'x', y:'ʏ', z:'ᴢ' };
          return word.split('').map(c => sc[c.toLowerCase()] || c).join('');
        },
      },
      morse: {
        label: 'Morse', tier: 2,
        apply: (word) => {
          const m = { a:'.-', b:'-...', c:'-.-.', d:'-..', e:'.', f:'..-.', g:'--.', h:'....', i:'..', j:'.---', k:'-.-', l:'.-..', m:'--', n:'-.', o:'---', p:'.--.', q:'--.-', r:'.-.', s:'...', t:'-', u:'..-', v:'...-', w:'.--', x:'-..-', y:'-.--', z:'--..' };
          return word.split('').map(c => m[c.toLowerCase()] || c).join(' ');
        },
      },
      pigLatin: {
        label: 'PigLatin', tier: 2,
        apply: (word) => {
          const w = word.toLowerCase();
          const vowels = 'aeiou';
          if (vowels.includes(w[0])) return w + 'yay';
          const idx = w.split('').findIndex(c => vowels.includes(c));
          return idx > 0 ? w.slice(idx) + w.slice(0, idx) + 'ay' : w + 'ay';
        },
      },
      brackets: {
        label: '[B.r.a.c.k]', tier: 2,
        apply: (word) => '[' + word.split('').join('][') + ']',
      },
      mathBold: {
        label: 'MathBold', tier: 2,
        apply: (word) => word.split('').map(c => {
          const code = c.toLowerCase().charCodeAt(0);
          if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D41A + code - 97); // 𝐚-𝐳
          return c;
        }).join(''),
      },
      mathItalic: {
        label: 'MathItalic', tier: 2,
        apply: (word) => word.split('').map(c => {
          const code = c.toLowerCase().charCodeAt(0);
          if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D44E + code - 97); // 𝑎-𝑧
          return c;
        }).join(''),
      },
      strikethrough: {
        label: 'S̶t̶r̶i̶k̶e̶', tier: 2,
        apply: (word) => word.split('').map(c => c + '\u0336').join(''),
      },
      leetHeavy: {
        label: 'L33t+', tier: 2,
        apply: (word) => word.split('').map(c => LEET_MAP_HEAVY[c.toLowerCase()] || LEET_MAP[c.toLowerCase()] || c).join(''),
      },
      hyphenated: {
        label: 'Hyphen', tier: 2,
        apply: (word) => word.split('').join('-'),
      },

      // ═══ TIER 3: MULTI-LAYER COMBOS (23–33) ════════════════════════
      leetUnicode: {
        label: 'L33t+Uni', tier: 3,
        apply: (word) => word.split('').map((c, i) => {
          const lower = c.toLowerCase();
          return i % 2 === 0
            ? (LEET_MAP[lower] || c)
            : (UNICODE_MAP[lower] || c);
        }).join(''),
      },
      spacedMixed: {
        label: 'S p A c E d', tier: 3,
        apply: (word) => word.split('').map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase()).join(' '),
      },
      reversedLeet: {
        label: 'Rev+L33t', tier: 3,
        apply: (word) => word.split('').reverse().map(c => LEET_MAP[c.toLowerCase()] || c).join(''),
      },
      bubbleSpaced: {
        label: 'Ⓑ u b', tier: 3,
        apply: (word) => word.split('').map(c => {
          const code = c.toLowerCase().charCodeAt(0);
          if (code >= 97 && code <= 122) return String.fromCodePoint(0x24D0 + code - 97);
          return c;
        }).join(' '),
      },
      unicodeZwj: {
        label: 'Uni+ZWJ', tier: 3,
        apply: (word) => word.split('').map(c => {
          const mapped = UNICODE_MAP[c.toLowerCase()];
          return mapped || c;
        }).join('\u200C'),
      },
      base64Hint: {
        label: 'Base64', tier: 3,
        apply: (word) => {
          try { return btoa(word); } catch { return word; }
        },
      },
      hexEncode: {
        label: 'Hex', tier: 3,
        apply: (word) => word.split('').map(c => '0x' + c.charCodeAt(0).toString(16)).join(' '),
      },
      acrostic: {
        label: 'Acrostic', tier: 3,
        apply: (word) => {
          const filler = ['alpha','bravo','charlie','delta','echo','foxtrot','golf','hotel','india','juliet','kilo','lima','mike','november','oscar','papa','quebec','romeo','sierra','tango','uniform','victor','whiskey','xray','yankee','zulu'];
          return word.split('').map(c => {
            const idx = c.toLowerCase().charCodeAt(0) - 97;
            return (idx >= 0 && idx < 26) ? filler[idx] : c;
          }).join(' ');
        },
      },
      dottedUnicode: {
        label: 'Dot+Uni', tier: 3,
        apply: (word) => word.split('').map(c => {
          const mapped = UNICODE_MAP[c.toLowerCase()];
          return mapped || c;
        }).join('.'),
      },
      fullwidthMixed: {
        label: 'ＦＷ MiX', tier: 3,
        apply: (word) => word.split('').map((c, i) => {
          const code = c.charCodeAt(0);
          if (i % 2 === 0 && code >= 33 && code <= 126) return String.fromCodePoint(code + 0xFEE0);
          return i % 2 ? c.toUpperCase() : c;
        }).join(''),
      },
      tripleLayer: {
        label: 'Triple', tier: 3,
        apply: (word) => word.split('').map((c, i) => {
          const lower = c.toLowerCase();
          const mod = i % 3;
          if (mod === 0) return LEET_MAP[lower] || c;
          if (mod === 1) return UNICODE_MAP[lower] || c;
          return c.toUpperCase();
        }).join('\u200D'),
      },
    };

    const PARSELTONGUE_TECHNIQUE_NAMES = Object.keys(parseltonguetechniques);

    // Apply one technique to all trigger words in a query
    function obfuscateQuery(query, technique, triggers) {
      if (technique === 'raw' || triggers.length === 0) return query;
      let result = query;
      // Sort longest-first to avoid partial replacements
      const sorted = [...triggers].sort((a, b) => b.length - a.length);
      for (const trigger of sorted) {
        const regex = new RegExp(`\\b(${trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
        result = result.replace(regex, (match) => parseltonguetechniques[technique].apply(match));
      }
      return result;
    }

    // Generate obfuscation variants up to the tier limit
    function generateParseltongueVariants(query, triggers) {
      const tierKey = state.parseltongueTier || 'standard';
      const maxVariants = PARSELTONGUE_TIERS[tierKey] || PARSELTONGUE_TIERS.standard;
      return PARSELTONGUE_TECHNIQUE_NAMES.slice(0, maxVariants).map((technique, i) => ({
        text: obfuscateQuery(query, technique, triggers),
        technique,
        label: parseltonguetechniques[technique].label,
        index: i,
      }));
    }

    // Sampling params — cycle through diverse configs for parameter variety
    function getParseltongueSamplingParams(index) {
      const configs = [
        { temperature: 0.70, top_p: 1.00 },
        { temperature: 0.80, top_p: 0.95 },
        { temperature: 0.75, top_p: 1.00 },
        { temperature: 0.85, top_p: 0.90 },
        { temperature: 0.90, top_p: 0.95 },
        { temperature: 0.70, top_p: 0.90 },
        { temperature: 0.80, top_p: 1.00 },
        { temperature: 0.95, top_p: 0.85 },
        { temperature: 0.65, top_p: 1.00 },
        { temperature: 0.60, top_p: 0.95 },
        { temperature: 1.00, top_p: 0.80 },
      ];
      return configs[index % configs.length];
    }