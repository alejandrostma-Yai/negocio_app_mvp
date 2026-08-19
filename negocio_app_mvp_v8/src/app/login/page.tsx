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
  const [usuarioRecordado, setUsuarioRecordado] = useState<{ email: string; name: string } | null>(null);

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.replace("/");
        return;
      }
      try {
        const raw = localStorage.getItem("og-last-user");
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved?.email && saved?.name) {
            setUsuarioRecordado({ email: saved.email, name: saved.name });
            setCorreo(saved.email);
          }
        }
      } catch {}
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
        if (data.user?.email) {
          try { localStorage.setItem("og-last-user", JSON.stringify({ email: data.user.email, name: nombre.trim() || data.user.email.split("@")[0] })); } catch {}
        }
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
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          const nombrePerfil = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
          const nombreCuenta = user.email.split("@")[0] || "Usuario";
          try { localStorage.setItem("og-last-user", JSON.stringify({ email: user.email, name: nombrePerfil || nombreCuenta })); } catch {}
        }
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
      <div className="login-overlay" aria-hidden="true" />
      <section className="login-card">
        <div className="login-brand"><LogoMark /></div>
        <div className="login-title">Control de Negocio</div>
        <div className="login-tagline">Controla, Planifica, Alcanza tu Meta</div>
        <div className="login-kicker">Acceso seguro</div>
        <h1>{modo === "login" ? "Bienvenido de nuevo" : "Crear cuenta"}</h1>
        <p className="login-subtitle">{modo === "login" ? "Inicia sesión para continuar" : "Crea tu acceso a Control de Negocio"}</p>

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

          {modo === "login" && usuarioRecordado ? (
            <div className="remembered-user">
              <div className="remembered-avatar">{usuarioRecordado.name.slice(0, 1).toUpperCase()}</div>
              <div>
                <div className="remembered-label">Usuario</div>
                <div className="remembered-name">{usuarioRecordado.name}</div>
              </div>
            </div>
          ) : (
            <div className="field">
              <label>Correo</label>
              <input
                type="email"
                autoComplete="email"
                value={correo}
                onChange={e => setCorreo(e.target.value)}
              />
            </div>
          )}


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

        {modo === "login" && usuarioRecordado && (
          <button
            className="login-change-user"
            type="button"
            onClick={() => {
              try { localStorage.removeItem("og-last-user"); } catch {}
              setUsuarioRecordado(null);
              setCorreo("");
              setClave("");
              setMensaje("");
            }}
          >
            Cambiar usuario
          </button>
        )}

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
