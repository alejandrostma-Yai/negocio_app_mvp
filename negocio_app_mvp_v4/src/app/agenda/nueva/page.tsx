"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createSale } from "@/lib/services/sales";

function localDateString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function localTimeString() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function NuevaVentaPage() {
  const [cliente, setCliente] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [precio, setPrecio] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    setFecha(localDateString());
    setHora(localTimeString());
  }, []);

  const valido = useMemo(
    () => Boolean(cliente.trim() && fecha && hora && Number(precio) > 0),
    [cliente, fecha, hora, precio]
  );

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!valido || cargando) return;

    setCargando(true);
    setMensaje("");

    try {
      await createSale({
        clientName: cliente,
        saleDate: fecha,
        saleTime: hora,
        price: Number(precio)
      });
      window.location.href = `/agenda?date=${encodeURIComponent(fecha)}`;
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo guardar la venta.");
      setCargando(false);
    }
  }

  return (
    <AuthGuard>
      <main className="shell">
        <Nav />
        <form className="form" onSubmit={guardar}>
          <h1>Nueva venta</h1>
          <div className="field">
            <label>Cliente</label>
            <input value={cliente} onChange={e => setCliente(e.target.value)} autoComplete="name" />
          </div>
          <div className="field">
            <label>Fecha</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <div className="field">
            <label>Hora</label>
            <input type="time" value={hora} onChange={e => setHora(e.target.value)} />
          </div>
          <div className="field">
            <label>Precio de venta (RD$)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={precio}
              onChange={e => setPrecio(e.target.value)}
            />
          </div>
          <button className="btn" type="submit" disabled={!valido || cargando} style={{opacity: valido && !cargando ? 1 : .45}}>
            {cargando ? "Guardando..." : "Guardar venta"}
          </button>
          {mensaje && <p className="form-message error-message">{mensaje}</p>}
        </form>
      </main>
    </AuthGuard>
  );
}
