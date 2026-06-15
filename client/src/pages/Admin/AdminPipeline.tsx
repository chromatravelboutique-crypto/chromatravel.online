import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Users, DollarSign } from "lucide-react";

function fmt(n: number) {
  if (n === 0) return "$0";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

const COLOR_MAP: Record<string, string> = {
  blue:   "border-blue-400   bg-blue-50   dark:bg-blue-950/30",
  purple: "border-purple-400 bg-purple-50 dark:bg-purple-950/30",
  amber:  "border-amber-400  bg-amber-50  dark:bg-amber-950/30",
  orange: "border-orange-400 bg-orange-50 dark:bg-orange-950/30",
  green:  "border-green-400  bg-green-50  dark:bg-green-950/30",
  red:    "border-red-400    bg-red-50    dark:bg-red-950/30",
};

const BADGE_MAP: Record<string, string> = {
  blue:   "bg-blue-100   text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  amber:  "bg-amber-100  text-amber-700",
  orange: "bg-orange-100 text-orange-700",
  green:  "bg-green-100  text-green-700",
  red:    "bg-red-100    text-red-700",
};

interface PipelineCard {
  id: string;
  nombre: string;
  destino?: string;
  presupuesto?: number;
  dias_en_estado?: number;
  status: string;
}

interface PipelineColumn {
  label: string;
  color: string;
  cantidad: number;
  presupuestoTotal: number;
  items: PipelineCard[];
}

interface LeadDetailModal {
  card: PipelineCard;
  column: string;
}

export default function AdminPipeline() {
  const [selected, setSelected] = useState<LeadDetailModal | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/pipeline"],
    queryFn: () => fetch("/api/admin/pipeline").then((r) => r.json()),
    refetchInterval: 60_000,
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando pipeline...</div>;
  if (error || data?.error) return <div className="p-8 text-center text-red-500">Error al cargar datos</div>;

  const columns = Object.entries(data || {}) as [string, PipelineColumn][];
  const totalPipeline = columns.reduce((s, [, col]) => s + col.presupuestoTotal, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pipeline de Ventas</h1>
          <p className="text-sm text-muted-foreground">
            Valor total en pipeline: <span className="font-semibold text-foreground">{fmt(totalPipeline)}</span>
          </p>
        </div>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(([key, col]) => (
          <div
            key={key}
            className={`min-w-[260px] flex-shrink-0 rounded-xl border-t-4 ${COLOR_MAP[col.color] || COLOR_MAP.blue} border bg-card p-4`}
            style={{ borderTopColor: undefined }}
          >
            {/* Column header */}
            <div className="mb-3 flex items-center justify-between">
              <span className="font-semibold text-sm">{col.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${BADGE_MAP[col.color] || BADGE_MAP.blue}`}>
                {col.cantidad}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <DollarSign className="h-3 w-3" />
              <span>{fmt(col.presupuestoTotal)}</span>
            </div>

            {/* Cards */}
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {col.items.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-4">Sin registros</p>
              )}
              {col.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected({ card: item, column: col.label })}
                  className="w-full text-left rounded-lg border bg-background p-3 hover:shadow-sm transition-shadow"
                >
                  <p className="font-medium text-sm truncate">{item.nombre}</p>
                  {item.destino && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{item.destino}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    {item.presupuesto ? (
                      <span className="text-xs font-semibold text-green-600">{fmt(item.presupuesto)}</span>
                    ) : (
                      <span />
                    )}
                    {item.dias_en_estado !== undefined && (
                      <span className="text-xs text-muted-foreground">
                        {Math.floor(item.dias_en_estado)}d
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {columns.map(([key, col]) => (
          <div key={key} className="rounded-lg border bg-card p-3 text-center">
            <p className="text-lg font-bold">{col.cantidad}</p>
            <p className="text-xs text-muted-foreground">{col.label}</p>
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">{selected.card.nombre}</h3>
                <p className="text-sm text-muted-foreground">{selected.column}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              {selected.card.destino && (
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-24 shrink-0">Destino</dt>
                  <dd className="font-medium">{selected.card.destino}</dd>
                </div>
              )}
              {selected.card.presupuesto !== undefined && selected.card.presupuesto > 0 && (
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-24 shrink-0">Valor</dt>
                  <dd className="font-medium text-green-600">{fmt(selected.card.presupuesto)}</dd>
                </div>
              )}
              {selected.card.dias_en_estado !== undefined && (
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-24 shrink-0">Días en etapa</dt>
                  <dd className="font-medium">{Math.floor(selected.card.dias_en_estado)} días</dd>
                </div>
              )}
              <div className="flex gap-2">
                <dt className="text-muted-foreground w-24 shrink-0">Estado</dt>
                <dd className="font-medium">{selected.card.status}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
