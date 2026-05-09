import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, BedDouble, MapPin, AlertTriangle, CheckCircle2, Clock, DollarSign } from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
}

export default function AdminMetrics() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/admin/metrics'],
    queryFn: () => fetch('/api/admin/metrics', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(r => r.json()),
    refetchInterval: 60_000, // refresh every minute
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Cargando métricas...</div>;
  if (!data || data.error) return <div className="p-8 text-center text-red-500">{data?.error || 'Error'}</div>;

  const { inventario, leads, reservas, topDestinos, stockBajo } = data;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={<BedDouble className="w-5 h-5 text-blue-600" />} label="Bloqueos activos" value={inventario.totalBloqueos} sub={`${inventario.habitacionesDisponibles} habitaciones`} color="blue" />
        <KPI icon={<MapPin className="w-5 h-5 text-emerald-600" />} label="Destinos activos" value={inventario.destinosActivos} sub={`${inventario.bloqueoAgotados} agotados`} color="emerald" />
        <KPI icon={<Users className="w-5 h-5 text-violet-600" />} label="Leads este mes" value={leads.esteMes} sub={`${leads.hoy} hoy`} color="violet" />
        <KPI icon={<DollarSign className="w-5 h-5 text-amber-600" />} label="Ventas confirmadas" value={fmt(reservas.montoConfirmadoMes)} sub="este mes" color="amber" />
      </div>

      {/* Reservas */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border p-4 flex items-center gap-3">
          <Clock className="w-8 h-8 text-yellow-500" />
          <div><p className="text-2xl font-bold">{reservas.pendientes}</p><p className="text-sm text-muted-foreground">Pendientes</p></div>
        </div>
        <div className="rounded-xl border p-4 flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <div><p className="text-2xl font-bold">{reservas.confirmadas}</p><p className="text-sm text-muted-foreground">Confirmadas</p></div>
        </div>
        <div className="rounded-xl border p-4 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-blue-500" />
          <div><p className="text-2xl font-bold">{reservas.total}</p><p className="text-sm text-muted-foreground">Total histórico</p></div>
        </div>
      </div>

      {/* Top destinos */}
      <div className="rounded-xl border p-4">
        <h2 className="font-semibold mb-3">Inventario por destino</h2>
        <div className="space-y-2">
          {topDestinos?.map((d: any) => (
            <div key={d.destino} className="flex items-center justify-between">
              <span className="text-sm font-medium">{d.destino}</span>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{d.bloqueos} bloqueos</span>
                <span className="text-green-600 font-medium">{d.disponibles} hab.</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stock bajo */}
      {stockBajo?.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="font-semibold mb-3 flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-4 h-4" /> Stock bajo (≤3 habitaciones)
          </h2>
          <div className="space-y-1">
            {stockBajo.map((b: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{b.hotel} — {b.destino}</span>
                <span className="text-red-600 font-bold">{b.habitaciones_disponibles} hab. — {b.check_in}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KPI({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: any; sub: string; color: string }) {
  return (
    <div className={`rounded-xl border p-4 bg-${color}-50`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-sm text-muted-foreground">{label}</span></div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}
