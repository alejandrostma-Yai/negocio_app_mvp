"use client";

import { FormEvent, useEffect, useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";

type ThemePreference = "dark" | "light" | "system";

function applyTheme(preference: ThemePreference) {
  localStorage.setItem("og-theme", preference);
  const resolved = preference === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : preference;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themePreference = preference;
}

export default function ConfiguracionPage() {
  const [mp1, setMp1] = useState("");
  const [mp2, setMp2] = useState("");
  const [mp3, setMp3] = useState("");
  const [casa, setCasa] = useState("");
  const [metaNombre, setMetaNombre] = useState("");
  const [metaMonto, setMetaMonto] = useState("");
  const [metaUnidades, setMetaUnidades] = useState("");
  const [obligarPendientes, setObligarPendientes] = useState(true);
  const [notaInicio, setNotaInicio] = useState("");
  const [tema, setTema] = useState<ThemePreference>("dark");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [nuevaClave, setNuevaClave] = useState("");
  const [confirmarClave, setConfirmarClave] = useState("");
  const [cambiandoClave, setCambiandoClave] = useState(false);
  const [mensajeClave, setMensajeClave] = useState("");
  const [resetPaso, setResetPaso] = useState<0 | 1 | 2>(0);
  const [reseteando, setReseteando] = useState(false);
  const [mensajeReset, setMensajeReset] = useState("");

  useEffect(() => {
    async function cargar() {
      const storedTheme = (localStorage.getItem("og-theme") || "dark") as ThemePreference;
      if (["dark", "light", "system"].includes(storedTheme)) setTema(storedTheme);

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
        setNotaInicio(String(data.home_note ?? ""));
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
      home_note: notaInicio.trim() || null,
      updated_at: new Date().toISOString()
    }).eq("user_id", user.id);

    setMensaje(error ? error.message : "Configuración guardada.");
    setGuardando(false);
  }

  function cambiarTema(value: ThemePreference) {
    setTema(value);
    applyTheme(value);
  }

  async function cambiarClave(e: FormEvent) {
    e.preventDefault();
    setMensajeClave("");
    if (nuevaClave.length < 8) {
      setMensajeClave("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (nuevaClave !== confirmarClave) {
      setMensajeClave("Las contraseñas no coinciden.");
      return;
    }

    setCambiandoClave(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: nuevaClave });
    if (error) {
      setMensajeClave(error.message);
    } else {
      setNuevaClave("");
      setConfirmarClave("");
      setMensajeClave("Contraseña actualizada correctamente.");
    }
    setCambiandoClave(false);
  }

  async function restablecerNegocio() {
    if (reseteando) return;
    setReseteando(true);
    setMensajeReset("");
    const supabase = createClient();
    const { error } = await supabase.rpc("reset_business_data");
    if (error) {
      setMensajeReset(error.message);
    } else {
      setMensajeReset("Negocio restablecido. Los saldos y el historial quedaron en cero; tu configuración se conservó.");
      setResetPaso(0);
    }
    setReseteando(false);
  }

  return (
    <AuthGuard>
      <main className="shell">
        <Nav />
        <div className="page-heading-row"><h1>Configuración</h1></div>

        <section className="settings-section">
          <div className="settings-section-head">
            <div>
              <h2>Apariencia</h2>
              <p>Elige cómo quieres ver OG en este dispositivo.</p>
            </div>
          </div>
          <div className="theme-switcher" role="group" aria-label="Tema de la aplicación">
            {(["dark", "light", "system"] as ThemePreference[]).map(value => (
              <button
                type="button"
                key={value}
                className={tema === value ? "active" : ""}
                onClick={() => cambiarTema(value)}
              >
                {value === "dark" ? "Oscuro" : value === "light" ? "Claro" : "Sistema"}
              </button>
            ))}
          </div>
        </section>

        <form className="settings-section" onSubmit={guardar}>
          <div className="settings-section-head">
            <div>
              <h2>Negocio</h2>
              <p>Estos valores se usan para metas y cierre del día.</p>
            </div>
          </div>
          {cargando ? <div className="card muted">Cargando configuración…</div> : <>
            <div className="settings-grid">
              <div className="field"><label>Materia prima 1 por unidad</label><input type="number" step="0.01" min="0" value={mp1} onChange={e=>setMp1(e.target.value)} /></div>
              <div className="field"><label>Materia prima 2 por unidad</label><input type="number" step="0.01" min="0" value={mp2} onChange={e=>setMp2(e.target.value)} /></div>
              <div className="field"><label>Materia prima 3 por unidad</label><input type="number" step="0.01" min="0" value={mp3} onChange={e=>setMp3(e.target.value)} /></div>
              <div className="field"><label>Monto diario de casa</label><input type="number" step="0.01" min="0" value={casa} onChange={e=>setCasa(e.target.value)} /></div>
              <div className="field"><label>Nombre de la meta</label><input value={metaNombre} onChange={e=>setMetaNombre(e.target.value)} /></div>
              <div className="field"><label>Monto de la meta</label><input type="number" step="0.01" min="0" value={metaMonto} onChange={e=>setMetaMonto(e.target.value)} /></div>
              <div className="field"><label>Meta diaria de citas nuevas</label><input type="number" step="1" min="1" value={metaUnidades} onChange={e=>setMetaUnidades(e.target.value)} /></div>
              <div className="field settings-note-field"><label>Nota visible en Inicio</label><textarea rows={4} maxLength={500} value={notaInicio} onChange={e=>setNotaInicio(e.target.value)} placeholder="Escribe una nota para mostrar en la pantalla de Inicio" /></div>
            </div>
            <label className="checkbox-row"><input type="checkbox" checked={obligarPendientes} onChange={e=>setObligarPendientes(e.target.checked)} /> Impedir cierre del día si quedan ventas pendientes</label>
            <button className="btn" disabled={guardando}>{guardando ? "Guardando…" : "Guardar configuración"}</button>
          </>}
          {mensaje && <p className="form-message">{mensaje}</p>}
        </form>

        <section className="settings-section danger-zone">
          <div className="settings-section-head">
            <div>
              <h2>Restablecer negocio</h2>
              <p>Borra la operación y deja los saldos en cero. Conserva materias primas, monto diario de Casa, meta financiera, meta diaria, esta nota y tu cuenta.</p>
            </div>
          </div>
          {resetPaso === 0 && (
            <button className="btn danger" type="button" onClick={() => { setMensajeReset(""); setResetPaso(1); }}>Restablecer negocio</button>
          )}
          {resetPaso === 1 && (
            <div className="reset-confirm-box">
              <strong>Primera confirmación</strong>
              <p>Se borrarán citas, historial, cierres, movimientos, notas de clientes, Bloc y teléfonos de segunda orden. Capital, Casa y acumulado de Meta volverán a RD$0.</p>
              <div className="reset-confirm-actions">
                <button className="btn secondary" type="button" onClick={() => setResetPaso(0)}>Cancelar</button>
                <button className="btn danger" type="button" onClick={() => setResetPaso(2)}>Continuar</button>
              </div>
            </div>
          )}
          {resetPaso === 2 && (
            <div className="reset-confirm-box final">
              <strong>Confirmación final</strong>
              <p>Esta acción no se puede deshacer. ¿Seguro que quieres borrar toda la información operativa?</p>
              <div className="reset-confirm-actions">
                <button className="btn secondary" type="button" onClick={() => setResetPaso(0)} disabled={reseteando}>Cancelar</button>
                <button className="btn danger" type="button" onClick={() => void restablecerNegocio()} disabled={reseteando}>{reseteando ? "Restableciendo…" : "Sí, restablecer"}</button>
              </div>
            </div>
          )}
          {mensajeReset && <p className="form-message">{mensajeReset}</p>}
        </section>

        <form className="settings-section" onSubmit={cambiarClave}>
          <div className="settings-section-head">
            <div>
              <h2>Seguridad</h2>
              <p>Cambia la contraseña de tu cuenta.</p>
            </div>
          </div>
          <div className="settings-grid">
            <div className="field">
              <label>Nueva contraseña</label>
              <input type="password" autoComplete="new-password" value={nuevaClave} onChange={e => setNuevaClave(e.target.value)} />
            </div>
            <div className="field">
              <label>Confirmar nueva contraseña</label>
              <input type="password" autoComplete="new-password" value={confirmarClave} onChange={e => setConfirmarClave(e.target.value)} />
            </div>
          </div>
          <button className="btn secondary" disabled={cambiandoClave || !nuevaClave || !confirmarClave}>
            {cambiandoClave ? "Actualizando…" : "Cambiar contraseña"}
          </button>
          {mensajeClave && <p className="form-message">{mensajeClave}</p>}
        </form>
      </main>
    </AuthGuard>
  );
}
