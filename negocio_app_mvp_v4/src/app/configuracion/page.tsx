"use client";

import { FormEvent, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";

export default function ConfiguracionPage() {
  const [mp1, setMp1] = useState("");
  const [mp2, setMp2] = useState("");
  const [mp3, setMp3] = useState("");
  const [casa, setCasa] = useState("");
  const [metaNombre, setMetaNombre] = useState("");
  const [metaMonto, setMetaMonto] = useState("");
  const [metaUnidades, setMetaUnidades] = useState("");
  const [obligarPendientes, setObligarPendientes] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    async function cargar() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.replace("/login"); return; }
      const { data, error } = await supabase.from("settings").select("*").eq("user_id", user.id).single();
      if (error) setMensaje(error.message);
      if (data) {
        setMp1(String(data.mp1)); setMp2(String(data.mp2)); setMp3(String(data.mp3));
        setCasa(String(data.daily_house_amount)); setMetaNombre(data.goal_name ?? "Meta principal");
        setMetaMonto(String(data.goal_amount)); setMetaUnidades(String(data.daily_unit_goal));
        setObligarPendientes(Boolean(data.require_no_pending_to_close));
      }
      setCargando(false);
    }
    void cargar();
  }, []);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true); setMensaje("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.replace("/login"); return; }

    const values = [Number(mp1), Number(mp2), Number(mp3), Number(casa), Number(metaMonto), Number(metaUnidades)];
    if (values.some(v => !Number.isFinite(v) || v < 0) || Number(metaUnidades) < 1 || !metaNombre.trim()) {
      setMensaje("Revisa los valores de configuración."); setGuardando(false); return;
    }

    const { error } = await supabase.from("settings").update({
      mp1: Number(mp1), mp2: Number(mp2), mp3: Number(mp3),
      daily_house_amount: Number(casa), goal_name: metaNombre.trim(), goal_amount: Number(metaMonto),
      daily_unit_goal: Number(metaUnidades), require_no_pending_to_close: obligarPendientes,
      updated_at: new Date().toISOString()
    }).eq("user_id", user.id);

    setMensaje(error ? error.message : "Configuración guardada.");
    setGuardando(false);
  }

  return (
    <AuthGuard>
      <main className="shell">
        <Nav />
        <form className="form" onSubmit={guardar}>
          <h1>Configuración</h1>
          {cargando ? <div className="card muted">Cargando configuración…</div> : <>
            <div className="field"><label>Materia prima 1 por unidad</label><input type="number" step="0.01" min="0" value={mp1} onChange={e=>setMp1(e.target.value)} /></div>
            <div className="field"><label>Materia prima 2 por unidad</label><input type="number" step="0.01" min="0" value={mp2} onChange={e=>setMp2(e.target.value)} /></div>
            <div className="field"><label>Materia prima 3 por unidad</label><input type="number" step="0.01" min="0" value={mp3} onChange={e=>setMp3(e.target.value)} /></div>
            <div className="field"><label>Monto diario de casa</label><input type="number" step="0.01" min="0" value={casa} onChange={e=>setCasa(e.target.value)} /></div>
            <div className="field"><label>Nombre de la meta</label><input value={metaNombre} onChange={e=>setMetaNombre(e.target.value)} /></div>
            <div className="field"><label>Monto de la meta</label><input type="number" step="0.01" min="0" value={metaMonto} onChange={e=>setMetaMonto(e.target.value)} /></div>
            <div className="field"><label>Meta diaria de unidades</label><input type="number" step="1" min="1" value={metaUnidades} onChange={e=>setMetaUnidades(e.target.value)} /></div>
            <label className="checkbox-row"><input type="checkbox" checked={obligarPendientes} onChange={e=>setObligarPendientes(e.target.checked)} /> Impedir cierre del día si quedan ventas pendientes</label>
            <button className="btn" disabled={guardando}>{guardando ? "Guardando..." : "Guardar configuración"}</button>
          </>}
          {mensaje && <p className="form-message">{mensaje}</p>}
        </form>
      </main>
    </AuthGuard>
  );
}
