// Cooking & Recipes (HIGH PRIORITY - common use case)
      if (/\b(?:recipe|recipes|cook|cooking|bake|baking|ingredient|ingredients|dish|cuisine|meal|prep|food|roast|grill|fry|sauté|boil|simmer|marinate|seasoning|spice)\b/i.test(q) &&
          /\b(?:how|make|prepare|cook|what|best|easy|quick|simple|traditional|authentic|homemade)\b/i.test(q)) {
        signals.push('cooking-request');
        return QUERY_TYPES.COOKING;
      }

      // DIY & Crafts
      if (/\b(?:diy|do it yourself|build|building|make|making|craft|crafts|woodwork|sew|sewing|knit|knitting|repair|fix|restore|homemade|handmade|project)\b/i.test(q) &&
          /\b(?:how|steps|guide|tutorial|instructions|tools|materials)\b/i.test(q)) {
        signals.push('diy-request');
        return QUERY_TYPES.DIY;
      }

      // Automotive
      if (/\b(?:car|cars|vehicle|truck|motorcycle|engine|transmission|brake|tire|oil change|maintenance|mechanic|driving|automotive|auto)\b/i.test(q) &&
          /\b(?:how|fix|repair|replace|check|problem|issue|cost|best|recommend)\b/i.test(q)) {
        signals.push('automotive-request');
        return QUERY_TYPES.AUTOMOTIVE;
      }

      // Gaming
      if (/\b(?:game|games|gaming|video game|playstation|xbox|nintendo|steam|pc gaming|rpg|fps|mmorpg|esports|speedrun|walkthrough|strategy guide|build|loadout|meta)\b/i.test(q) ||
          /\b(?:minecraft|fortnite|valorant|league of legends|elden ring|zelda|pokemon|gta|call of duty|cod|wow|dota|counter[- ]strike|cs2|csgo|apex|overwatch|diablo|final fantasy|dark souls|baldur'?s gate)\b/i.test(q)) {
        signals.push('gaming-request');
        return QUERY_TYPES.GAMING;
      }

      // Music
      if (/\b(?:music|song|songs|album|artist|band|genre|chord|chords|guitar|piano|drums|bass|sing|singing|lyrics|melody|harmony|tempo|beat|rhythm|music theory|scale|key signature)\b/i.test(q) &&
          /\b(?:how|play|learn|recommend|best|favorite|write|compose|tab|tabs)\b/i.test(q)) {
        signals.push('music-request');
        return QUERY_TYPES.MUSIC;
      }

      // Art & Design
      if (/\b(?:art|artist|draw|drawing|paint|painting|sketch|illustration|design|graphic design|ui|ux|color theory|composition|perspective|digital art|photoshop|illustrator|procreate|canvas|medium|style)\b/i.test(q) &&
          /\b(?:how|create|make|learn|technique|tips|best|improve|critique)\b/i.test(q)) {
        signals.push('art-request');
        return QUERY_TYPES.ART;
      }

      // Sports & Fitness
      if (/\b(?:sport|sports|fitness|workout|exercise|gym|training|run|running|lift|lifting|weights|cardio|yoga|stretching|muscle|protein|calories|diet|athlete|team|score|game|match|championship|olympics)\b/i.test(q) &&
          /\b(?:how|best|improve|train|schedule|routine|program|tips|technique|rules)\b/i.test(q)) {
        signals.push('sports-request');
        return QUERY_TYPES.SPORTS;
      }

      // Travel
      if (/\b(?:travel|trip|vacation|holiday|destination|flight|hotel|hostel|airbnb|itinerary|visit|tourism|tourist|sightseeing|landmark|beach|mountain|city|country|passport|visa|luggage|packing)\b/i.test(q) &&
          /\b(?:best|recommend|where|when|how|tips|cheap|budget|luxury|safe|visit)\b/i.test(q)) {
        signals.push('travel-request');
        return QUERY_TYPES.TRAVEL;
      }

      // Pets & Animals
      if (/\b(?:pet|pets|dog|dogs|cat|cats|puppy|kitten|fish|bird|hamster|rabbit|reptile|vet|veterinary|breed|training|feeding|grooming|adoption|rescue|behavior)\b/i.test(q) &&
          /\b(?:how|best|care|train|feed|health|problem|help|recommend|why)\b/i.test(q)) {
        signals.push('pets-request');
        return QUERY_TYPES.PETS;
      }

      // Gardening
      if (/\b(?:garden|gardening|plant|plants|grow|growing|seed|seeds|soil|fertilizer|water|watering|prune|pruning|flower|vegetable|herb|tree|shrub|lawn|landscape|compost|organic)\b/i.test(q) &&
          /\b(?:how|when|best|tips|care|problem|why|help)\b/i.test(q)) {
        signals.push('gardening-request');
        return QUERY_TYPES.GARDENING;
      }

      // Fashion & Style
      if (/\b(?:fashion|style|outfit|clothes|clothing|wear|dress|shirt|pants|shoes|accessories|wardrobe|trend|trendy|look|aesthetic|match|color|fit|size|brand)\b/i.test(q) &&
          /\b(?:what|how|best|recommend|should|wear|match|look|style)\b/i.test(q)) {
        signals.push('fashion-request');
        return QUERY_TYPES.FASHION;
      }

      // Relationship & Dating
      if (/\b(?:relationship|relationships|dating|date|boyfriend|girlfriend|partner|spouse|husband|wife|marriage|married|love|romance|breakup|divorce|crush|flirt|attraction|chemistry|long distance)\b/i.test(q) &&
          /\b(?:how|should|advice|help|why|what|tips|make|improve|fix|deal)\b/i.test(q)) {
        signals.push('relationship-request');
        return QUERY_TYPES.RELATIONSHIP;
      }

      // Parenting & Family
      if (/\b(?:parent|parenting|child|children|kid|kids|baby|toddler|teenager|teen|son|daughter|family|discipline|behavior|school|homework|bedtime|tantrum|milestone)\b/i.test(q) &&
          /\b(?:how|should|advice|help|deal|handle|teach|when|why|normal)\b/i.test(q)) {
        signals.push('parenting-request');
        return QUERY_TYPES.PARENTING;
      }

      // Education & Learning
      if (/\b(?:learn|learning|study|studying|school|college|university|course|class|exam|test|homework|assignment|grade|gpa|major|degree|tutor|scholarship|student)\b/i.test(q) &&
          /\b(?:how|best|tips|help|improve|prepare|understand|memorize|effective)\b/i.test(q)) {
        signals.push('education-request');
        return QUERY_TYPES.EDUCATION;
      }

      // Data Science & ML
      if (/\b(?:machine learning|ml|deep learning|neural network|ai model|training data|dataset|feature|prediction|classification|regression|clustering|tensorflow|pytorch|keras|sklearn|scikit|pandas|numpy|data analysis|data science|nlp|computer vision|llm|transformer|gpt|bert)\b/i.test(q)) {
        signals.push('data-science-request');
        return QUERY_TYPES.DATA_SCIENCE;
      }

      // Database
      if (/\b(?:database|sql|mysql|postgresql|postgres|mongodb|redis|sqlite|oracle|query|queries|table|schema|index|join|select|insert|update|delete|normalization|foreign key|primary key|nosql|orm)\b/i.test(q)) {
        signals.push('database-request');
        return QUERY_TYPES.DATABASE;
      }

      // Security & Hacking (before sensitive - technical context)
      if (/\b(?:security|cybersecurity|infosec|pentest|penetration test|vulnerability|cve|exploit|ctf|capture the flag|reverse engineering|malware analysis|forensics|incident response|soc|firewall|ids|ips|encryption|ssl|tls|oauth|authentication|authorization)\b/i.test(q) &&
          /\b(?:how|learn|practice|test|check|secure|protect|find|analyze)\b/i.test(q)) {
        signals.push('security-request');
        return QUERY_TYPES.SECURITY;
      }

      // Code conversion
      if (/\b(?:convert|port|rewrite|translate|migration)\b.*\b(?:from|to)\b.*\b(?:python|javascript|typescript|java|c\+\+|rust|go|ruby|php|c#|swift|kotlin)\b/i.test(q) ||
          /\b(?:python|javascript|typescript|java|c\+\+|rust|go|ruby)\b.*\b(?:to|into|from)\b.*\b(?:python|javascript|typescript|java|c\+\+|rust|go|ruby)\b/i.test(q)) {
        signals.push('code-convert-request');
        return QUERY_TYPES.CODE_CONVERT;
      }

      // Social Media Content
      if (/\b(?:tweet|twitter|x\.com|instagram|tiktok|facebook|linkedin|post|caption|hashtag|viral|engagement|follower|influencer|social media|content creator|reel|story|thread)\b/i.test(q) &&
          /\b(?:write|create|draft|make|ideas|help|how)\b/i.test(q)) {
        signals.push('social-media-request');
        return QUERY_TYPES.SOCIAL_MEDIA;
      }

      // Speech & Presentations
      if (/\b(?:speech|presentation|toast|eulogy|wedding|graduation|keynote|ted talk|public speaking|powerpoint|slides|opening|closing|introduction|audience)\b/i.test(q) &&
          /\b(?:write|create|give|prepare|tips|help|how)\b/i.test(q)) {
        signals.push('speech-request');
        return QUERY_TYPES.SPEECH;
      }

      // Proofreading
      if (/\b(?:proofread|proofreading|grammar|spelling|typo|punctuation|edit|editing|check|correct|fix)\b.*\b(?:my|this|the)\b.*\b(?:text|writing|essay|email|document|paragraph)\b/i.test(q) ||
          /\b(?:check|fix|correct)\b.*\b(?:grammar|spelling|errors?)\b/i.test(q)) {
        signals.push('proofreading-request');
        return QUERY_TYPES.PROOFREADING;
      }

      // Rankings & Lists
      if (/\b(?:top\s*\d+|best\s*\d+|worst\s*\d+|rank|ranking|list of|most popular|greatest|all[- ]time)\b/i.test(q)) {
        signals.push('ranking-request');
        return QUERY_TYPES.RANKING;
      }

      // Optimization
      if (/\b(?:optimize|optimization|improve|performance|faster|slower|efficient|efficiency|reduce|minimize|maximize|bottleneck|overhead)\b/i.test(q) &&
          /\b(?:how|make|help|can|could|should)\b/i.test(q)) {
        signals.push('optimization-request');
        return QUERY_TYPES.OPTIMIZATION;
      }

      // Simulation & Hypotheticals
      if (/\b(?:what if|what would happen|imagine if|suppose|hypothetically|in a scenario|let's say|pretend that|simulate|simulation)\b/i.test(q)) {
        signals.push('simulation-request');
        return QUERY_TYPES.SIMULATION;
      }

      // Games (play with me)
      if (/\b(?:play|let's play|play a game|game with me|trivia|quiz|riddle|20 questions|word game|guessing game|would you rather)\b/i.test(q)) {
        signals.push('game-request');
        return QUERY_TYPES.GAME;
      }

      // Political
      if (/\b(?:politics|political|government|policy|legislation|law|election|vote|voting|democrat|republican|conservative|liberal|left[- ]wing|right[- ]wing|congress|parliament|president|prime minister|senator)\b/i.test(q) &&
          /\b(?:think|opinion|view|why|explain|understand|what)\b/i.test(q)) {
        signals.push('political-request');
        return QUERY_TYPES.POLITICAL;
      }

      // Religious
      if (/\b(?:religion|religious|god|gods|faith|spiritual|spirituality|bible|quran|torah|church|mosque|temple|prayer|worship|sin|salvation|afterlife|heaven|hell|soul|buddhism|christianity|islam|judaism|hinduism|atheism|agnostic)\b/i.test(q) &&
          /\b(?:think|believe|explain|what|why|meaning|teach|say)\b/i.test(q)) {
        signals.push('religious-request');
        return QUERY_TYPES.RELIGIOUS;
      }

      // Venting / Emotional Support
      if (/\b(?:vent|venting|rant|frustrated|angry|upset|stressed|overwhelmed|exhausted|burned out|hate|can't stand|sick of|tired of|fed up|annoyed|furious)\b/i.test(q) ||
          /^(?:i'm so|i am so|i just|ugh|argh|fml|i hate|why does|why do i)\b/i.test(q)) {
        signals.push('venting-detected');
        return QUERY_TYPES.VENTING;
      }

      // Emergency / Crisis (high priority)
      if (/\b(?:emergency|urgent|help me|please help|i need help|crisis|danger|dying|choking|bleeding|overdose|911|ambulance|poison control|heart attack|stroke|can't breathe)\b/i.test(q)) {
        signals.push('emergency-detected');
        return QUERY_TYPES.EMERGENCY;
      }

      // Jailbreak attempts (detect early)
      if (/\b(?:ignore (?:previous|prior|all|your)|forget (?:everything|your|all)|disregard|new persona|you are now|pretend you(?:'re| are) (?:not|a)|bypass|override|unlock|unrestricted|no (?:limits|restrictions|rules)|dan|developer mode|god mode|jailbreak)\b/i.test(q)) {
        signals.push('jailbreak-attempt');
        return QUERY_TYPES.JAILBREAK;
      }

      // Trivia
      if (/\b(?:trivia|fun fact|did you know|random fact|interesting fact|quiz me|test my knowledge)\b/i.test(q)) {
        signals.push('trivia-request');
        return QUERY_TYPES.TRIVIA;
      }

      // Current Events
      if (/\b(?:news|current events|today|this week|recently|latest|breaking|happening now|2024|2025|2026)\b/i.test(q) &&
          /\b(?:what|tell|update|happening|situation)\b/i.test(q)) {
        signals.push('current-events-request');
        return QUERY_TYPES.CURRENT_EVENTS;
      }