import { Suspense } from "react";
import { Skeleton } from "@/components/ui/primitives";
import { RecordView } from "@/components/account-record/RecordView";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8 space-y-4">
          <Skeleton className="h-6 w-48 rounded-md" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
            <Skeleton className="xl:col-span-8 h-80 rounded-xl" />
            <Skeleton className="xl:col-span-4 h-80 rounded-xl" />
          </div>
        </div>
      }
    >
      <RecordView id={id} />
    </Suspense>
  );
}
