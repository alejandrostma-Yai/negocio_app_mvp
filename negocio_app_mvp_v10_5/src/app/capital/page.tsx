"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";

function money(v: number) { return v.toLocaleString("es-DO", { maximumFractionDigits: 2 }); }

type Accion = "agregar" | "retirar";

export default function CapitalPage() {
  const [saldo, setSaldo] = useState(0);
  const [accion, setAccion] = useState<Accion>("agregar");
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
  useRealtimeRefresh(cargar);

  function cambiarAccion(nueva: Accion) {
    if (guardando) return;
    setAccion(nueva);
    setMonto("");
    setNota("");
    setMensaje("");
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    const valor = Number(monto);
    if (!(valor > 0) || guardando) return;
    if (accion === "retirar" && valor > saldo) {
      setMensaje("El retiro no puede ser mayor que el capital disponible.");
      return;
    }

    setGuardando(true);
    setMensaje("");
    const supabase = createClient();
    const rpc = accion === "agregar" ? "add_working_capital" : "withdraw_working_capital";
    const { error } = await supabase.rpc(rpc, {
      p_amount: valor,
      p_note: nota.trim() || null
    });

    if (error) {
      setMensaje(error.message);
    } else {
      setMonto("");
      setNota("");
      setMensaje(accion === "agregar" ? "Dinero agregado al capital correctamente." : "Retiro de capital registrado.");
      await cargar();
    }
    setGuardando(false);
  }

  return (
    <AuthGuard>
      <main className="shell">
        <Nav />
        <form className="form" onSubmit={guardar}>
          <h1>Capital de trabajo</h1>
          <div className="card" style={{marginBottom:16}}>
            <h3>Saldo disponible</h3>
            <div className="amount">{cargando ? "…" : `RD$${money(saldo)}`}</div>
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16}}>
            <button className={accion === "agregar" ? "btn" : "btn secondary"} type="button" onClick={() => cambiarAccion("agregar")}>
              Agregar dinero
            </button>
            <button className={accion === "retirar" ? "btn" : "btn secondary"} type="button" onClick={() => cambiarAccion("retirar")}>
              Retirar
            </button>
          </div>

          <div className="field">
            <label>{accion === "agregar" ? "Monto a agregar (RD$)" : "Monto a retirar (RD$)"}</label>
            <input type="number" min="0.01" step="0.01" inputMode="decimal" value={monto} onChange={e=>setMonto(e.target.value)} />
          </div>
          <div className="field"><label>Nota (opcional)</label><input value={nota} onChange={e=>setNota(e.target.value)} /></div>
          <button className="btn" type="submit" disabled={guardando || Number(monto)<=0}>
            {guardando ? (accion === "agregar" ? "Agregando..." : "Retirando...") : (accion === "agregar" ? "Agregar al capital" : "Retirar")}
          </button>
          {accion === "agregar" && <p className="muted" style={{marginTop:10}}>Este aporte aumenta únicamente el Capital de trabajo. No suma al monto bruto ni se vuelve a dividir entre Capital, Casa y Meta.</p>}
          {mensaje && <p className="form-message">{mensaje}</p>}
        </form>
      </main>
    </AuthGuard>
  );
}
