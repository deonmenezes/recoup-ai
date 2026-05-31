"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

interface WaveformProps {
  active: boolean;
  className?: string;
  barCount?: number;
  color?: string;
}

/**
 * Animated voice waveform — 5 bars that pulse while the agent is "speaking".
 * Uses requestAnimationFrame so it respects reduced-motion via CSS
 * (animation-duration: 0.001ms).
 */
export function Waveform({ active, className, barCount = 5, color = "#ffffff" }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const gap = 3;
    const barW = (W - gap * (barCount - 1)) / barCount;

    // Each bar has its own phase + amplitude factor
    const phases = Array.from({ length: barCount }, (_, i) => (i * Math.PI * 2) / barCount);
    const amps = [0.55, 0.85, 1.0, 0.85, 0.55];

    function draw(ts: number) {
      if (!ctx) return;
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = color;

      for (let i = 0; i < barCount; i++) {
        let h: number;
        if (active) {
          const wave = Math.sin(elapsed * 4 + phases[i]);
          h = H * 0.2 + H * 0.65 * amps[i] * ((wave + 1) / 2);
        } else {
          h = H * 0.18;
        }
        const x = i * (barW + gap);
        const y = (H - h) / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, h, barW / 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = 0;
    };
  }, [active, barCount, color]);

  return (
    <canvas
      ref={canvasRef}
      width={barCount * 6 + (barCount - 1) * 3}
      height={28}
      className={cn("opacity-90", className)}
      aria-hidden
    />
  );
}
