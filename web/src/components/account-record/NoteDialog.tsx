"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

export function NoteDialog({ open, onClose, onSubmit }: Props) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setText("");
      setSubmitting(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    onSubmit(text.trim());
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="note-dialog-title"
        >
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            className="relative z-10 w-full max-w-md card shadow-xl"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <StickyNote className="size-4" aria-hidden />
                </span>
                <h2 id="note-dialog-title" className="text-sm font-semibold text-ink">
                  Add Note
                </h2>
              </div>
              <button
                onClick={onClose}
                className="flex size-7 items-center justify-center rounded-md text-subtle hover:text-ink hover:bg-[#eef0f5] transition-colors cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
              <div>
                <label htmlFor="note-text" className="block text-[11px] font-medium uppercase tracking-wide text-subtle mb-1.5">
                  Note <span className="text-danger" aria-hidden>*</span>
                </label>
                <textarea
                  ref={textareaRef}
                  id="note-text"
                  required
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  className="w-full resize-y rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm text-ink placeholder-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Prefers evenings. Flagged for after-6 PM attempt…"
                />
                <p className="mt-1 text-[11px] text-subtle">{text.length} characters</p>
              </div>

              <div className="flex gap-2.5 pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="flex-1"
                  loading={submitting}
                  disabled={!text.trim()}
                >
                  Save note
                </Button>
                <Button type="button" variant="secondary" size="md" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
