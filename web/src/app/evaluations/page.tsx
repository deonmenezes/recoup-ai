import { Suspense } from "react";
import { CekuraView } from "@/components/cekura/CekuraView";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8 space-y-6">
          <div className="skeleton h-9 w-64 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-48 rounded-xl" />
            ))}
          </div>
          <div className="skeleton h-64 rounded-xl" />
        </div>
      }
    >
      <CekuraView />
    </Suspense>
  );
}
