import { Suspense } from "react";
import { AccountsView } from "@/components/accounts-list/AccountsView";
import { Skeleton } from "@/components/ui/primitives";

function AccountsLoading() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="card">
        <div className="p-4">
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<AccountsLoading />}>
      <AccountsView />
    </Suspense>
  );
}
