import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, CalendarCheck } from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay(); // 0=Sun
}

export default function AdminCheckins() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const mes = `${year}-${String(month).padStart(2, "0")}`;

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/checkins", mes],
    queryFn: () => fetch(`/api/admin/checkins?mes=${mes}`).then((r) => r.json()),
  });

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }

  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const dayNames = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

  const totalDays = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  const checkins: Record<string, any[]> = data?.checkins || {};

  const selectedReservations = selectedDay ? (checkins[selectedDay] || []) : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendario de Check-ins</h1>
          <p className="text-sm text-muted-foreground">
            {data?.total ?? 0} reservas confirmadas en {monthNames[month - 1]} {year}
          </p>
        </div>
      </div>

      {/* Calendar navigation */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
          <button onClick={prevMonth} className="p-1 rounded hover:bg-muted">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-semibold">{monthNames[month - 1]} {year}</h2>
          <button onClick={nextMonth} className="p-1 rounded hover:bg-muted">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {dayNames.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Cargando...</div>
        ) : (
          <div className="grid grid-cols-7">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="border-b border-r h-16 bg-muted/20" />
            ))}

            {/* Day cells */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const reservas = checkins[dateStr] || [];
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() + 1 &&
                year === today.getFullYear();
              const isSelected = selectedDay === dateStr;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  className={`border-b border-r h-16 p-1 text-left transition-colors relative
                    ${isToday ? "bg-primary/5" : ""}
                    ${isSelected ? "bg-primary/10 ring-1 ring-inset ring-primary" : "hover:bg-muted/50"}
                  `}
                >
                  <span className={`text-xs font-medium ${isToday ? "text-primary font-bold" : ""}`}>
                    {day}
                  </span>
                  {reservas.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap gap-0.5">
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 text-green-700 px-1.5 py-0.5 text-[10px] font-medium">
                        <CalendarCheck className="h-2.5 w-2.5" />
                        {reservas.length}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="rounded-xl border bg-card">
          <div className="px-4 py-3 border-b bg-muted/40">
            <h3 className="font-semibold">
              Check-ins del {selectedDay}
              <span className="ml-2 text-sm text-muted-foreground font-normal">
                ({selectedReservations.length} reserva{selectedReservations.length !== 1 ? "s" : ""})
              </span>
            </h3>
          </div>
          {selectedReservations.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No hay check-ins este día.</p>
          ) : (
            <div className="divide-y">
              {selectedReservations.map((r: any, i: number) => (
                <div key={i} className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{r.guest_name}</p>
                    <p className="text-xs text-muted-foreground">{r.hotel}</p>
                    {r.confirmation_code && (
                      <p className="text-xs font-mono text-muted-foreground">#{r.confirmation_code}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600">{fmt(parseFloat(r.monto || 0))}</p>
                    <p className="text-xs text-muted-foreground">{r.habitaciones_reservadas} hab.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
