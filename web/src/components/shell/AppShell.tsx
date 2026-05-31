"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { SideRail } from "./SideRail";
import { TopNav } from "./TopNav";
import { IconButton } from "@/components/ui/Button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="flex min-h-dvh">
      {/* Fixed rail on desktop */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0">
        <div className="fixed inset-y-0 left-0 w-64">
          <SideRail />
        </div>
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-ink/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawer(false)}
              aria-hidden
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 420, damping: 38 }}
            >
              <SideRail onNavigate={() => setDrawer(false)} />
              <IconButton
                label="Close navigation"
                size="sm"
                onClick={() => setDrawer(false)}
                className="absolute -right-11 top-3 bg-white/10 text-white hover:bg-white/20"
              >
                <X className="size-5" />
              </IconButton>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onMenu={() => setDrawer(true)} />
        <main id="main" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
