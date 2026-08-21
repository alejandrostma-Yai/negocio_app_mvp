"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";

type BlocNote = {
  id: string;
  note: string;
  created_at: string;
  updated_at: string;
};

export default function LinkBlocPage() {
  const [notes, setNotes] = useState<BlocNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  async function loadNotes() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.replace("/login"); return; }

    const { data, error } = await supabase
      .from("link_bloc_notes")
      .select("id,note,created_at,updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) setMessage(error.message);
    else setNotes((data ?? []) as BlocNote[]);
    setLoading(false);
  }

  useEffect(() => { void loadNotes(); }, []);

  async function addNote() {
    setCreating(true);
    setMessage("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.replace("/login"); return; }

    const { data, error } = await supabase
      .from("link_bloc_notes")
      .insert({ user_id: user.id, note: "" })
      .select("id,note,created_at,updated_at")
      .single();

    if (error) setMessage(error.message);
    else if (data) setNotes(current => [data as BlocNote, ...current]);
    setCreating(false);
  }

  function changeNote(id: string, value: string) {
    setNotes(current => current.map(item => item.id === id ? { ...item, note: value } : item));
  }

  async function saveNote(id: string) {
    const item = notes.find(note => note.id === id);
    if (!item) return;
    setSavingId(id);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("link_bloc_notes")
      .update({ note: item.note, updated_at: new Date().toISOString() })
      .eq("id", id);

    setMessage(error ? error.message : "Nota guardada.");
    setSavingId(null);
  }

  async function deleteNote(id: string) {
    const confirmed = window.confirm("¿Seguro que quieres eliminar esta nota?");
    if (!confirmed) return;

    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.from("link_bloc_notes").delete().eq("id", id);
    if (error) setMessage(error.message);
    else {
      setNotes(current => current.filter(item => item.id !== id));
      setMessage("Nota eliminada.");
    }
  }

  return (
    <AuthGuard>
      <main className="shell">
        <Nav />
        <div className="page-heading-row">
          <div>
            <h1>Bloc</h1>
            <p className="page-kicker">Notas independientes de Link</p>
          </div>
          <a className="btn secondary small" href="/link">Volver</a>
        </div>

        <div className="bloc-toolbar">
          <span className="muted">{notes.length} {notes.length === 1 ? "nota" : "notas"}</span>
          <button className="bloc-add-button" type="button" onClick={() => void addNote()} disabled={creating} aria-label="Crear nota nueva">
            {creating ? "…" : "+"}
          </button>
        </div>

        {message && <div className="card link-message" aria-live="polite">{message}</div>}

        {loading ? (
          <div className="card muted">Cargando bloc…</div>
        ) : notes.length === 0 ? (
          <div className="bloc-empty">
            <p>No tienes notas todavía.</p>
            <button className="btn" type="button" onClick={() => void addNote()} disabled={creating}>Crear primera nota</button>
          </div>
        ) : (
          <section className="bloc-notes-list">
            {notes.map((item, index) => (
              <article className="bloc-note-card" key={item.id}>
                <div className="bloc-note-header">
                  <strong>Nota {notes.length - index}</strong>
                  <button className="bloc-delete-button" type="button" onClick={() => void deleteNote(item.id)}>Eliminar</button>
                </div>
                <textarea
                  value={item.note}
                  onChange={e => changeNote(item.id, e.target.value)}
                  placeholder="Escribe tu nota…"
                  aria-label={`Nota ${notes.length - index}`}
                />
                <div className="bloc-note-actions">
                  <button className="btn small" type="button" onClick={() => void saveNote(item.id)} disabled={savingId === item.id}>
                    {savingId === item.id ? "Guardando…" : "Guardar"}
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
