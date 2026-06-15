import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, Download } from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

function pct(n: number) {
  return `${n.toFixed(2)}%`;
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export default function AdminComisiones() {
  const [mes, setMes] = useState(currentMonth());

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/comisiones", mes],
    queryFn: () =>
      fetch(`/api/admin/comisiones?mes=${mes}`).then((r) => r.json()),
  });

  function exportCSV() {
    if (!data?.reservas?.length) return;
    const headers = "Cliente,Destino,Fecha Viaje,Precio Venta,Costo Neto,Comisión,Margen %";
    const rows = data.reservas.map((r: any) =>
      [
        r.cliente,
        r.destino,
        r.fecha_viaje?.slice(0, 10),
        r.precio_venta,
        r.costo_neto,
        r.comision,
        r.porcentaje_comision,
      ].join(",")
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comisiones-${mes}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reporte de Comisiones</h1>
          <p className="text-sm text-muted-foreground">Reservas confirmadas y márgenes por período</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="py-12 text-center text-muted-foreground">Cargando...</div>
      )}
      {error && (
        <div className="py-12 text-center text-red-500">Error al cargar datos</div>
      )}

      {data && (
        <>
          {/* Totales */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Total vendido</span>
              </div>
              <p className="text-2xl font-bold">{fmt(data.totales?.totalVendido ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">{data.totales?.cantidadReservas ?? 0} reservas</p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Comisión total</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{fmt(data.totales?.totalComision ?? 0)}</p>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <span className="text-sm">Margen promedio</span>
              </div>
              <p className="text-2xl font-bold">{pct(data.totales?.margenPromedio ?? 0)}</p>
            </div>
          </div>

          {/* Tabla */}
          <div className="rounded-xl border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium">Destino</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Fecha Check-in</th>
                  <th className="px-4 py-3 text-right font-medium">Precio Venta</th>
                  <th className="px-4 py-3 text-right font-medium hidden lg:table-cell">Costo Neto</th>
                  <th className="px-4 py-3 text-right font-medium">Comisión</th>
                  <th className="px-4 py-3 text-right font-medium hidden lg:table-cell">Margen</th>
                </tr>
              </thead>
              <tbody>
                {data.reservas?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No hay reservas confirmadas en este período.
                    </td>
                  </tr>
                )}
                {data.reservas?.map((r: any) => (
                  <tr key={r.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{r.cliente}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.destino}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                      {r.fecha_viaje?.slice(0, 10)}
                    </td>
                    <td className="px-4 py-3 text-right">{fmt(parseFloat(r.precio_venta ?? 0))}</td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell text-muted-foreground">
                      {fmt(parseFloat(r.costo_neto ?? 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">
                      {fmt(parseFloat(r.comision ?? 0))}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      {pct(parseFloat(r.porcentaje_comision ?? 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
              {(data.reservas?.length ?? 0) > 0 && (
                <tfoot className="border-t bg-muted/50 font-semibold">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 hidden md:table-cell">Total del período</td>
                    <td colSpan={3} className="px-4 py-3 md:hidden">Total</td>
                    <td className="px-4 py-3 text-right">{fmt(data.totales?.totalVendido ?? 0)}</td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">—</td>
                    <td className="px-4 py-3 text-right text-green-600">{fmt(data.totales?.totalComision ?? 0)}</td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">{pct(data.totales?.margenPromedio ?? 0)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  );
}
