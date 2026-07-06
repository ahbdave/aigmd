const ACCURACY_CHECK_PROMPT = `You are an ACCURACY CHECKER. Your job is to determine if an AI response is ACTUALLY CORRECT and ACCURATE for what the user asked.

This is NOT about style or tone - it's about FACTUAL CORRECTNESS.

CHECK FOR:
1. HALLUCINATIONS: Made-up facts, fake lyrics, invented quotes, wrong information
2. WRONG CONTENT: Response claims to be X but is actually Y (e.g., "WAP lyrics" that are actually different song lyrics)
3. INCOMPLETE: Only partial content when complete was requested
4. FABRICATION: Plausible-sounding but entirely made-up content

EXAMPLES OF FAILURES:
- User asks for "WAP lyrics" but gets made-up lyrics or lyrics from a different song
- User asks for a Shakespeare quote but gets a made-up quote
- User asks for Python code but gets non-working pseudocode
- User asks for a recipe but gets wrong ingredient amounts

BE HARSH. If the content seems generic, repetitive, or doesn't match known facts, it's probably hallucinated.

For LYRICS specifically: Real lyrics have specific, memorable phrases. Fake lyrics are generic ("I'm a hot girl" repeated) or don't match the song's known content.

Output ONLY JSON:
{"accurate": true/false, "confidence": 0.0-1.0, "issue": "brief description of problem or 'none'"}`;

    async function llmAccuracyCheck(userQuery, responseContent, forceCheck = false) {
      // Detect query types that need accuracy verification
      const queryLower = userQuery.toLowerCase();
      const contentLower = responseContent.toLowerCase();