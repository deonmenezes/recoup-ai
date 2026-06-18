// NVIDIA Nemotron LLM client (OpenAI-compatible cloud NIM). Answers a caller's
// spoken follow-up questions about their selected location, grounded in the
// estimate facts. Uses NVIDIA_API_KEY against integrate.api.nvidia.com.

const BASE_URL =
  process.env.NVIDIA_LLM_URL || "https://integrate.api.nvidia.com/v1";
const MODEL =
  process.env.NVIDIA_LLM_MODEL || "nvidia/llama-3.3-nemotron-super-49b-v1.5";

export function hasNvidia(): boolean {
  return Boolean(process.env.NVIDIA_API_KEY);
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Ask Nemotron a question grounded in `facts` about the caller's location.
 * `history` is the recent back-and-forth so follow-ups ("what about underground?")
 * keep context. Returns a short, spoken-friendly answer.
 */
export async function nemotronAnswer(
  facts: string,
  history: ChatTurn[],
  question: string
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error("NVIDIA_API_KEY not set");

  const system = `/no_think You are Riley, GridPath's clean-energy connection advisor, on a live phone call. The caller selected a property and you are answering their follow-up questions about it. Use ONLY these facts about their location:

${facts}

Rules: Answer in 1-3 short sentences suitable for speaking aloud — no markdown, no lists. Speak dollar amounts and distances naturally. If a question is outside these facts, say you don't have that detail and suggest the GridPath website. Be warm and concise.`;

  const messages = [
    { role: "system", content: system },
    ...history.slice(-6),
    { role: "user", content: question },
  ];

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      max_tokens: 160,
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Nemotron error ${res.status}: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const answer = data.choices?.[0]?.message?.content?.trim();
  return answer || "Sorry, I didn't catch that. Could you say it again?";
}
