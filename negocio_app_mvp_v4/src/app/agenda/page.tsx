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
  sale_date: string;
  sale_time: string;
  price: number | string;
  status: "pendiente" | "completada" | "cancelada" | "eliminada";
};

function localDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function money(value: number | string) {
  return Number(value || 0).toLocaleString("es-DO", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export default function AgendaPage() {
  const [fecha, setFecha] = useState(localDateString());
  const [ventas, setVentas] = useState<Sale[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [procesando, setProcesando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("sales")
      .select("id,client_name,sale_date,sale_time,price,status")
      .eq("user_id", user.id)
      .eq("sale_date", fecha)
      .neq("status", "eliminada")
      .order("sale_time", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) setMensaje(error.message);
    setVentas((data ?? []) as Sale[]);
    setCargando(false);
  }, [fecha]);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("date");
    if (requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) && requested !== fecha) {
      setFecha(requested);
      return;
    }
    void cargar();
  }, [cargar, fecha]);

  const resumen = useMemo(() => {
    const pendientes = ventas.filter(v => v.status === "pendiente").length;
    const completadas = ventas.filter(v => v.status === "completada").length;
    const bruto = ventas.filter(v => v.status === "completada").reduce((s, v) => s + Number(v.price), 0);
    return { pendientes, completadas, bruto };
  }, [ventas]);

  async function completar(id: string) {
    setProcesando(id);
    setMensaje("");
    try {
      await completeSale(id);
      await cargar();
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
      await cargar();
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
          <a className="btn" href="/agenda/nueva">Nueva venta</a>
        </div>

        <div className="card agenda-date-card">
          <div className="field compact-field">
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div className="agenda-summary">
            <span>{resumen.pendientes} pendientes</span>
            <span>{resumen.completadas} completadas</span>
            <strong>RD${money(resumen.bruto)}</strong>
          </div>
        </div>

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
              </div>
              <span className={`status status-${venta.status}`}>{venta.status}</span>
              {venta.status === "pendiente" && (
                <div className="actions">
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
