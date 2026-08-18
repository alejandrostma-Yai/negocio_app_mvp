"use client";

import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { useState } from "react";

export default function ConfiguracionPage() {
  const [mp1, setMp1] = useState("175");
  const [mp2, setMp2] = useState("500");
  const [mp3, setMp3] = useState("2000");
  const [casa, setCasa] = useState("3000");
  const [metaNombre, setMetaNombre] = useState("Meta principal");
  const [metaMonto, setMetaMonto] = useState("2150538");
  const [metaUnidades, setMetaUnidades] = useState("12");
  const [obligarPendientes, setObligarPendientes] = useState(true);

  return (
    <AuthGuard>
    <main className="shell">
      <Nav />
      <div className="form">
        <h1>Configuración</h1>

        <div className="field"><label>Materia prima 1 por unidad</label><input value={mp1} onChange={e=>setMp1(e.target.value)} /></div>
        <div className="field"><label>Materia prima 2 por unidad</label><input value={mp2} onChange={e=>setMp2(e.target.value)} /></div>
        <div className="field"><label>Materia prima 3 por unidad</label><input value={mp3} onChange={e=>setMp3(e.target.value)} /></div>
        <div className="field"><label>Monto diario de casa</label><input value={casa} onChange={e=>setCasa(e.target.value)} /></div>
        <div className="field"><label>Nombre de la meta</label><input value={metaNombre} onChange={e=>setMetaNombre(e.target.value)} /></div>
        <div className="field"><label>Monto de la meta</label><input value={metaMonto} onChange={e=>setMetaMonto(e.target.value)} /></div>
        <div className="field"><label>Meta diaria de unidades</label><input value={metaUnidades} onChange={e=>setMetaUnidades(e.target.value)} /></div>

        <label style={{display:"flex", gap:10, alignItems:"center", marginBottom:18}}>
          <input type="checkbox" checked={obligarPendientes} onChange={e=>setObligarPendientes(e.target.checked)} />
          Impedir cierre del día si quedan ventas pendientes
        </label>

        <button className="btn">Guardar configuración</button>
      </div>
    </main>
    </AuthGuard>
  );
}
