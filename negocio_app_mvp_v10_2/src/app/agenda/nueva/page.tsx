"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createSale } from "@/lib/services/sales";
import { completePhone, formatPhone } from "@/lib/phone";

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
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [precio, setPrecio] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("date");
    setFecha(requested && /^\d{4}-\d{2}-\d{2}$/.test(requested) ? requested : localDateString());
    setHora(localTimeString());
  }, []);

  const telefonoValido = !telefono || completePhone(telefono);
  const correoValido = !correo || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
  const valido = useMemo(
    () => Boolean(cliente.trim() && fecha && hora && Number(precio) > 0 && telefonoValido && correoValido),
    [cliente, fecha, hora, precio, telefonoValido, correoValido]
  );

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!valido || cargando) return;

    setCargando(true);
    setMensaje("");

    try {
      await createSale({
        clientName: cliente,
        phone: telefono,
        email: correo,
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
            <label>Teléfono</label>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+1 (809) 556-1234"
              value={telefono}
              onChange={e => setTelefono(formatPhone(e.target.value))}
            />
            {telefono && !telefonoValido && <div className="field-help">Completa los 10 dígitos del teléfono.</div>}
          </div>
          <div className="field">
            <label>Correo electrónico</label>
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="cliente@correo.com"
              value={correo}
              onChange={e => setCorreo(e.target.value)}
            />
            {correo && !correoValido && <div className="field-help">Escribe un correo electrónico válido.</div>}
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
