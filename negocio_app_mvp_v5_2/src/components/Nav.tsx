"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function Nav() {
  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <nav className="nav">
      <Link href="/">Inicio</Link>
      <Link href="/agenda">Agenda</Link>
      <Link href="/telefonos">Teléfonos</Link>
      <Link href="/casa">Casa</Link>
      <Link href="/historial">Historial</Link>
      <Link href="/configuracion">Configuración</Link>
      <button className="nav-pill" onClick={salir}>Salir</button>
    </nav>
  );
}
