"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";

type Item = {
  id: string;
  description: string;
  client_name: string | null;
  amount: number | string;
  direction: "ingreso" | "gasto" | "neutral";
  created_at: string;
};

function money(v: number | string) {
  return Number(v || 0).toLocaleString("es-DO", { maximumFractionDigits: 2 });
}

export default function HistorialPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [buscar, setBuscar] = useState("");
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.replace("/login"); return; }
    const { data, error } = await supabase
      .from("transaction_history")
      .select("id,description,client_name,amount,direction,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) setMensaje(error.message);
    setItems((data ?? []) as Item[]);
    setCargando(false);
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i => `${i.client_name ?? ""} ${i.description}`.toLowerCase().includes(q));
  }, [items, buscar]);

  return (
    <AuthGuard>
      <main className="shell">
        <Nav />
        <h1>Historial</h1>
        <div className="field"><label>Buscar por cliente o movimiento</label><input value={buscar} onChange={e => setBuscar(e.target.value)} placeholder="Nombre del cliente" /></div>
        {mensaje && <div className="card error-message">{mensaje}</div>}
        {cargando ? <div className="card muted">Cargando historial…</div> : filtrados.length === 0 ? <div className="card muted">No hay movimientos para mostrar.</div> : (
          <div className="card history-list">
            {filtrados.map(item => (
              <div className="history-item" key={item.id}>
                <div>
                  <strong>{item.description}</strong>
                  {item.client_name && <div>{item.client_name}</div>}
                  <div className="muted small-text">{new Date(item.created_at).toLocaleString("es-DO")}</div>
                </div>
                <div className={item.direction === "gasto" ? "money-negative" : item.direction === "ingreso" ? "money-positive" : ""}>RD${money(item.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
