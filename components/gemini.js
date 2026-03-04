const getKey   = () => localStorage.getItem("cc-gemini-key") || "";
const getModel = () => (localStorage.getItem("cc-gemini-model") || "gemini-3-flash").replace(/^models\//, "");
const getUrl   = () => `https://generativelanguage.googleapis.com/v1beta/models/${getModel()}:generateContent?key=${getKey()}`;

export const gemini = async (system, userContent, maxTokens = 400, useSearch = false, jsonMode = false) => {
  const body = {
    contents: [{
      role: "user",
      // When using search grounding, system_instruction conflicts with the grounding tool.
      // Merge system prompt into user content instead so search requests work correctly.
      parts: [{ text: useSearch ? `${system}\n\n${userContent}` : userContent }],
    }],
    // JSON mode forces the model to always return valid JSON (can't be used with search grounding)
    generationConfig: {
      maxOutputTokens: maxTokens,
      ...(jsonMode && !useSearch ? { responseMimeType: "application/json" } : {}),
    },
  };

  if (!useSearch) {
    body.system_instruction = { parts: [{ text: system }] };
  } else {
    // google_search grounding — Gemini will search the web before responding
    body.tools = [{ google_search: {} }];
  }

  const key = getKey();
  if (!key) throw new Error("No Gemini API key set. Tap ⚙ in the header to add your key.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let res;
  try {
    res = await fetch(getUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") throw new Error("Request timed out after 30s — try again.");
    throw err;
  }
  clearTimeout(timeout);

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
