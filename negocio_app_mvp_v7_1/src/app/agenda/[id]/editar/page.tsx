"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";
import { updateSale } from "@/lib/services/sales";
import { completePhone, formatPhone } from "@/lib/phone";

type Sale = {
  id: string;
  client_name: string;
  phone: string | null;
  sale_date: string;
  sale_time: string;
  price: number | string;
  status: string;
};

export default function EditarVentaPage() {
  const params = useParams<{ id: string }>();
  const saleId = params.id;
  const [cliente, setCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [precio, setPrecio] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      setMensaje("");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("sales")
        .select("id,client_name,phone,sale_date,sale_time,price,status")
        .eq("id", saleId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        setMensaje(error.message);
      } else if (!data) {
        setMensaje("No se encontró la cita.");
      } else if (data.status !== "pendiente") {
        setMensaje("Solo se pueden modificar citas pendientes.");
      } else {
        const sale = data as Sale;
        setCliente(sale.client_name);
        setTelefono(sale.phone ? formatPhone(sale.phone) : "");
        setFecha(sale.sale_date);
        setHora(sale.sale_time.slice(0, 5));
        setPrecio(String(sale.price));
      }
      setCargando(false);
    }

    if (saleId) void cargar();
  }, [saleId]);

  const telefonoValido = !telefono || completePhone(telefono);
  const valido = useMemo(
    () => Boolean(cliente.trim() && fecha && hora && Number(precio) > 0 && telefonoValido),
    [cliente, fecha, hora, precio, telefonoValido]
  );

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!valido || guardando) return;
    setGuardando(true);
    setMensaje("");

    try {
      await updateSale(saleId, {
        clientName: cliente,
        phone: telefono,
        saleDate: fecha,
        saleTime: hora,
        price: Number(precio)
      });
      window.location.href = `/agenda?date=${encodeURIComponent(fecha)}`;
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo modificar la cita.");
      setGuardando(false);
    }
  }

  return (
    <AuthGuard>
      <main className="shell">
        <Nav />
        {cargando ? (
          <div className="card muted">Cargando cita…</div>
        ) : (
          <form className="form" onSubmit={guardar}>
            <div className="page-heading-row">
              <h1>Modificar cita</h1>
              {fecha && <a className="btn secondary" href={`/agenda?date=${encodeURIComponent(fecha)}`}>Volver</a>}
            </div>
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
            <button className="btn" type="submit" disabled={!valido || guardando} style={{ opacity: valido && !guardando ? 1 : .45 }}>
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
            {mensaje && <p className="form-message error-message">{mensaje}</p>}
          </form>
        )}
      </main>
    </AuthGuard>
  );
}
