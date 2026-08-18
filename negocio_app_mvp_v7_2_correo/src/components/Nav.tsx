"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoMark from "@/components/LogoMark";
import { createClient } from "@/lib/supabase/client";

const links = [
  ["/", "Inicio"],
  ["/agenda", "Agenda"],
  ["/telefonos", "Teléfonos"],
  ["/historial", "Historial"],
  ["/configuracion", "Configuración"]
] as const;

export default function Nav() {
  const pathname = usePathname();

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function activo(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="topbar">
      <Link href="/" className="brand-lockup" aria-label="OG - Inicio">
        <LogoMark compact />
        <span className="brand-copy">
          <strong>OG</strong>
          <small>Control de Negocio</small>
        </span>
      </Link>
      <nav className="nav" aria-label="Navegación principal">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className={activo(href) ? "active" : ""}>{label}</Link>
        ))}
        <button className="nav-pill" onClick={salir}>Salir</button>
      </nav>
    </header>
  );
}
