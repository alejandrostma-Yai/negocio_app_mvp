"use client";

import { useMemo, useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";

export default function NuevaVentaPage() {
  const [cliente, setCliente] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [precio, setPrecio] = useState("");

  const valido = useMemo(
    () => cliente.trim() && fecha && hora && Number(precio) > 0,
    [cliente, fecha, hora, precio]
  );

  return (
    <AuthGuard>
    <main className="shell">
      <Nav />
      <div className="form">
        <h1>Nueva venta</h1>
        <div className="field">
          <label>Cliente</label>
          <input value={cliente} onChange={e => setCliente(e.target.value)} />
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
          <input inputMode="decimal" value={precio} onChange={e => setPrecio(e.target.value)} />
        </div>
        <button className="btn" disabled={!valido} style={{opacity: valido ? 1 : .45}}>
          Guardar venta
        </button>
      </div>
    </main>
    </AuthGuard>
  );
}
