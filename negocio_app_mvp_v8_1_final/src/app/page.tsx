"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import FloatingAdd from "@/components/FloatingAdd";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";

type DashboardData = {
  workingCapital: number;
  houseFund: number;
  goalBalance: number;
  goalAmount: number;
  dailyUnitGoal: number;
  mp1: number;
  mp2: number;
  mp3: number;
  dailyHouseAmount: number;
  requireNoPendingToClose: boolean;
  grossToday: number;
  completedToday: number;
  createdToday: number;
  totalPending: number;
  closedToday: boolean;
  salesToday: { id: string; client_name: string; sale_time: string; price: number | string; status: string }[];
  recent: { id: string; description: string; amount: number | string; direction: string; created_at: string }[];
};

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function localDayBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function money(v: number | string) {
  return Number(v || 0).toLocaleString("es-DO", { maximumFractionDigits: 2 });
}

const initial: DashboardData = {
  workingCapital: 0,
  houseFund: 0,
  goalBalance: 0,
  goalAmount: 0,
  dailyUnitGoal: 12,
  mp1: 0,
  mp2: 0,
  mp3: 0,
  dailyHouseAmount: 0,
  requireNoPendingToClose: true,
  grossToday: 0,
  completedToday: 0,
  createdToday: 0,
  totalPending: 0,
  closedToday: false,
  salesToday: [],
  recent: []
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.7" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 6.2A11.5 11.5 0 0 1 12 6c6.5 0 10 6 10 6a17.8 17.8 0 0 1-3.1 3.8" />
      <path d="M6.7 6.7C3.7 8.6 2 12 2 12s3.5 6 10 6c1.6 0 3-.4 4.2-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

export default function Home() {
  const [data, setData] = useState<DashboardData>(initial);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [cerrando, setCerrando] = useState(false);
  const [mostrarCierre, setMostrarCierre] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState("Usuario");
  const [mostrarBruto, setMostrarBruto] = useState(true);
  const [mostrarCapital, setMostrarCapital] = useState(true);
  const [mostrarCasa, setMostrarCasa] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.replace("/login");
      return;
    }

    const nombrePerfil = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
    const nombreCuenta = user.email?.split("@")[0] || "Usuario";
    setNombreUsuario(nombrePerfil || nombreCuenta);

    const fecha = todayLocal();
    const bounds = localDayBounds();
    const [walletRes, settingsRes, salesRes, completedRes, createdRes, pendingRes, historyRes, closureRes] = await Promise.all([
      supabase.from("wallets").select("working_capital,house_fund,goal_balance").eq("user_id", user.id).single(),
      supabase.from("settings").select("goal_amount,daily_unit_goal,mp1,mp2,mp3,daily_house_amount,require_no_pending_to_close").eq("user_id", user.id).single(),
      supabase.from("sales").select("id,client_name,sale_time,price,status").eq("user_id", user.id).eq("sale_date", fecha).neq("status", "eliminada").order("sale_time", { ascending: true }),
      supabase.from("sales").select("id,price").eq("user_id", user.id).eq("status", "completada").gte("completed_at", bounds.start).lt("completed_at", bounds.end),
      supabase.from("sales").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", bounds.start).lt("created_at", bounds.end).neq("status", "eliminada"),
      supabase.from("sales").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pendiente"),
      supabase.from("transaction_history").select("id,description,amount,direction,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("daily_closures").select("id").eq("user_id", user.id).eq("business_date", fecha).maybeSingle()
    ]);

    const firstError = walletRes.error || settingsRes.error || salesRes.error || completedRes.error || createdRes.error || pendingRes.error || historyRes.error || closureRes.error;
    if (firstError) setMensaje(firstError.message);

    const sales = salesRes.data ?? [];
    const completedTodayRows = completedRes.data ?? [];
    const gross = completedTodayRows.reduce((sum, sale) => sum + Number(sale.price), 0);

    setData({
      workingCapital: Number(walletRes.data?.working_capital ?? 0),
      houseFund: Number(walletRes.data?.house_fund ?? 0),
      goalBalance: Number(walletRes.data?.goal_balance ?? 0),
      goalAmount: Number(settingsRes.data?.goal_amount ?? 0),
      dailyUnitGoal: Number(settingsRes.data?.daily_unit_goal ?? 12),
      mp1: Number(settingsRes.data?.mp1 ?? 0),
      mp2: Number(settingsRes.data?.mp2 ?? 0),
      mp3: Number(settingsRes.data?.mp3 ?? 0),
      dailyHouseAmount: Number(settingsRes.data?.daily_house_amount ?? 0),
      requireNoPendingToClose: Boolean(settingsRes.data?.require_no_pending_to_close ?? true),
      grossToday: gross,
      completedToday: completedTodayRows.length,
      createdToday: createdRes.count ?? 0,
      totalPending: pendingRes.count ?? 0,
      closedToday: Boolean(closureRes.data),
      salesToday: sales,
      recent: historyRes.data ?? []
    });
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
    try {
      setMostrarBruto(localStorage.getItem("og-show-gross") !== "0");
      setMostrarCapital(localStorage.getItem("og-show-capital") !== "0");
      setMostrarCasa(localStorage.getItem("og-show-house") !== "0");
    } catch {}
  }, [cargar]);

  function toggleMonto(tipo: "gross" | "capital" | "house", actual: boolean) {
    const siguiente = !actual;
    if (tipo === "gross") setMostrarBruto(siguiente);
    if (tipo === "capital") setMostrarCapital(siguiente);
    if (tipo === "house") setMostrarCasa(siguiente);
    try { localStorage.setItem(`og-show-${tipo}`, siguiente ? "1" : "0"); } catch {}
  }

  const progresoMeta = data.goalAmount > 0 ? Math.min((data.goalBalance / data.goalAmount) * 100, 100) : 0;
  const progresoUnidades = data.dailyUnitGoal > 0 ? Math.min((data.createdToday / data.dailyUnitGoal) * 100, 100) : 0;
  const agendaPendiente = useMemo(() => data.salesToday.filter(v => v.status === "pendiente"), [data.salesToday]);
  const capitalPorVenta = data.mp1 + data.mp2 + data.mp3;
  const capitalCierre = data.completedToday * capitalPorVenta;
  const disponibleDespuesCapital = Math.max(data.grossToday - capitalCierre, 0);
  const casaCierre = Math.min(data.dailyHouseAmount, disponibleDespuesCapital);
  const metaCierre = Math.max(data.grossToday - capitalCierre - casaCierre, 0);
  const cierreInvalidoPorCapital = data.grossToday < capitalCierre;
  const cierreInvalidoPorPendientes = data.requireNoPendingToClose && agendaPendiente.length > 0;

  async function cerrarDia() {
    if (data.closedToday || cerrando) return;
    setCerrando(true);
    setMensaje("");
    const supabase = createClient();
    const { error } = await supabase.rpc("close_business_day", { p_business_date: todayLocal() });
    if (error) {
      setMensaje(error.message);
      setCerrando(false);
      return;
    }
    setMensaje("Día cerrado correctamente. El dinero fue distribuido según tu configuración.");
    setMostrarCierre(false);
    setCerrando(false);
    await cargar();
  }

  return (
    <AuthGuard>
      <main className="shell">
        <Nav />
        <section className="home-greeting" aria-label="Saludo del usuario">
          <div className="home-greeting-title">Hola, {nombreUsuario}</div>
          <div className="home-greeting-subtitle">Bienvenido de nuevo</div>
        </section>
        {mensaje && <div className="card error-message">{mensaje}</div>}

        <section className="hero privacy-card">
          <button
            className="amount-eye hero-eye"
            type="button"
            onClick={() => toggleMonto("gross", mostrarBruto)}
            aria-label={mostrarBruto ? "Ocultar monto bruto" : "Mostrar monto bruto"}
            title={mostrarBruto ? "Ocultar monto" : "Mostrar monto"}
          >
            <EyeIcon open={mostrarBruto} />
          </button>
          <div className="hero-label">Monto bruto de hoy</div>
          <div className="hero-amount">{cargando ? "…" : mostrarBruto ? `RD$${money(data.grossToday)}` : "RD$••••••"}</div>
        </section>

        <section className="home-money-layout">
          <div className="home-money-row">
            <div className="card compact-money-card privacy-card">
              <button
                className="amount-eye"
                type="button"
                onClick={() => toggleMonto("capital", mostrarCapital)}
                aria-label={mostrarCapital ? "Ocultar capital" : "Mostrar capital"}
                title={mostrarCapital ? "Ocultar monto" : "Mostrar monto"}
              >
                <EyeIcon open={mostrarCapital} />
              </button>
              <h3>Capital de trabajo</h3>
              <div className="amount">{mostrarCapital ? `RD$${money(data.workingCapital)}` : "RD$••••••"}</div>
              <div className="card-action"><a className="btn secondary" href="/capital">Retirar</a></div>
            </div>
            <div className="card compact-money-card privacy-card">
              <button
                className="amount-eye"
                type="button"
                onClick={() => toggleMonto("house", mostrarCasa)}
                aria-label={mostrarCasa ? "Ocultar Casa" : "Mostrar Casa"}
                title={mostrarCasa ? "Ocultar monto" : "Mostrar monto"}
              >
                <EyeIcon open={mostrarCasa} />
              </button>
              <h3>Casa</h3>
              <div className="amount">{mostrarCasa ? `RD$${money(data.houseFund)}` : "RD$••••••"}</div>
              <div className="card-action"><a className="btn secondary" href="/casa">Retirar</a></div>
            </div>
          </div>

          <div className="card goal-card-wide">
            <h3>Meta financiera</h3>
            <div className="amount">{progresoMeta.toFixed(1)}%</div>
            <div className="progress"><div style={{width: `${progresoMeta}%`}} /></div>
          </div>
        </section>

        <div className="close-day-button-wrap">
          {data.closedToday ? (
            <button className="btn close-day-button" type="button" disabled>Día cerrado ✓</button>
          ) : (
            <button
              className="btn close-day-button"
              type="button"
              onClick={() => setMostrarCierre(true)}
              disabled={cargando || cerrando || data.completedToday === 0}
            >
              Cerrar día
            </button>
          )}
        </div>


        {mostrarCierre && !data.closedToday && (
          <div className="modal-backdrop" role="presentation" onMouseDown={() => !cerrando && setMostrarCierre(false)}>
            <section className="close-preview-modal" role="dialog" aria-modal="true" aria-labelledby="close-preview-title" onMouseDown={e => e.stopPropagation()}>
              <div className="close-preview-kicker">Resumen antes de confirmar</div>
              <h2 id="close-preview-title">Cierre del día</h2>
              <div className="close-preview-grid">
                <div><span>Capital de trabajo</span><strong>RD${money(capitalCierre)}</strong></div>
                <div><span>Casa</span><strong>RD${money(casaCierre)}</strong></div>
                <div className="close-preview-goal"><span>Meta</span><strong>RD${money(metaCierre)}</strong></div>
              </div>
              <div className="close-preview-note">{data.completedToday} orden{data.completedToday === 1 ? "" : "es"} completada{data.completedToday === 1 ? "" : "s"} hoy.</div>
              {cierreInvalidoPorPendientes && <div className="close-preview-warning">Hay citas pendientes de hoy. Tu configuración impide cerrar el día hasta completarlas o cancelarlas.</div>}
              {cierreInvalidoPorCapital && <div className="close-preview-warning">El monto bruto no cubre el costo configurado de materias primas.</div>}
              <div className="close-preview-actions">
                <button className="btn secondary" type="button" onClick={() => setMostrarCierre(false)} disabled={cerrando}>Cancelar</button>
                <button className="btn" type="button" onClick={() => void cerrarDia()} disabled={cerrando || cierreInvalidoPorPendientes || cierreInvalidoPorCapital}>
                  {cerrando ? "Cerrando…" : "Confirmar cierre"}
                </button>
              </div>
            </section>
          </div>
        )}

        <h2 className="section-title">Meta diaria</h2>
        <div className="card">
          <div className="amount">{data.createdToday} / {data.dailyUnitGoal} citas nuevas</div>
          <div className="progress"><div style={{width: `${progresoUnidades}%`}} /></div>
          <div className="muted small-text">Se reinicia cada día; las citas permanecen guardadas.</div>
        </div>

        <h2 className="section-title">Agenda de hoy</h2>
        {agendaPendiente.length === 0 ? (
          <div className="card muted">No hay ventas pendientes para hoy.</div>
        ) : agendaPendiente.slice(0, 4).map(v => (
          <a className="sale-row" href="/agenda" key={v.id}>
            <div className="sale-main"><div className="sale-name">{v.client_name}</div><div className="sale-time">{v.sale_time.slice(0, 5)} · RD${money(v.price)}</div></div>
            <span className="status status-pendiente">pendiente</span>
          </a>
        ))}

        <h2 className="section-title">Actividad reciente</h2>
        {data.recent.length === 0 ? <div className="card muted">Sin movimientos recientes.</div> : (
          <div className="card history-list">
            {data.recent.map(item => (
              <div className="history-item" key={item.id}>
                <div><strong>{item.description}</strong><div className="muted small-text">{new Date(item.created_at).toLocaleString("es-DO")}</div></div>
                <div className={item.direction === "gasto" ? "money-negative" : item.direction === "ingreso" ? "money-positive" : ""}>RD${money(item.amount)}</div>
              </div>
            ))}
          </div>
        )}

        <footer className="home-footer-pending">Pendiente: {cargando ? "…" : data.totalPending}</footer>
        <FloatingAdd />
      </main>
    </AuthGuard>
  );
}
