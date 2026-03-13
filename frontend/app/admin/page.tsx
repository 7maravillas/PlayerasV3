import { DollarSign, Package, ShoppingCart, TrendingUp, ArrowUpRight } from "lucide-react";

const STATS = [
  { label: "Ingresos Totales", value: "$0.00", icon: DollarSign, color: "bg-indigo-50 text-indigo-500", border: "border-indigo-100" },
  { label: "Ventas Hoy", value: "0", icon: TrendingUp, color: "bg-emerald-50 text-emerald-500", border: "border-emerald-100" },
  { label: "Órdenes", value: "0", icon: ShoppingCart, color: "bg-violet-50 text-violet-500", border: "border-violet-100" },
  { label: "Productos", value: "0", icon: Package, color: "bg-amber-50 text-amber-500", border: "border-amber-100" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8 max-w-6xl">

      {/* CABECERA */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">Panel de Control</p>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Resumen de tu tienda JerseysRAW.</p>
        </div>
        <div className="text-xs text-slate-400 bg-white border border-slate-100 px-4 py-2 rounded-full shadow-sm">
          Hoy — {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      {/* TARJETAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {STATS.map((stat) => (
          <div key={stat.label} className={`bg-white border ${stat.border} p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</p>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ÁREA VACÍA ESTILIZADA */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
          <h3 className="font-black text-slate-700 text-lg">Gráficos de Rendimiento</h3>
          <p className="text-slate-400 text-sm mt-1">Las analíticas de ventas estarán disponibles próximamente.</p>
        </div>
        <div className="flex gap-2 mt-2">
          {["Ene", "Feb", "Mar", "Abr", "May"].map((m, i) => (
            <div key={m} className="flex flex-col items-center gap-1">
              <div
                className="w-8 rounded-lg bg-indigo-100"
                style={{ height: `${[24, 40, 32, 56, 20][i]}px` }}
              />
              <span className="text-[9px] text-slate-300 font-bold">{m}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}