const getKey   = () => localStorage.getItem("cc-gemini-key") || "";
const getModel = () => localStorage.getItem("cc-gemini-model") || "gemini-2.5-flash-preview-04-17";
const getUrl   = () => `https://generativelanguage.googleapis.com/v1beta/models/${getModel()}:generateContent?key=${getKey()}`;

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

  const key = getKey();
  if (!key) throw new Error("No Gemini API key set. Tap ⚙ in the header to add your key.");

  const res = await fetch(getUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (json.error) {
    const msg = json.error.message || JSON.stringify(json.error);
    throw new Error(msg);
  }

  // Search-grounded responses may interleave tool-use parts with text parts.
  // Use find() rather than [0] so we always get the actual text part.
  const parts = json.candidates?.[0]?.content?.parts || [];
  return parts.find(p => typeof p.text === "string")?.text || "";
};
