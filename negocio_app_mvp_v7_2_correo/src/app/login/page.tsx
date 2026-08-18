"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import LogoMark from "@/components/LogoMark";

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [codigoInvitacion, setCodigoInvitacion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.replace("/");
        return;
      }
      setChecking(false);
    }
    checkSession();
  }, [supabase]);

  const valido = useMemo(
    () =>
      correo.trim().length > 3 &&
      clave.length >= 6 &&
      (modo === "login" || (nombre.trim().length > 0 && codigoInvitacion.trim() === "YAI1998")),
    [correo, clave, nombre, modo, codigoInvitacion]
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!valido) return;

    setCargando(true);
    setMensaje("");

    if (modo === "registro") {
      if (codigoInvitacion.trim() !== "YAI1998") {
        setMensaje("Código de invitación incorrecto.");
        setCargando(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: correo.trim(),
        password: clave,
        options: { data: { full_name: nombre.trim() } }
      });

      if (error) {
        setMensaje(error.message);
      } else if (data.session) {
        window.location.replace("/");
      } else {
        setMensaje("Cuenta creada. Revisa tu correo si Supabase solicita confirmación.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: correo.trim(),
        password: clave
      });

      if (error) {
        setMensaje(error.message);
      } else {
        window.location.replace("/");
      }
    }

    setCargando(false);
  }

  if (checking) {
    return (
      <main className="login-shell">
        <div className="login-card">
          <div className="auth-loading">Verificando sesión…</div>
        </div>
      </main>
    );
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="login-brand"><LogoMark /><span>OG · Control de Negocio</span></div>
        <h1>{modo === "login" ? "Iniciar sesión" : "Crear cuenta"}</h1>

        <form onSubmit={submit}>
          {modo === "registro" && (
            <div className="field">
              <label>Nombre</label>
              <input
                autoComplete="name"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            </div>
          )}

          <div className="field">
            <label>Correo</label>
            <input
              type="email"
              autoComplete="email"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
            />
          </div>


          {modo === "registro" && (
            <div className="field">
              <label>Código de invitación</label>
              <input
                value={codigoInvitacion}
                onChange={e => setCodigoInvitacion(e.target.value)}
                placeholder="Ingresa tu código"
                autoComplete="off"
              />
            </div>
          )}

          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              autoComplete={modo === "login" ? "current-password" : "new-password"}
              value={clave}
              onChange={e => setClave(e.target.value)}
            />
          </div>

          <button
            className="btn login-btn"
            disabled={!valido || cargando}
            style={{ opacity: valido ? 1 : 0.45 }}
          >
            {cargando ? "Procesando..." : modo === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        {mensaje && <p className="login-message">{mensaje}</p>}

        <button
          className="btn secondary login-secondary"
          onClick={() => setModo(modo === "login" ? "registro" : "login")}
        >
          {modo === "login" ? "Crear una cuenta" : "Ya tengo una cuenta"}
        </button>

        <footer className="login-footer">by Alejandro Sánchez</footer>
      </section>
    </main>
  );
}
