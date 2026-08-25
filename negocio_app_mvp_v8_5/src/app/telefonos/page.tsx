"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";
import { phoneDigits } from "@/lib/phone";

type ContactStatus = "llamo" | "camino" | "llego" | null;

type PendingPhone = {
  id: string;
  client_name: string;
  phone: string | null;
  sale_date: string;
  sale_time: string;
  contact_status: ContactStatus;
};

type SecondOrderPhone = {
  id: string;
  phone: string;
  phone_digits: string;
  created_at: string;
};

function prettyDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-DO", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

export default function TelefonosPage() {
  const [ventas, setVentas] = useState<PendingPhone[]>([]);
  const [segundaOrden, setSegundaOrden] = useState<SecondOrderPhone[]>([]);
  const [buscar, setBuscar] = useState("");
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.replace("/login");
      return;
    }

    const [pendingResult, secondOrderResult] = await Promise.all([
      supabase
        .from("sales")
        .select("id,client_name,phone,sale_date,sale_time,contact_status")
        .eq("user_id", user.id)
        .eq("status", "pendiente")
        .not("phone", "is", null)
        .order("sale_date", { ascending: true })
        .order("sale_time", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("second_order_phones")
        .select("id,phone,phone_digits,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
    ]);

    if (pendingResult.error) setMensaje(pendingResult.error.message);
    else if (secondOrderResult.error) setMensaje(secondOrderResult.error.message);
    setVentas((pendingResult.data ?? []) as PendingPhone[]);
    setSegundaOrden((secondOrderResult.data ?? []) as SecondOrderPhone[]);
    setCargando(false);
  }, []);

  useEffect(() => { void cargar(); }, [cargar]);

  const cambiarEstado = async (id: string, status: ContactStatus) => {
    setGuardando(id);
    setMensaje("");
    const supabase = createClient();
    const { error } = await supabase
      .from("sales")
      .update({ contact_status: status })
      .eq("id", id);

    if (error) {
      setMensaje(error.message);
    } else {
      setVentas(prev => prev.map(v => v.id === id ? { ...v, contact_status: status } : v));
    }
    setGuardando(null);
  };

  const filtradas = useMemo(() => {
    const q = phoneDigits(buscar);
    if (!q) return ventas;
    return ventas.filter(v => phoneDigits(v.phone ?? "").includes(q));
  }, [buscar, ventas]);

  const segundaOrdenFiltrada = useMemo(() => {
    const q = phoneDigits(buscar);
    if (!q) return segundaOrden;
    return segundaOrden.filter(v => v.phone_digits.includes(q));
  }, [buscar, segundaOrden]);

  return (
    <AuthGuard>
      <main className="shell">
        <Nav />
        <div className="page-heading-row"><h1>Teléfonos</h1></div>

        <div className="phone-search-wrap">
          <input
            className="phone-search"
            type="tel"
            inputMode="numeric"
            placeholder="Buscar por cualquier dígito"
            value={buscar}
            onChange={e => setBuscar(e.target.value.replace(/[^0-9]/g, ""))}
          />
        </div>

        {mensaje && <div className="card error-message">{mensaje}</div>}
        {cargando ? (
          <div className="card muted">Cargando teléfonos…</div>
        ) : filtradas.length === 0 ? (
          <div className="card muted">No hay teléfonos pendientes que coincidan.</div>
        ) : (
          <div className="phone-list">
            {filtradas.map(venta => (
              <article className={`phone-card phone-status-${venta.contact_status ?? "normal"}`} key={venta.id}>
                <a className="phone-card-link" href={`/agenda?date=${encodeURIComponent(venta.sale_date)}`}>
                  <div className="phone-number">{venta.phone}</div>
                  <div className="phone-client">{venta.client_name}</div>
                  <div className="phone-appointment">{prettyDate(venta.sale_date)} · {venta.sale_time.slice(0, 5)}</div>
                </a>

                <div className="phone-actions" aria-label={`Estado de ${venta.client_name}`}>
                  <button
                    type="button"
                    className={`phone-status-button status-called ${venta.contact_status === "llamo" ? "active" : ""}`}
                    disabled={guardando === venta.id}
                    onClick={() => void cambiarEstado(venta.id, "llamo")}
                  >
                    LLAMÓ
                  </button>
                  <button
                    type="button"
                    className={`phone-status-button status-way ${venta.contact_status === "camino" ? "active" : ""}`}
                    disabled={guardando === venta.id}
                    onClick={() => void cambiarEstado(venta.id, "camino")}
                  >
                    CAMINO
                  </button>
                  <button
                    type="button"
                    className={`phone-status-button status-arrived ${venta.contact_status === "llego" ? "active" : ""}`}
                    disabled={guardando === venta.id}
                    onClick={() => void cambiarEstado(venta.id, "llego")}
                  >
                    LLEGÓ
                  </button>
                </div>

                {venta.contact_status && (
                  <button
                    type="button"
                    className="phone-clear-status"
                    disabled={guardando === venta.id}
                    onClick={() => void cambiarEstado(venta.id, null)}
                  >
                    Limpiar
                  </button>
                )}
              </article>
            ))}
          </div>
        )}

        {!cargando && (
          <section className="second-order-section" aria-label="Pendiente a segunda orden">
            <div className="second-order-heading">
              <div>
                <h2>Pendiente a segunda orden</h2>
                <p>Solo números disponibles para una segunda orden.</p>
              </div>
              <span>{segundaOrdenFiltrada.length}</span>
            </div>
            {segundaOrdenFiltrada.length === 0 ? (
              <div className="second-order-empty">No hay números pendientes de segunda orden.</div>
            ) : (
              <div className="second-order-list">
                {segundaOrdenFiltrada.map(item => (
                  <div className="second-order-phone" key={item.id}>{item.phone}</div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </AuthGuard>
  );
}
