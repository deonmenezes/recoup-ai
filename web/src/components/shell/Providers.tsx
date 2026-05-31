"use client";

import { useEffect } from "react";
import { hydrateStore } from "@/lib/store";
import { CallProvider } from "@/components/call/CallProvider";
import { Toaster } from "@/components/ui/Toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  // Load persisted demo state after mount (keeps first render === SSR render).
  useEffect(() => {
    hydrateStore();
  }, []);

  return (
    <CallProvider>
      {children}
      <Toaster />
    </CallProvider>
  );
}
