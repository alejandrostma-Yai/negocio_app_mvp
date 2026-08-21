"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";

export default function LinkBlocPage() {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.replace("/login"); return; }
      const { data, error } = await supabase
        .from("settings")
        .select("link_general_note")
        .eq("user_id", user.id)
        .single();
      if (error) setMessage(error.message);
      else setNote(data?.link_general_note ?? "");
      setLoading(false);
    }
    void load();
  }, []);

  async function save() {
    setSaving(true);
    setMessage("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.replace("/login"); return; }
    const { error } = await supabase
      .from("settings")
      .update({ link_general_note: note, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
    setMessage(error ? error.message : "Bloc guardado.");
    setSaving(false);
  }

  return (
    <AuthGuard>
      <main className="shell">
        <Nav />
        <div className="page-heading-row">
          <div>
            <h1>Bloc</h1>
            <p className="page-kicker">Nota general de Link</p>
          </div>
          <a className="btn secondary small" href="/link">Volver</a>
        </div>

        {message && <div className="card link-message" aria-live="polite">{message}</div>}
        {loading ? (
          <div className="card muted">Cargando bloc…</div>
        ) : (
          <section className="link-general-bloc">
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Escribe aquí tus notas generales…"
              aria-label="Bloc de notas general"
            />
            <div className="link-general-bloc-actions">
              <button className="btn" type="button" onClick={() => void save()} disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </section>
        )}
      </main>
    </AuthGuard>
  );
}
