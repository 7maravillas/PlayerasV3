export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-theme-bg pt-24 px-6 animate-pulse">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Imagen */}
        <div className="aspect-square rounded-xl bg-th-border/20" />
        {/* Info */}
        <div className="space-y-4 pt-4">
          <div className="h-5 bg-th-border/20 rounded w-1/3" />
          <div className="h-8 bg-th-border/20 rounded w-2/3" />
          <div className="h-6 bg-th-border/20 rounded w-1/4" />
          <div className="h-px bg-th-border/20 my-4" />
          <div className="grid grid-cols-6 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 rounded bg-th-border/20" />
            ))}
          </div>
          <div className="h-14 rounded-full bg-th-border/20 mt-6" />
        </div>
      </div>
    </div>
  );
}
