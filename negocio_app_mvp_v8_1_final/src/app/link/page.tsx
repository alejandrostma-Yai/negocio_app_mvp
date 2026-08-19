"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";

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
  return new Date(year, month - 1, day).toLocaleDateString("es-DO", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
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
  area.style.pointerEvents = "none";
  document.body.appendChild(area);
  area.focus();
  area.select();
  area.setSelectionRange(0, area.value.length);
  const copied = document.execCommand("copy");
  document.body.removeChild(area);
  if (!copied) throw new Error("No se pudo copiar la nota");
}

export default function LinkPage() {
  const [sales, setSales] = useState<PendingSale[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [togglingAggId, setTogglingAggId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("sales")
      .select("id,client_name,phone,email,sale_date,sale_time,link_note,link_agg")
      .eq("user_id", user.id)
      .eq("status", "pendiente")
      .order("sale_date", { ascending: true })
      .order("sale_time", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      setMessage(error.message);
      setSales([]);
    } else {
      const rows = (data ?? []) as PendingSale[];
      setSales(rows);
      setNotes(Object.fromEntries(rows.map(row => [row.id, row.link_note ?? ""])));
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const pendingCount = useMemo(() => sales.length, [sales]);

  async function saveNote(sale: PendingSale) {
    const value = (notes[sale.id] ?? "").trim();
    setSavingId(sale.id);
    setMessage("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("sales")
      .update({ link_note: value || null })
      .eq("id", sale.id)
      .eq("user_id", user.id)
      .eq("status", "pendiente")
      .select("id,link_note")
      .maybeSingle();

    if (error) {
      setMessage(error.message);
    } else if (!data) {
      setMessage("La cita ya no está pendiente. Se actualizará la lista.");
      await load();
    } else {
      setSales(current => current.map(item => item.id === sale.id ? { ...item, link_note: data.link_note } : item));
      setNotes(current => ({ ...current, [sale.id]: data.link_note ?? "" }));
      setMessage(`Nota de ${sale.client_name} guardada.`);
    }
    setSavingId(null);
  }

  async function toggleAgg(sale: PendingSale) {
    setTogglingAggId(sale.id);
    setMessage("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.replace("/login");
      return;
    }

    const nextValue = !sale.link_agg;
    const { data, error } = await supabase
      .from("sales")
      .update({ link_agg: nextValue })
      .eq("id", sale.id)
      .eq("user_id", user.id)
      .eq("status", "pendiente")
      .select("id,link_agg")
      .maybeSingle();

    if (error) {
      setMessage(error.message);
    } else if (!data) {
      setMessage("La cita ya no está pendiente. Se actualizará la lista.");
      await load();
    } else {
      setSales(current => current.map(item => item.id === sale.id ? { ...item, link_agg: data.link_agg } : item));
    }
    setTogglingAggId(null);
  }

  async function copyNote(sale: PendingSale) {
    const value = (notes[sale.id] ?? "").trim();
    if (!value) {
      setMessage("Escribe o guarda una nota antes de copiarla.");
      return;
    }
    try {
      await copyText(value);
      setCopiedId(sale.id);
      window.setTimeout(() => setCopiedId(current => current === sale.id ? null : current), 1600);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo copiar la nota");
    }
  }

  return (
    <AuthGuard>
      <main className="shell">
        <Nav />
        <div className="page-heading-row">
          <div>
            <h1>Link</h1>
            <p className="page-kicker">Notas rápidas de clientes pendientes</p>
          </div>
          <span className="viz-like-count">{pendingCount} pendientes</span>
        </div>

        {message && <div className="card link-message" aria-live="polite">{message}</div>}

        {loading ? (
          <div className="card muted">Cargando citas pendientes…</div>
        ) : sales.length === 0 ? (
          <div className="card muted">No hay citas pendientes para mostrar en Link.</div>
        ) : (
          <section className="link-list" aria-label="Notas de citas pendientes">
            {sales.map(sale => (
              <article className={`link-client-card ${sale.link_agg ? "link-client-card-agg" : ""}`} key={sale.id}>
                <div className="link-client-head">
                  <div>
                    <div className="link-client-name">{sale.client_name}</div>
                    <div className="link-client-meta">
                      {formatDate(sale.sale_date)} · {sale.sale_time.slice(0, 5)}
                    </div>
                    {(sale.phone || sale.email) && (
                      <div className="link-client-contact">
                        {sale.phone && <span>{sale.phone}</span>}
                        {sale.email && <span>{sale.email}</span>}
                      </div>
                    )}
                  </div>
                  <div className="link-head-actions">
                    <span className="status status-pendiente">pendiente</span>
                    <button
                      type="button"
                      className={`link-agg-button ${sale.link_agg ? "active" : ""}`}
                      disabled={togglingAggId === sale.id}
                      aria-pressed={sale.link_agg}
                      onClick={() => void toggleAgg(sale)}
                    >
                      AGG
                    </button>
                  </div>
                </div>

                <label className="link-note-field">
                  <span>Nota</span>
                  <textarea
                    rows={4}
                    value={notes[sale.id] ?? ""}
                    onChange={event => setNotes(current => ({ ...current, [sale.id]: event.target.value }))}
                    placeholder="Escribe una nota para este cliente…"
                  />
                </label>

                <div className="link-note-actions">
                  <button
                    type="button"
                    className="btn secondary small"
                    disabled={savingId === sale.id}
                    onClick={() => void saveNote(sale)}
                  >
                    {savingId === sale.id ? "Guardando…" : "Guardar nota"}
                  </button>
                  <button
                    type="button"
                    className="btn small"
                    disabled={!(notes[sale.id] ?? "").trim()}
                    onClick={() => void copyNote(sale)}
                  >
                    {copiedId === sale.id ? "Copiado ✓" : "Copiar"}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </AuthGuard>
  );
}
