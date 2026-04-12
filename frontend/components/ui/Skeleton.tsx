export function NFTSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="aspect-square bg-dark-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-dark-200 rounded w-3/4" />
        <div className="h-4 bg-dark-200 rounded w-1/2" />
        <div className="h-8 bg-dark-200 rounded w-1/3 mt-2" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="aspect-square bg-dark-200" />
      <div className="p-4">
        <div className="h-5 bg-dark-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-dark-200 rounded w-1/2 mb-3" />
        <div className="h-9 bg-dark-200 rounded w-full" />
      </div>
    </div>
  );
}