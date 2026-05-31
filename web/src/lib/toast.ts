"use client";

// Tiny toast store (aria-live announced by the Toaster component). P8: auto-dismiss 3–5s.
import { useSyncExternalStore } from "react";

export type ToastTone = "default" | "success" | "warning" | "danger" | "info";
export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
  duration: number;
}

let toasts: Toast[] = [];
let id = 0;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function emit() {
  toasts = [...toasts];
  for (const l of listeners) l();
}

export function dismissToast(toastId: number) {
  toasts = toasts.filter((t) => t.id !== toastId);
  const timer = timers.get(toastId);
  if (timer) {
    clearTimeout(timer);
    timers.delete(toastId);
  }
  for (const l of listeners) l();
}

export function showToast(
  input: { title: string; description?: string; tone?: ToastTone; duration?: number },
): number {
  id += 1;
  const toast: Toast = {
    id,
    title: input.title,
    description: input.description,
    tone: input.tone ?? "default",
    duration: input.duration ?? 4000,
  };
  toasts = [...toasts, toast];
  emit();
  if (typeof window !== "undefined" && toast.duration > 0) {
    timers.set(
      id,
      setTimeout(() => dismissToast(toast.id), toast.duration),
    );
  }
  return id;
}

export const toast = {
  show: (title: string, opts?: { description?: string; tone?: ToastTone; duration?: number }) =>
    showToast({ title, ...opts }),
  success: (title: string, description?: string) => showToast({ title, description, tone: "success" }),
  warning: (title: string, description?: string) => showToast({ title, description, tone: "warning" }),
  danger: (title: string, description?: string) => showToast({ title, description, tone: "danger" }),
  info: (title: string, description?: string) => showToast({ title, description, tone: "info" }),
};

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => toasts,
    () => toasts,
  );
}
