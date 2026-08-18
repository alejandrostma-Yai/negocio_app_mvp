"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";

export default function CasaPage() {
  const [monto, setMonto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function registrar() {
    const valor = Number(monto);
    if (!(valor > 0)) return;

    setCargando(true);
    setMensaje("");
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { error: expenseError } = await supabase.from("house_expenses").insert({
      user_id: user.id,
      amount: valor
    });

    if (expenseError) {
      setMensaje(expenseError.message);
      setCargando(false);
      return;
    }

    const { data: wallet } = await supabase
      .from("wallets")
      .select("house_fund")
      .eq("user_id", user.id)
      .single();

    const { error: walletError } = await supabase
      .from("wallets")
      .update({ house_fund: Number(wallet?.house_fund ?? 0) - valor })
      .eq("user_id", user.id);

    if (!walletError) {
      await supabase.from("transaction_history").insert({
        user_id: user.id,
        type: "gasto_casa",
        amount: valor,
        direction: "gasto",
        description: "Gasto de casa"
      });
      setMonto("");
      setMensaje("Gasto registrado.");
    } else {
      setMensaje(walletError.message);
    }

    setCargando(false);
  }

  return (
    <AuthGuard>
    <main className="shell">
      <Nav />
      <div className="form">
        <h1>Fondo de casa</h1>
        <div className="field">
          <label>Monto gastado (RD$)</label>
          <input inputMode="decimal" value={monto} onChange={e => setMonto(e.target.value)} />
        </div>
        <button className="btn" onClick={registrar} disabled={cargando || Number(monto) <= 0}>
          {cargando ? "Guardando..." : "Registrar gasto"}
        </button>
        {mensaje && <p>{mensaje}</p>}
      </div>
    </main>
    </AuthGuard>
  );
}
