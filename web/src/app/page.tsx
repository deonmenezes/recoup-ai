import { Suspense } from "react";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { Skeleton } from "@/components/ui/primitives";

function DashboardSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8 flex flex-col gap-8">
      {/* Header skeleton */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <Skeleton className="h-4 w-80 rounded-md" />
      </div>
      {/* KPI row skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      {/* Two-column band skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Skeleton className="xl:col-span-2 h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      {/* Queue + activity skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardView />
    </Suspense>
  );
}
