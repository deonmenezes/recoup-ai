"use client";

import { useEffect, useRef } from "react";
import { Wrench } from "lucide-react";
import type { TranscriptTurn } from "@/lib/types";
import { cn } from "@/lib/cn";
import { motion, AnimatePresence } from "framer-motion";

interface TranscriptStreamProps {
  turns: RevealedTurn[];
  /** Whether a next agent turn is being typed / waiting */
  typing: boolean;
}

export interface RevealedTurn {
  turn: TranscriptTurn;
  /** Text visible so far (for character streaming of agent turns) */
  visibleText: string;
}

export function TranscriptStream({ turns, typing }: TranscriptStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as new turns arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [turns.length, typing]);

  return (
    <div className="flex flex-col gap-2 overflow-y-auto px-4 py-3" aria-live="polite" aria-label="Call transcript">
      <AnimatePresence initial={false}>
        {turns.map(({ turn, visibleText }) => {
          if (turn.role === "system") {
            return (
              <motion.div
                key={turn.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex justify-center"
              >
                <span className="rounded-full bg-[#eef0f5] px-3 py-1 text-[11px] font-medium text-subtle">
                  {visibleText}
                </span>
              </motion.div>
            );
          }

          const isAgent = turn.role === "agent";

          return (
            <motion.div
              key={turn.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className={cn("flex flex-col gap-1", isAgent ? "items-start" : "items-end")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed text-pretty",
                  isAgent
                    ? "rounded-tl-sm bg-primary-soft text-primary"
                    : "rounded-tr-sm bg-surface-2 text-ink border border-border",
                )}
              >
                {visibleText}
                {/* Blinking cursor while streaming */}
                {isAgent && visibleText.length < turn.text.length && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 align-middle bg-primary/60 animate-pulse" aria-hidden />
                )}
              </div>

              {/* Tool chip */}
              {turn.tool && visibleText === turn.text && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.18 }}
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-0.5",
                    isAgent ? "ml-1" : "mr-1",
                    "bg-[#eef0f5]",
                  )}
                >
                  <Wrench className="size-3 text-subtle" aria-hidden />
                  <span className="text-[10px] font-medium text-subtle">tool · {turn.tool}</span>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Typing indicator */}
      <AnimatePresence>
        {typing && (
          <motion.div
            key="typing"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 2 }}
            transition={{ duration: 0.2 }}
            className="flex items-start"
          >
            <div className="flex items-center gap-1 rounded-xl rounded-tl-sm bg-primary-soft px-3.5 py-2.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="block size-1.5 rounded-full bg-primary/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                  aria-hidden
                />
              ))}
              <span className="sr-only">Riley is speaking</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={bottomRef} />
    </div>
  );
}
