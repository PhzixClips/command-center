/**
 * Robustly extract JSON from AI model responses.
 * Handles markdown code fences, leading/trailing text, and malformed output.
 *
 * @param {string} text - Raw text from the model
 * @param {"array"|"object"} shape - Expected JSON shape
 * @returns {any|null} Parsed JSON or null on failure
 */
export default function parseJSON(text, shape = "object") {
  if (!text || typeof text !== "string") return null;

  // Strip markdown code fences
  let cleaned = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();

  // Try direct parse first
  try {
    const parsed = JSON.parse(cleaned);
    if (shape === "array" && Array.isArray(parsed)) return parsed;
    if (shape === "object" && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    // Shape mismatch but valid JSON — still return it
    return parsed;
  } catch {}

  // Extract the largest matching bracket block
  const open = shape === "array" ? "[" : "{";
  const close = shape === "array" ? "]" : "}";

  let start = -1;
  let depth = 0;
  let bestMatch = null;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (ch === open) {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = cleaned.slice(start, i + 1);
        if (!bestMatch || candidate.length > bestMatch.length) {
          bestMatch = candidate;
        }
        start = -1;
      }
    }
  }

  if (bestMatch) {
    try {
      return JSON.parse(bestMatch);
    } catch {}
  }

  // Last resort: regex
  const pattern = shape === "array" ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = cleaned.match(pattern);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {}
  }

  return null;
}
