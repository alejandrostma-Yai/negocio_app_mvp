"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";

type CheckResult = { ok: boolean; url?: string; reason?: string };

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export default function TemporaryBrowserPage() {
  const [input, setInput] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openPage(event: FormEvent) {
    event.preventDefault();
    const url = normalizeUrl(input);
    if (!url) return;

    setLoading(true);
    setError("");
    setPageUrl("");

    try {
      const response = await fetch(`/api/embed-check?url=${encodeURIComponent(url)}`, { cache: "no-store" });
      const result = (await response.json()) as CheckResult;
      if (!response.ok || !result.ok || !result.url) {
        setError(result.reason || "Esta página no permite abrirse aquí.");
        return;
      }
      setPageUrl(result.url);
      setInput(result.url);
    } catch {
      setError("No se pudo comprobar esta página. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function closePage() {
    setPageUrl("");
    setInput("");
    setError("");
  }

  return (
    <AuthGuard>
      <main className="shell temporary-browser-shell">
        <div className="temporary-browser-top">
          <Link href="/link" className="temporary-browser-back" onClick={closePage}>← Link</Link>
          <div className="temporary-browser-title">
            <span className="temporary-browser-icon" aria-hidden="true">◎</span>
            <div><strong>Navegador temporal</strong><small>No guarda historial</small></div>
          </div>
          <button type="button" className="temporary-browser-close" onClick={() => { closePage(); window.location.href = "/link"; }} aria-label="Cerrar navegador">×</button>
        </div>

        <form className="temporary-browser-bar" onSubmit={openPage}>
          <input
            value={input}
            onChange={event => setInput(event.target.value)}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Escribe una dirección web"
            aria-label="Dirección web"
          />
          <button type="submit" disabled={loading || !input.trim()}>{loading ? "…" : "Ir"}</button>
        </form>

        {error && <div className="browser-error" role="alert"><strong>No se puede abrir</strong><span>{error}</span></div>}

        {!pageUrl && !error && (
          <div className="browser-empty">
            <div className="browser-empty-orbit" aria-hidden="true"><span>◎</span></div>
            <strong>Navegación privada temporal</strong>
            <p>Escribe una dirección arriba. Al cerrar esta pantalla, la página abierta no se guarda en la app.</p>
          </div>
        )}

        {pageUrl && (
          <div className="browser-frame-wrap">
            <iframe
              key={pageUrl}
              src={pageUrl}
              title="Navegador temporal"
              className="browser-frame"
              referrerPolicy="no-referrer"
              sandbox="allow-forms allow-modals allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            />
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
