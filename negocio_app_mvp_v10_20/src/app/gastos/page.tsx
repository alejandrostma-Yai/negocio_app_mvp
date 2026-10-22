"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";

type Expense = { id: string; amount: number | string; description: string; created_at: string };

function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function periodBounds(mode: string) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (mode === "weekly") {
    const day = start.getDay();
    start.setDate(start.getDate() + (day === 0 ? -6 : 1-day));
  }
  const end = new Date(start);
  end.setDate(end.getDate() + (mode === "weekly" ? 7 : 1));
  return { start: start.toISOString(), end: end.toISOString(), label: mode === "weekly" ? "esta semana" : "hoy" };
}
function money(v: number) { return v.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function GastosPage() {
  const [mode,setMode] = useState("daily");
  const [gross,setGross] = useState(0);
  const [expenses,setExpenses] = useState<Expense[]>([]);
  const [amount,setAmount] = useState("");
  const [description,setDescription] = useState("");
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: settings } = await supabase.from("settings").select("close_mode").eq("user_id",user.id).single();
    const currentMode = settings?.close_mode === "weekly" ? "weekly" : "daily";
    setMode(currentMode);
    const bounds = periodBounds(currentMode);
    const [salesRes, expenseRes] = await Promise.all([
      supabase.from("sales").select("price").eq("user_id",user.id).eq("company_id",2).eq("status","completada").gte("completed_at",bounds.start).lt("completed_at",bounds.end),
      supabase.from("business_expenses").select("id,amount,description,created_at").eq("user_id",user.id).eq("company_id",2).gte("created_at",bounds.start).lt("created_at",bounds.end).order("created_at",{ascending:false})
    ]);
    if (salesRes.error || expenseRes.error) { setMessage((salesRes.error || expenseRes.error)?.message || "No se pudieron cargar los datos."); return; }
    setGross((salesRes.data || []).reduce((sum,row)=>sum+Number(row.price),0));
    setExpenses((expenseRes.data || []) as Expense[]);
  },[]);

  useEffect(()=>{ void load(); },[load]);

  const total = expenses.reduce((sum,e)=>sum+Number(e.amount),0);
  const available = Math.max(gross-total,0);

  async function saveExpense() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) { setMessage("Escribe un monto válido."); return; }
    if (!description.trim()) { setMessage("Escribe el concepto del gasto."); return; }
    if (n > available) { setMessage("El gasto supera el monto bruto disponible del período."); return; }
    setBusy(true); setMessage("");
    const supabase = createClient();
    const { error } = await supabase.rpc("register_business_expense",{p_amount:n,p_description:description.trim(),p_company_id:2});
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setAmount(""); setDescription(""); setMessage("Gasto registrado."); await load();
  }

  return <AuthGuard><main className="shell"><Nav /><section className="page-header"><Link href="/">← Volver</Link><h1>Gastos e historial de retiros</h1><p className="muted">Período según la configuración: {mode === "weekly" ? "cierre semanal" : "cierre diario"}.</p></section>
    {message && <p role="status" className="notice">{message}</p>}
    <section className="home-money-layout" style={{marginBottom:16}}>
      <div className="card"><span className="muted">Ventas brutas del período</span><h2>RD${money(gross)}</h2></div>
      <div className="card"><span className="muted">Total de gastos</span><h2>− RD${money(total)}</h2></div>
      <div className="card"><span className="muted">Bruto disponible</span><h2>RD${money(available)}</h2></div>
    </section>
    <section className="card" style={{padding:16,marginBottom:16}}>
      <h2>Registrar retiro o gasto</h2>
      <div className="field"><label htmlFor="expense-description">Concepto</label><input id="expense-description" value={description} maxLength={100} onChange={e=>setDescription(e.target.value)} placeholder="Ej. transporte, material..." /></div>
      <div className="field"><label htmlFor="expense-amount">Monto (RD$)</label><input id="expense-amount" type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" /></div>
      <button className="btn" onClick={()=>void saveExpense()} disabled={busy}>{busy ? "Guardando..." : "Guardar gasto"}</button>
    </section>
    <section className="card" style={{padding:16}}>
      <h2>Historial de retiros</h2>
      {expenses.length===0 ? <p className="muted">No hay gastos registrados en este período.</p> : <div className="list">{expenses.map(e=><div key={e.id} className="list-row" style={{display:"flex",justifyContent:"space-between",gap:12,padding:"12px 0",borderBottom:"1px solid var(--border, #ddd)"}}><div><strong>{e.description}</strong><div className="muted">{new Date(e.created_at).toLocaleString("es-DO")}</div></div><strong>− RD${money(Number(e.amount))}</strong></div>)}</div>}
    </section>
  </main></AuthGuard>;
}
