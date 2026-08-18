"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import FloatingAdd from "@/components/FloatingAdd";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";
import { cancelSale, completeSale } from "@/lib/services/sales";

type Sale = {
  id: string;
  client_name: string;
  phone: string | null;
  sale_date: string;
  sale_time: string;
  price: number | string;
  status: "pendiente" | "completada" | "cancelada" | "eliminada";
};

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function localDateString() { return dateKey(new Date()); }

function parseDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function monthStart(value: string) {
  const d = parseDate(value);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function monthEndKey(d: Date) {
  return dateKey(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

function money(value: number | string) {
  return Number(value || 0).toLocaleString("es-DO", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

const weekdays = ["L", "M", "M", "J", "V", "S", "D"];

export default function AgendaPage() {
  const [fecha, setFecha] = useState(localDateString());
  const [mes, setMes] = useState(monthStart(localDateString()));
  const [ventasMes, setVentasMes] = useState<Sale[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [procesando, setProcesando] = useState<string | null>(null);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("date");
    if (requested && /^\d{4}-\d{2}-\d{2}$/.test(requested)) {
      setFecha(requested);
      setMes(monthStart(requested));
    }
  }, []);

  const cargarMes = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.replace("/login");
      return;
    }

    const inicio = dateKey(new Date(mes.getFullYear(), mes.getMonth(), 1));
    const fin = monthEndKey(mes);
    const { data, error } = await supabase
      .from("sales")
      .select("id,client_name,phone,sale_date,sale_time,price,status")
      .eq("user_id", user.id)
      .gte("sale_date", inicio)
      .lte("sale_date", fin)
      .neq("status", "eliminada")
      .order("sale_date", { ascending: true })
      .order("sale_time", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) setMensaje(error.message);
    setVentasMes((data ?? []) as Sale[]);
    setCargando(false);
  }, [mes]);

  useEffect(() => { void cargarMes(); }, [cargarMes]);

  const ventas = useMemo(() => ventasMes.filter(v => v.sale_date === fecha), [ventasMes, fecha]);

  const resumen = useMemo(() => {
    const pendientes = ventas.filter(v => v.status === "pendiente").length;
    const completadas = ventas.filter(v => v.status === "completada").length;
    const bruto = ventas.filter(v => v.status === "completada").reduce((s, v) => s + Number(v.price), 0);
    return { pendientes, completadas, bruto };
  }, [ventas]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    ventasMes.forEach(v => {
      if (v.status === "pendiente" || v.status === "completada") map.set(v.sale_date, (map.get(v.sale_date) ?? 0) + 1);
    });
    return map;
  }, [ventasMes]);

  const calendarDays = useMemo(() => {
    const first = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const last = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
    const mondayOffset = (first.getDay() + 6) % 7;
    const cells: Array<{ key: string; day: number; current: boolean }> = [];
    for (let i = 0; i < mondayOffset; i++) {
      const d = new Date(first.getFullYear(), first.getMonth(), 1 - (mondayOffset - i));
      cells.push({ key: dateKey(d), day: d.getDate(), current: false });
    }
    for (let day = 1; day <= last.getDate(); day++) {
      const d = new Date(mes.getFullYear(), mes.getMonth(), day);
      cells.push({ key: dateKey(d), day, current: true });
    }
    while (cells.length % 7 !== 0) {
      const d = new Date(mes.getFullYear(), mes.getMonth() + 1, cells.length - mondayOffset - last.getDate() + 1);
      cells.push({ key: dateKey(d), day: d.getDate(), current: false });
    }
    return cells;
  }, [mes]);

  function cambiarMes(delta: number) {
    const next = new Date(mes.getFullYear(), mes.getMonth() + delta, 1);
    setMes(next);
    setFecha(dateKey(next));
  }

  function seleccionar(key: string) {
    const d = parseDate(key);
    setFecha(key);
    if (d.getMonth() !== mes.getMonth() || d.getFullYear() !== mes.getFullYear()) setMes(monthStart(key));
    window.history.replaceState(null, "", `/agenda?date=${encodeURIComponent(key)}`);
  }

  async function completar(id: string) {
    setProcesando(id);
    setMensaje("");
    try {
      await completeSale(id);
      await cargarMes();
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo completar la venta.");
    } finally {
      setProcesando(null);
    }
  }

  async function cancelar(id: string) {
    if (!window.confirm("¿Cancelar esta venta?")) return;
    setProcesando(id);
    setMensaje("");
    try {
      await cancelSale(id);
      await cargarMes();
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo cancelar la venta.");
    } finally {
      setProcesando(null);
    }
  }

  return (
    <AuthGuard>
      <main className="shell">
        <Nav />
        <div className="page-heading-row">
          <h1>Agenda</h1>
          <a className="btn" href={`/agenda/nueva?date=${encodeURIComponent(fecha)}`}>Nueva venta</a>
        </div>

        <section className="calendar-card">
          <div className="calendar-head">
            <button className="calendar-nav" onClick={() => cambiarMes(-1)} aria-label="Mes anterior">‹</button>
            <strong>{mes.toLocaleDateString("es-DO", { month: "long", year: "numeric" })}</strong>
            <button className="calendar-nav" onClick={() => cambiarMes(1)} aria-label="Mes siguiente">›</button>
          </div>
          <div className="calendar-grid calendar-weekdays">
            {weekdays.map((w, i) => <span key={`${w}-${i}`}>{w}</span>)}
          </div>
          <div className="calendar-grid">
            {calendarDays.map(day => {
              const count = counts.get(day.key) ?? 0;
              const selected = day.key === fecha;
              const today = day.key === localDateString();
              return (
                <button
                  key={day.key}
                  className={`calendar-day${selected ? " selected" : ""}${today ? " today" : ""}${day.current ? "" : " outside"}`}
                  onClick={() => seleccionar(day.key)}
                >
                  <span>{day.day}</span>
                  {count > 0 && <i>{count}</i>}
                </button>
              );
            })}
          </div>
          <div className="calendar-selected">
            {parseDate(fecha).toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div className="agenda-summary">
            <span>{resumen.pendientes} pendientes</span>
            <span>{resumen.completadas} completadas</span>
            <strong>RD${money(resumen.bruto)}</strong>
          </div>
        </section>

        <h2 className="section-title">Ventas del día</h2>
        {mensaje && <div className="card error-message">{mensaje}</div>}
        {cargando ? (
          <div className="card muted">Cargando ventas…</div>
        ) : ventas.length === 0 ? (
          <div className="card muted">No hay ventas para esta fecha.</div>
        ) : (
          ventas.map(venta => (
            <div className="sale-row" key={venta.id}>
              <div className="sale-main">
                <div className="sale-name">{venta.client_name}</div>
                <div className="sale-time">{venta.sale_time.slice(0, 5)} · RD${money(venta.price)}</div>
                {venta.phone && <div className="sale-phone">{venta.phone}</div>}
              </div>
              <span className={`status status-${venta.status}`}>{venta.status}</span>
              {venta.status === "pendiente" && (
                <div className="actions">
                  <a className="btn secondary small" href={`/agenda/${venta.id}/editar`}>Modificar</a>
                  <button className="btn small" disabled={procesando === venta.id} onClick={() => completar(venta.id)}>Completar</button>
                  <button className="btn danger small" disabled={procesando === venta.id} onClick={() => cancelar(venta.id)}>Cancelar</button>
                </div>
              )}
            </div>
          ))
        )}

        <FloatingAdd />
      </main>
    </AuthGuard>
  );
}
