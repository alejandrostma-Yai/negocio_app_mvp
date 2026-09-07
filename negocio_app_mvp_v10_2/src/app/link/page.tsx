"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";

type PendingSale = {
  id: string;
  client_name: string;
  phone: string | null;
  email: string | null;
  sale_date: string;
  sale_time: string;
  link_note: string | null;
  link_agg: boolean;
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("es-DO", { weekday: "short", day: "numeric", month: "short" });
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.focus(); area.select(); area.setSelectionRange(0, area.value.length);
  const copied = document.execCommand("copy");
  document.body.removeChild(area);
  if (!copied) throw new Error("No se pudo copiar la nota");
}

export default function LinkPage() {
  const [sales, setSales] = useState<PendingSale[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [togglingAggId, setTogglingAggId] = useState<string | null>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const load = useCallback(async () => {
    setLoading(true); setMessage("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.replace("/login"); return; }
    const { data, error } = await supabase.from("sales")
      .select("id,client_name,phone,email,sale_date,sale_time,link_note,link_agg")
      .eq("user_id", user.id).eq("status", "pendiente")
      .order("sale_date", { ascending: true }).order("sale_time", { ascending: true }).order("created_at", { ascending: true });
    if (error) { setMessage(error.message); setSales([]); }
    else {
      const rows = (data ?? []) as PendingSale[];
      setSales(rows);
      setNotes(Object.fromEntries(rows.map(row => [row.id, row.link_note ?? ""])));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); return () => Object.values(saveTimers.current).forEach(clearTimeout); }, [load]);
  useRealtimeRefresh(load);
  const pendingCount = useMemo(() => sales.length, [sales]);

  function toggleOpen(id: string) {
    setOpenIds(current => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function changeNote(sale: PendingSale, value: string) {
    setNotes(current => ({ ...current, [sale.id]: value }));
    if (saveTimers.current[sale.id]) clearTimeout(saveTimers.current[sale.id]);
    saveTimers.current[sale.id] = setTimeout(async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("sales").update({ link_note: value.trim() || null })
        .eq("id", sale.id).eq("user_id", user.id).eq("status", "pendiente");
      if (error) setMessage(error.message);
      else {
        setSales(current => current.map(item => item.id === sale.id ? { ...item, link_note: value.trim() || null } : item));
        setMessage(`Nota de ${sale.client_name} guardada automáticamente ✓`);
        window.setTimeout(() => setMessage(current => current.includes(sale.client_name) ? "" : current), 1400);
      }
    }, 650);
  }

  async function toggleAgg(sale: PendingSale) {
    setTogglingAggId(sale.id); setMessage("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.replace("/login"); return; }
    const nextValue = !sale.link_agg;
    const { data, error } = await supabase.from("sales").update({ link_agg: nextValue })
      .eq("id", sale.id).eq("user_id", user.id).eq("status", "pendiente").select("id,link_agg").maybeSingle();
    if (error) setMessage(error.message);
    else if (!data) await load();
    else setSales(current => current.map(item => item.id === sale.id ? { ...item, link_agg: data.link_agg } : item));
    setTogglingAggId(null);
  }

  async function copyNote(sale: PendingSale) {
    const value = (notes[sale.id] ?? "").trim();
    if (!value) { setMessage("Escribe una nota antes de copiarla."); return; }
    try {
      await copyText(value); setCopiedId(sale.id);
      window.setTimeout(() => setCopiedId(current => current === sale.id ? null : current), 1600);
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo copiar la nota"); }
  }

  return <AuthGuard><main className="shell"><Nav />
    <div className="page-heading-row">
      <div><h1>Link</h1><p className="page-kicker">Clientes pendientes · notas automáticas</p></div>
      <div className="link-page-actions">
        <a className="link-browser-button" href="/link/navegador" aria-label="Abrir navegador temporal" title="Navegador temporal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9"/><path d="M3.6 9h16.8M3.6 15h16.8M12 3c2.2 2.5 3.4 5.5 3.4 9S14.2 18.5 12 21c-2.2-2.5-3.4-5.5-3.4-9S9.8 5.5 12 3Z"/>
          </svg>
        </a>
        <span className="viz-like-count">{pendingCount}</span>
      </div>
    </div>
    {message && <div className="inline-status" aria-live="polite">{message}</div>}
    {loading ? <div className="card muted">Cargando citas pendientes…</div> : sales.length === 0 ? <div className="card muted">No hay citas pendientes para mostrar en Link.</div> :
      <section className="link-list" aria-label="Notas de citas pendientes">
        {sales.map(sale => {
          const open = openIds.has(sale.id);
          return <article className={`link-client-card link-collapsible ${sale.link_agg ? "link-client-card-agg" : ""}`} key={sale.id}>
            <div className="link-client-head">
              <button type="button" className="link-client-toggle" onClick={() => toggleOpen(sale.id)} aria-expanded={open}>
                <span className="link-client-name">{sale.client_name}</span>
                <span className="link-client-meta">{formatDate(sale.sale_date)} · {sale.sale_time.slice(0,5)}</span>
                <span className="link-expand-indicator">{open ? "Ocultar nota ↑" : "Ver nota ↓"}</span>
              </button>
              <div className="link-head-actions">
                <button type="button" className={`link-agg-button ${sale.link_agg ? "active" : ""}`} disabled={togglingAggId === sale.id} aria-pressed={sale.link_agg} onClick={() => void toggleAgg(sale)}>AGG</button>
              </div>
            </div>
            {open && <div className="link-note-panel">
              {(sale.phone || sale.email) && <div className="link-client-contact">{sale.phone && <span>{sale.phone}</span>}{sale.email && <span>{sale.email}</span>}</div>}
              <label className="link-note-field"><span>Nota · guardado automático</span><textarea rows={4} value={notes[sale.id] ?? ""} onChange={e => changeNote(sale, e.target.value)} placeholder="Escribe una nota para este cliente…" /></label>
              <div className="link-note-actions"><button type="button" className="btn small" disabled={!(notes[sale.id] ?? "").trim()} onClick={() => void copyNote(sale)}>{copiedId === sale.id ? "Copiado ✓" : "Copiar"}</button></div>
            </div>}
          </article>;
        })}
      </section>}
  </main></AuthGuard>;
}
