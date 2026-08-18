"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";

function money(v: number) { return v.toLocaleString("es-DO", { maximumFractionDigits: 2 }); }

export default function CapitalPage() {
  const [saldo, setSaldo] = useState(0);
  const [monto, setMonto] = useState("");
  const [nota, setNota] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.replace("/login"); return; }
    const { data, error } = await supabase.from("wallets").select("working_capital").eq("user_id", user.id).single();
    if (error) setMensaje(error.message);
    setSaldo(Number(data?.working_capital ?? 0));
    setCargando(false);
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  async function registrar(e: FormEvent) {
    e.preventDefault();
    const valor = Number(monto);
    if (!(valor > 0) || guardando) return;
    setGuardando(true); setMensaje("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.replace("/login"); return; }

    const nuevoSaldo = saldo + valor;
    const { error } = await supabase.from("wallets").update({ working_capital: nuevoSaldo, updated_at: new Date().toISOString() }).eq("user_id", user.id);
    if (!error) {
      await supabase.from("transaction_history").insert({ user_id: user.id, type: "capital_agregado", amount: valor, direction: "ingreso", description: nota.trim() || "Capital agregado" });
      setMonto(""); setNota(""); setSaldo(nuevoSaldo); setMensaje("Capital actualizado.");
    } else setMensaje(error.message);
    setGuardando(false);
  }

  return (
    <AuthGuard>
      <main className="shell">
        <Nav />
        <form className="form" onSubmit={registrar}>
          <h1>Capital de trabajo</h1>
          <div className="card" style={{marginBottom:16}}><h3>Saldo actual</h3><div className="amount">{cargando ? "…" : `RD$${money(saldo)}`}</div></div>
          <div className="field"><label>Agregar capital (RD$)</label><input type="number" min="0.01" step="0.01" inputMode="decimal" value={monto} onChange={e=>setMonto(e.target.value)} /></div>
          <div className="field"><label>Nota (opcional)</label><input value={nota} onChange={e=>setNota(e.target.value)} /></div>
          <button className="btn" type="submit" disabled={guardando || Number(monto)<=0}>{guardando ? "Guardando..." : "Agregar capital"}</button>
          {mensaje && <p className="form-message">{mensaje}</p>}
        </form>
      </main>
    </AuthGuard>
  );
}
