"use client";

// ── Browser speech synthesis ────────────────────────────────────────────────
// Gives the in-browser call console an ACTUAL spoken voice (no server needed):
// Riley's lines and the debtor's lines are read aloud with two distinct voices
// as the scripted transcript plays. Runs entirely on the visitor's device via
// the Web Speech API; degrades silently where unsupported.

type Role = "agent" | "debtor";

let agentVoice: SpeechSynthesisVoice | null = null;
let debtorVoice: SpeechSynthesisVoice | null = null;
let selected = false;

function selectVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;

  const en = voices.filter((v) => /^en[-_]?/i.test(v.lang));
  const pool = en.length ? en : voices;
  const find = (re: RegExp) => pool.find((v) => re.test(v.name));

  // Agent (Riley): a calm, natural US voice.
  agentVoice =
    find(/Samantha|Google US English|Aria|Jenny|Ava|Allison|Natural/i) ||
    pool.find((v) => /en[-_]US/i.test(v.lang)) ||
    pool[0] ||
    null;

  // Debtor: a clearly different voice so the two sides are distinguishable.
  debtorVoice =
    find(/Daniel|Alex|Fred|Rishi|Google UK English Male|Arthur|Oliver|Male/i) ||
    pool.find((v) => v !== agentVoice) ||
    agentVoice;

  selected = true;
}

/** Warm up the voice list (voices often load asynchronously). Call on mount. */
export function primeVoices() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  selectVoices();
  try {
    window.speechSynthesis.addEventListener("voiceschanged", selectVoices);
  } catch {
    /* older browsers */
  }
}

/** Speak a line aloud in the role's voice. No-op if unsupported. */
export function speak(text: string, role: Role = "agent") {
  if (typeof window === "undefined" || !window.speechSynthesis || !text.trim()) return;
  if (!selected) selectVoices();

  const u = new SpeechSynthesisUtterance(text);
  const v = role === "agent" ? agentVoice : debtorVoice;
  if (v) u.voice = v;
  u.lang = v?.lang || "en-US";
  // Slightly distinct prosody per role for realism.
  u.rate = role === "agent" ? 1.04 : 1.0;
  u.pitch = role === "agent" ? 1.0 : 0.9;
  u.volume = 1;
  window.speechSynthesis.speak(u);
}

/** Stop any queued/active speech immediately (call on hang-up / unmount / mute). */
export function cancelSpeech() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}
