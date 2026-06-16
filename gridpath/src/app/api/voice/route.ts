// Twilio voice webhook for the conversational AI call. Twilio handles
// speech-to-text via <Gather input="speech">; NVIDIA Nemotron answers the
// caller's follow-up questions, grounded in the location facts carried in the
// `ctx` query param. State (facts + recent turns) lives in the query string, so
// the webhook stays stateless and needs no database.
//
// Flow:
//   1. /api/call places the call with Url=/api/voice?ctx=<facts>&greet=1
//   2. First hit (greet=1): speak the brief, then <Gather> for a question.
//   3. Each later hit: SpeechResult -> Nemotron answer -> speak -> <Gather> again.

import { decodeCtx, encodeCtx, gatherTwiml, hangupTwiml, isGoodbye } from "@/lib/voicebrief";
import { type ChatTurn, nemotronAnswer } from "@/lib/nemotron";

export const dynamic = "force-dynamic";

interface VoiceCtx {
  facts: string;
  greeting: string;
}

function twiml(xml: string) {
  return new Response(xml, {
    headers: { "Content-Type": "text/xml; charset=utf-8" },
  });
}

/** Build the action URL for the next turn, carrying ctx + updated history. */
function nextAction(origin: string, ctxParam: string, history: ChatTurn[]): string {
  const h = encodeCtx(history.slice(-6));
  return `${origin}/api/voice?ctx=${encodeURIComponent(ctxParam)}&h=${encodeURIComponent(h)}`;
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const origin = process.env.PUBLIC_BASE_URL || url.origin;
  const ctxParam = url.searchParams.get("ctx") || "";
  const ctx = decodeCtx<VoiceCtx>(ctxParam);
  const greet = url.searchParams.get("greet") === "1";
  const history = decodeCtx<ChatTurn[]>(url.searchParams.get("h")) || [];

  if (!ctx) {
    return twiml(hangupTwiml("Sorry, this call's context expired. Please try again from the website. Goodbye!"));
  }

  // First turn: greet with the brief, then open the mic for questions.
  if (greet) {
    const prompt = `${ctx.greeting} What would you like to know about this location? You can ask about the cost, the timeline, going underground, or clean energy options.`;
    return twiml(gatherTwiml(nextAction(origin, ctxParam, history), prompt));
  }

  // Twilio posts the recognized speech as a form field.
  let question = "";
  try {
    const form = await request.formData();
    question = String(form.get("SpeechResult") || "").trim();
  } catch {
    /* no body */
  }

  if (!question) {
    return twiml(
      gatherTwiml(
        nextAction(origin, ctxParam, history),
        "Sorry, I didn't catch that. What would you like to know?"
      )
    );
  }

  if (isGoodbye(question)) {
    return twiml(hangupTwiml("Great — you can see the full breakdown and apply on the GridPath website. Thanks for using GridPath. Goodbye!"));
  }

  let answer: string;
  try {
    answer = await nemotronAnswer(ctx.facts, history, question);
  } catch (err) {
    console.error("nemotron answer failed", err);
    answer = "I'm having trouble reaching my assistant right now. You can find the full details on the GridPath website.";
  }

  const newHistory: ChatTurn[] = [
    ...history,
    { role: "user", content: question },
    { role: "assistant", content: answer },
  ];

  const followup = `${answer} ... Anything else you'd like to know?`;
  return twiml(gatherTwiml(nextAction(origin, ctxParam, newHistory), followup));
}

// Twilio can be configured to GET; support both.
export const GET = POST;
