interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`bg-lynra-aluminium animate-pulse rounded-xl ${className}`}
    />
  );
}

export function RoomCardSkeleton() {
  return (
    <div className="bg-lynra-white rounded-xl p-6 ring-1 ring-lynra-aluminium">
      <Skeleton className="h-40 w-full mb-4 rounded-lg" />
      <Skeleton className="h-5 w-2/3 mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-4/5 mb-4" />
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-28" />
      </div>
    </div>
  );
}
