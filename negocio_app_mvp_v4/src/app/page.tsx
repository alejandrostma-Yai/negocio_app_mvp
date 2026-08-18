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
  salesToday: { id: string; client_name: string; sale_time: string; price: number | string; status: string }[];
  recent: { id: string; description: string; amount: number | string; direction: string; created_at: string }[];
};

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
  salesToday: [],
  recent: []
};

export default function Home() {
  const [data, setData] = useState<DashboardData>(initial);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

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
    const [walletRes, settingsRes, salesRes, historyRes] = await Promise.all([
      supabase.from("wallets").select("working_capital,house_fund,goal_balance").eq("user_id", user.id).single(),
      supabase.from("settings").select("goal_amount,daily_unit_goal").eq("user_id", user.id).single(),
      supabase.from("sales").select("id,client_name,sale_time,price,status").eq("user_id", user.id).eq("sale_date", fecha).neq("status", "eliminada").order("sale_time", { ascending: true }),
      supabase.from("transaction_history").select("id,description,amount,direction,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5)
    ]);

    const firstError = walletRes.error || settingsRes.error || salesRes.error || historyRes.error;
    if (firstError) setMensaje(firstError.message);

    const sales = salesRes.data ?? [];
    const completed = sales.filter(s => s.status === "completada");
    const gross = completed.reduce((sum, s) => sum + Number(s.price), 0);

    setData({
      workingCapital: Number(walletRes.data?.working_capital ?? 0),
      houseFund: Number(walletRes.data?.house_fund ?? 0),
      goalBalance: Number(walletRes.data?.goal_balance ?? 0),
      goalAmount: Number(settingsRes.data?.goal_amount ?? 2150538),
      dailyUnitGoal: Number(settingsRes.data?.daily_unit_goal ?? 12),
      grossToday: gross,
      completedToday: completed.length,
      salesToday: sales,
      recent: historyRes.data ?? []
    });
    setCargando(false);
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const progresoMeta = data.goalAmount > 0 ? Math.min((data.goalBalance / data.goalAmount) * 100, 100) : 0;
  const progresoUnidades = data.dailyUnitGoal > 0 ? Math.min((data.completedToday / data.dailyUnitGoal) * 100, 100) : 0;
  const agendaPendiente = useMemo(() => data.salesToday.filter(v => v.status === "pendiente"), [data.salesToday]);

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
            <div style={{marginTop: 10}}><a className="btn secondary" href="/capital">Modificar</a></div>
          </div>
          <div className="card"><h3>Fondo de casa</h3><div className="amount">RD${money(data.houseFund)}</div></div>
          <div className="card">
            <h3>Meta financiera</h3>
            <div className="amount">RD${money(data.goalBalance)}</div>
            <div className="progress"><div style={{width: `${progresoMeta}%`}} /></div>
            <div className="muted small-text">Objetivo: RD${money(data.goalAmount)}</div>
          </div>
        </section>

        <h2 className="section-title">Meta diaria</h2>
        <div className="card">
          <div className="amount">{data.completedToday} / {data.dailyUnitGoal} unidades</div>
          <div className="progress"><div style={{width: `${progresoUnidades}%`}} /></div>
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

        <FloatingAdd />
      </main>
    </AuthGuard>
  );
}
