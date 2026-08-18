"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";

function money(v: number) { return v.toLocaleString("es-DO", { maximumFractionDigits: 2 }); }

export default function CasaPage() {
  const [saldo, setSaldo] = useState(0);
  const [monto, setMonto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.replace("/login"); return; }
    const { data, error } = await supabase.from("wallets").select("house_fund").eq("user_id", user.id).single();
    if (error) setMensaje(error.message);
    setSaldo(Number(data?.house_fund ?? 0)); setCargando(false);
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  async function registrar(e: FormEvent) {
    e.preventDefault();
    const valor = Number(monto);
    if (!(valor > 0) || guardando) return;
    if (valor > saldo) { setMensaje("El gasto no puede ser mayor que el fondo de casa disponible."); return; }
    setGuardando(true); setMensaje("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.replace("/login"); return; }

    const { error: expenseError } = await supabase.from("house_expenses").insert({ user_id: user.id, amount: valor });
    if (expenseError) { setMensaje(expenseError.message); setGuardando(false); return; }

    const nuevoSaldo = saldo - valor;
    const { error: walletError } = await supabase.from("wallets").update({ house_fund: nuevoSaldo, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    if (walletError) { setMensaje(walletError.message); setGuardando(false); return; }

    await supabase.from("transaction_history").insert({ user_id: user.id, type: "gasto_casa", amount: valor, direction: "gasto", description: "Gasto de casa" });
    setSaldo(nuevoSaldo); setMonto(""); setMensaje("Gasto registrado."); setGuardando(false);
  }

  return (
    <AuthGuard>
      <main className="shell">
        <Nav />
        <form className="form" onSubmit={registrar}>
          <h1>Fondo de casa</h1>
          <div className="card" style={{marginBottom:16}}><h3>Saldo disponible</h3><div className="amount">{cargando ? "…" : `RD$${money(saldo)}`}</div></div>
          <div className="field"><label>Monto gastado (RD$)</label><input type="number" min="0.01" step="0.01" inputMode="decimal" value={monto} onChange={e => setMonto(e.target.value)} /></div>
          <button className="btn" type="submit" disabled={guardando || Number(monto) <= 0}>{guardando ? "Guardando..." : "Registrar gasto"}</button>
          {mensaje && <p className="form-message">{mensaje}</p>}
        </form>
      </main>
    </AuthGuard>
  );
}
