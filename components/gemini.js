const GEMINI_KEY = "AIzaSyBBgUBXOTweNZievW3iM6tnI6hrxYjgiW8";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

export const gemini = async (system, userContent, maxTokens = 400, useSearch = false) => {
  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: userContent }] }],
    generationConfig: { maxOutputTokens: maxTokens },
  };
  if (useSearch) body.tools = [{ google_search: {} }];
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || "";
};
