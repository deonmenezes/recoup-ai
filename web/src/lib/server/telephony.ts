/**
 * Server-only telephony helpers for Recoup AI.
 *
 * Reads Twilio + Pipecat configuration from process.env at call time so that
 * the module can be safely imported even when env vars are absent (e.g. CI,
 * local dev without a .env.local) — it simply degrades to simulation mode.
 *
 * NEVER import this file from a client component. Use the API routes instead.
 */

/** Default Pipecat agent WebSocket endpoint (Twilio Media Streams). */
const DEFAULT_PIPECAT_AGENT_HOST = "wss://api.pipecat.daily.co/ws/twilio";

/**
 * Returns true only when all three Twilio credentials are present in the
 * environment. When false every call is simulated locally.
 */
export function telephonyConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );
}

/**
 * Builds the TwiML `<Response>` XML that Twilio should execute for an
 * outbound call — connects the call to the Pipecat agent via Media Streams.
 *
 * @param serviceHost - Optional `_pipecatCloudServiceHost` parameter value
 *   (defaults to the PIPECAT_SERVICE_HOST env var, then an empty string).
 *
 * @example
 * buildConnectTwiml("recoup-bot.myorg.pipecat.cloud")
 * // => '<?xml version="1.0" ...><Response><Connect><Stream ...'
 */
export function buildConnectTwiml(serviceHost?: string): string {
  const agentHost =
    process.env.PIPECAT_AGENT_HOST ?? DEFAULT_PIPECAT_AGENT_HOST;
  const host =
    serviceHost ?? process.env.PIPECAT_SERVICE_HOST ?? "";

  // Conditionally include the <Parameter> element only when a service host is
  // known — keeps the XML minimal when running without Pipecat Cloud.
  const parameterXml = host
    ? `<Parameter name="_pipecatCloudServiceHost" value="${escapeXml(host)}"/>`
    : "";

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    "<Response>",
    "  <Connect>",
    `    <Stream url="${escapeXml(agentHost)}">`,
    parameterXml ? `      ${parameterXml}` : "",
    "    </Stream>",
    "  </Connect>",
    "</Response>",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

/** Minimal XML attribute escaping for the TwiML values we interpolate. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export interface PlaceCallResult {
  ok: boolean;
  /** Twilio Call SID returned on success. */
  callSid?: string;
  /** Human-readable error string (never contains auth tokens). */
  error?: string;
}

/**
 * Places an outbound call via the Twilio REST API using the env credentials.
 *
 * The TwiML that Twilio executes is built inline via `buildConnectTwiml` so
 * no external TwiML Bin is required for local/dev use.
 *
 * @param to - E.164 destination phone number (e.g. "+16282466113")
 * @returns `{ ok: true, callSid }` on success or `{ ok: false, error }` on
 *   any failure. The error message never includes the auth token.
 */
export async function placeOutboundCall({
  to,
}: {
  to: string;
}): Promise<PlaceCallResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    return { ok: false, error: "Twilio credentials not configured" };
  }

  const twiml = buildConnectTwiml();

  const body = new URLSearchParams({
    To: to,
    From: from,
    Twiml: twiml,
  });

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`;

  // Basic auth: sid:token (never logged or returned to the client)
  const authHeader =
    "Basic " + Buffer.from(`${sid}:${token}`).toString("base64");

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: `Failed to reach Twilio: ${message}` };
  }

  if (!response.ok) {
    // Return the HTTP status only — do NOT forward the raw body which may
    // echo back auth-adjacent data.
    return {
      ok: false,
      error: `Twilio returned HTTP ${response.status}`,
    };
  }

  let json: Record<string, unknown>;
  try {
    json = (await response.json()) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "Invalid JSON from Twilio" };
  }

  const callSid = typeof json.sid === "string" ? json.sid : undefined;
  if (!callSid) {
    return { ok: false, error: "Twilio response missing call SID" };
  }

  return { ok: true, callSid };
}
