"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CallConsole } from "./CallConsole";

interface CallContextValue {
  /** Account currently being called, or null. */
  activeAccountId: string | null;
  /** Open the call console and dial this account. */
  startCall: (accountId: string) => void;
  /** Close the call console. */
  endCall: () => void;
}

const CallContext = createContext<CallContextValue | null>(null);

export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within <CallProvider>");
  return ctx;
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);

  const startCall = useCallback((accountId: string) => setActiveAccountId(accountId), []);
  const endCall = useCallback(() => setActiveAccountId(null), []);

  const value = useMemo<CallContextValue>(
    () => ({ activeAccountId, startCall, endCall }),
    [activeAccountId, startCall, endCall],
  );

  return (
    <CallContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {activeAccountId && <CallConsole key={activeAccountId} accountId={activeAccountId} onClose={endCall} />}
      </AnimatePresence>
    </CallContext.Provider>
  );
}
