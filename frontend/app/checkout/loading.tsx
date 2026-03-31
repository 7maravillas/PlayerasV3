export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-theme-bg pt-24 px-6 animate-pulse">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Formulario */}
        <div className="space-y-4">
          <div className="h-6 bg-th-border/20 rounded w-1/3 mb-6" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-th-border/20 rounded-lg" />
          ))}
        </div>
        {/* Resumen */}
        <div className="space-y-4">
          <div className="h-6 bg-th-border/20 rounded w-1/3 mb-6" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-th-border/20 rounded-xl" />
          ))}
          <div className="h-14 bg-th-border/20 rounded-xl mt-4" />
        </div>
      </div>
    </div>
  );
}
