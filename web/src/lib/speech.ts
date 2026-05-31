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
  if (typeof window === "undefined") return;
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

// ── NVIDIA Magpie pre-generated clips (the real agent voice) ────────────────
// Riley's lines are synthesized ahead of time with NVIDIA Magpie (the same
// voice the live phone bot uses) and played here, so the in-browser call uses
// the real NVIDIA voice rather than the browser's generic TTS. The debtor's
// (human) side stays on browser speech.
let manifest: Set<string> | null = null;
let currentAudio: HTMLAudioElement | null = null;

/** FNV-1a 32-bit — MUST match scripts/dump-lines.mjs hashText(). */
export function hashText(s: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 0).toString(36);
}

/** Load the manifest of available NVIDIA clips (call once on mount). */
export async function loadCallAudioManifest(): Promise<void> {
  if (manifest || typeof window === "undefined") return;
  try {
    const res = await fetch("/call-audio/manifest.json", { cache: "force-cache" });
    manifest = res.ok ? new Set<string>(await res.json()) : new Set();
  } catch {
    manifest = new Set();
  }
}

/** True if a pre-generated NVIDIA Magpie clip exists for this line. */
export function hasNvidiaVoice(text: string): boolean {
  return !!manifest && manifest.has(hashText(text));
}

/** Play the NVIDIA Magpie clip for this line. Returns false if unavailable. */
export function playNvidiaLine(text: string, onEnd?: () => void): boolean {
  if (typeof window === "undefined" || !hasNvidiaVoice(text)) return false;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  const audio = new Audio(`/call-audio/${hashText(text)}.mp3`);
  currentAudio = audio;
  if (onEnd) audio.onended = onEnd;
  audio.play().catch(() => {
    /* autoplay blocked / decode error — caller keeps the transcript moving */
  });
  return true;
}

export function speechSupported(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}
