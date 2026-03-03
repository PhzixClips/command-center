const GEMINI_KEY = "AIzaSyBBgUBXOTweNZievW3iM6tnI6hrxYjgiW8";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

export const gemini = async (system, userContent, maxTokens = 400, useSearch = false) => {
  const body = {
    contents: [{
      role: "user",
      // When using search grounding, system_instruction conflicts with the grounding tool.
      // Merge system prompt into user content instead so search requests work correctly.
      parts: [{ text: useSearch ? `${system}\n\n${userContent}` : userContent }],
    }],
    generationConfig: { maxOutputTokens: maxTokens },
  };

  if (!useSearch) {
    body.system_instruction = { parts: [{ text: system }] };
  } else {
    // google_search grounding — Gemini will search the web before responding
    body.tools = [{ google_search: {} }];
  }

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();

    if (json.error) {
      console.error("Gemini API error:", json.error.message || json.error);
      return "";
    }

    // Search-grounded responses may interleave tool-use parts with text parts.
    // Use find() rather than [0] so we always get the actual text part.
    const parts = json.candidates?.[0]?.content?.parts || [];
    return parts.find(p => typeof p.text === "string")?.text || "";
  } catch (err) {
    console.error("Gemini fetch failed:", err);
    return "";
  }
};
