import { Skeleton } from "@/components/ui/skeleton";

export default function PlansLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>
      <Skeleton className="h-9 w-48 rounded-md" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-9 w-9" />
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="flex border-b">
          <Skeleton className="w-12 h-10 shrink-0 rounded-none" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-1 p-2">
              <Skeleton className="h-3 w-8 mx-auto mb-1" />
              <Skeleton className="h-7 w-7 mx-auto rounded-full" />
            </div>
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex border-b last:border-0">
            <Skeleton className="w-12 h-14 shrink-0 rounded-none" />
            {Array.from({ length: 7 }).map((_, j) => (
              <Skeleton key={j} className="flex-1 h-14 rounded-none border-l" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
