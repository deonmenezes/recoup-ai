"use client";

import { PhoneOff, Mic, MicOff } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { IconButton } from "@/components/ui/Button";
import { Dot } from "@/components/ui/Badge";
import { ScriptTracker } from "./ScriptTracker";
import { Waveform } from "./Waveform";
import { clock, prettyPhone } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Debtor } from "@/lib/types";

type CallPhase = "dialing" | "ringing" | "connected" | "wrapup" | "ended";

const PHASE_LABEL: Record<CallPhase, string> = {
  dialing: "Dialing…",
  ringing: "Ringing…",
  connected: "Connected",
  wrapup: "Wrapping up",
  ended: "Call ended",
};

interface CallStageProps {
  debtor: Debtor;
  phase: CallPhase;
  elapsedMs: number;
  agentSpeaking: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onEndCall: () => void;
  activeStepId: string | null;
  completedStepIds: Set<string>;
}

export function CallStage({
  debtor,
  phase,
  elapsedMs,
  agentSpeaking,
  muted,
  onToggleMute,
  onEndCall,
  activeStepId,
  completedStepIds,
}: CallStageProps) {
  const isLive = phase === "connected" || phase === "wrapup";
  const isRinging = phase === "ringing";

  return (
    <div className="flex flex-col h-full">
      {/* Gradient header */}
      <div
        className="relative flex flex-col items-center gap-3 rounded-t-2xl px-6 pt-8 pb-6 overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #161331 0%, #1f1a45 55%, #2d2566 100%)",
        }}
      >
        {/* Ambient glow behind avatar */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(99,102,241,0.5) 0%, transparent 70%)",
          }}
          aria-hidden
        />

        {/* Avatar with ring-pulse while ringing */}
        <div className={cn("relative z-10", isRinging && "animate-ring-pulse rounded-full")}>
          <Avatar
            name={debtor.name}
            palette={debtor.avatar}
            size="xl"
            ring
            className="shadow-xl"
          />
          {/* Live indicator dot */}
          {isLive && (
            <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-nav ring-2 ring-nav">
              <Dot tone="success" pulse />
            </span>
          )}
        </div>

        {/* Name + info */}
        <div className="relative z-10 flex flex-col items-center gap-0.5 text-center">
          <h2 className="text-base font-bold text-white">{debtor.name}</h2>
          <p className="text-xs text-nav-ink tnum">{prettyPhone(debtor.phone)}</p>
          <p className="text-[11px] text-nav-ink/70 mt-0.5">{debtor.originalCreditor}</p>
        </div>

        {/* Phase + timer row */}
        <div className="relative z-10 flex items-center gap-3">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
              isLive
                ? "bg-success/20 text-white"
                : isRinging
                  ? "bg-warning/20 text-white"
                  : "bg-white/10 text-white/80",
            )}
          >
            {isLive && <Dot tone="success" pulse />}
            {isRinging && <Dot tone="warning" pulse />}
            {PHASE_LABEL[phase]}
          </span>

          {isLive && (
            <span className="tnum text-sm font-semibold text-white tabular-nums">
              {clock(elapsedMs)}
            </span>
          )}
        </div>

        {/* Waveform — shown while agent speaks */}
        <div className="relative z-10 h-7 flex items-center" aria-label="Voice activity indicator">
          <Waveform active={agentSpeaking && isLive} color="rgba(255,255,255,0.75)" barCount={5} />
        </div>

        {/* Call controls */}
        <div className="relative z-10 flex items-center gap-4 pt-1">
          <IconButton
            label={muted ? "Unmute" : "Mute"}
            variant="ghost"
            size="md"
            onClick={onToggleMute}
            className="bg-white/10 hover:bg-white/20 text-white rounded-full size-12"
          >
            {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </IconButton>

          <IconButton
            label="End call"
            size="lg"
            onClick={onEndCall}
            className="bg-danger hover:bg-danger-ink text-white rounded-full size-14 shadow-lg active:scale-95 transition-transform"
          >
            <PhoneOff className="size-6" />
          </IconButton>
        </div>
      </div>

      {/* Script tracker */}
      <div className="flex-1 overflow-y-auto border-t border-border px-2 py-3 min-h-0">
        <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wide text-subtle">
          Script
        </p>
        <ScriptTracker activeStepId={activeStepId} completedStepIds={completedStepIds} />
      </div>
    </div>
  );
}
