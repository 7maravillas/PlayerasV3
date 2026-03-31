export default function CatalogLoading() {
  return (
    <div className="min-h-screen bg-theme-bg pt-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Filtros skeleton */}
        <div className="flex gap-3 mb-8 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 w-24 rounded-full bg-th-border/20 animate-pulse" />
          ))}
        </div>
        {/* Grid skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] rounded-lg bg-th-border/20 mb-3" />
              <div className="h-4 bg-th-border/20 rounded w-3/4 mb-2" />
              <div className="h-4 bg-th-border/20 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
