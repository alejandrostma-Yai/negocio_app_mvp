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
  goalAmount: 2150538,
  dailyUnitGoal: 12,
  grossToday: 0,
  completedToday: 0,
  createdToday: 0,
  totalPending: 0,
  closedToday: false,
  salesToday: [],
  recent: []
};

export default function Home() {
  const [data, setData] = useState<DashboardData>(initial);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [cerrando, setCerrando] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.replace("/login");
      return;
    }

    const fecha = todayLocal();
    const bounds = localDayBounds();
    const [walletRes, settingsRes, salesRes, completedRes, createdRes, pendingRes, historyRes, closureRes] = await Promise.all([
      supabase.from("wallets").select("working_capital,house_fund,goal_balance").eq("user_id", user.id).single(),
      supabase.from("settings").select("goal_amount,daily_unit_goal").eq("user_id", user.id).single(),
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
      goalAmount: Number(settingsRes.data?.goal_amount ?? 2150538),
      dailyUnitGoal: Number(settingsRes.data?.daily_unit_goal ?? 12),
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

  useEffect(() => { void cargar(); }, [cargar]);

  const progresoMeta = data.goalAmount > 0 ? Math.min((data.goalBalance / data.goalAmount) * 100, 100) : 0;
  const progresoUnidades = data.dailyUnitGoal > 0 ? Math.min((data.createdToday / data.dailyUnitGoal) * 100, 100) : 0;
  const agendaPendiente = useMemo(() => data.salesToday.filter(v => v.status === "pendiente"), [data.salesToday]);

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
    setCerrando(false);
    await cargar();
  }

  return (
    <AuthGuard>
      <main className="shell">
        <Nav />
        {mensaje && <div className="card error-message">{mensaje}</div>}

        <section className="hero">
          <div className="hero-label">Monto bruto de hoy</div>
          <div className="hero-amount">{cargando ? "…" : `RD$${money(data.grossToday)}`}</div>
        </section>

        <section className="grid">
          <div className="card">
            <h3>Capital de trabajo</h3>
            <div className="amount">RD${money(data.workingCapital)}</div>
            <div style={{marginTop: 10}}><a className="btn secondary" href="/capital">Retirar</a></div>
          </div>
          <div className="card">
            <h3>Casa</h3>
            <div className="amount">RD${money(data.houseFund)}</div>
            <div style={{marginTop: 10}}><a className="btn secondary" href="/casa">Retirar</a></div>
          </div>
          <div className="card">
            <h3>Meta financiera</h3>
            <div className="amount">{progresoMeta.toFixed(1)}%</div>
            <div className="progress"><div style={{width: `${progresoMeta}%`}} /></div>
          </div>
        </section>

        <div className="card close-day-inline">
          <strong>Cierre del día</strong>
          {data.closedToday ? (
            <span className="close-day-done">Día cerrado ✓</span>
          ) : (
            <button
              className="btn"
              type="button"
              onClick={() => {
                if (window.confirm("¿Cerrar el día y distribuir las ventas completadas según tu configuración?")) void cerrarDia();
              }}
              disabled={cargando || cerrando || data.completedToday === 0}
            >
              {cerrando ? "Cerrando…" : "Cerrar día"}
            </button>
          )}
        </div>

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
