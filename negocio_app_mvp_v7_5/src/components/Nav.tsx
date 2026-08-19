"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoMark from "@/components/LogoMark";
import { createClient } from "@/lib/supabase/client";

const links = [
  ["/", "Inicio", "home"],
  ["/agenda", "Agenda", "calendar"],
  ["/link", "Link", "link"],
  ["/telefonos", "Teléfonos", "phone"],
  ["/historial", "Historial", "history"],
  ["/configuracion", "Config.", "settings"]
] as const;

type IconName = (typeof links)[number][2];

function MenuIcon({ name }: { name: IconName }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "home") return <svg {...common}><path d="m3 10 9-7 9 7"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-7h5v7"/></svg>;
  if (name === "calendar") return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>;
  if (name === "link") return <svg {...common}><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></svg>;
  if (name === "phone") return <svg {...common}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7A2 2 0 0 1 22 16.9Z"/></svg>;
  if (name === "history") return <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>;
}

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
    <>
      <header className="topbar">
        <Link href="/" className="brand-lockup" aria-label="Control de Negocio - Inicio">
          <LogoMark compact />
          <span className="brand-copy">
            <strong>Control de Negocio</strong>
            <small>Controla · Planifica · Alcanza tu Meta</small>
          </span>
        </Link>
        <button className="topbar-exit" onClick={salir}>Salir</button>
      </header>

      <nav className="bottom-nav" aria-label="Navegación principal">
        {links.map(([href, label, icon]) => (
          <Link key={href} href={href} className={activo(href) ? "active" : ""}>
            <MenuIcon name={icon} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
