interface Item {
  name: string;
  value: number;
  imageUrl?: string;
  clubName?: string | null;
}

interface Props {
  items: Item[];
  color?: string;
  formatValue?: (v: number) => string;
}

export default function MiniBarList({ items, color = 'bg-indigo-400', formatValue }: Props) {
  const max = Math.max(...items.map(i => i.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 w-4 text-right font-bold shrink-0">
            {idx + 1}
          </span>

          {item.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-8 h-8 rounded-lg object-contain bg-slate-50 border border-slate-100 shrink-0"
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold text-slate-700 truncate leading-none">
                {item.name}
              </span>
              <span className="text-xs text-slate-500 font-bold shrink-0 tabular-nums">
                {formatValue ? formatValue(item.value) : item.value.toLocaleString('es-MX')}
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${color} rounded-full transition-all duration-500`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <p className="text-xs text-slate-300 text-center py-4">Sin datos</p>
      )}
    </div>
  );
}
