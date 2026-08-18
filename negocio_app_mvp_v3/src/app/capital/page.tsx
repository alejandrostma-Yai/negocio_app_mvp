"use client";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { useState } from "react";

export default function CapitalPage() {
  const [monto, setMonto] = useState("");
  const [nota, setNota] = useState("");

  return (
    <AuthGuard>
    <main className="shell">
      <Nav />
      <div className="form">
        <h1>Capital de trabajo</h1>
        <div className="card" style={{marginBottom:16}}>
          <h3>Saldo actual</h3>
          <div className="amount">RD$0</div>
        </div>
        <div className="field"><label>Registrar inversión</label><input inputMode="decimal" value={monto} onChange={e=>setMonto(e.target.value)} /></div>
        <div className="field"><label>Nota (opcional)</label><input value={nota} onChange={e=>setNota(e.target.value)} /></div>
        <button className="btn" disabled={Number(monto)<=0} style={{opacity:Number(monto)>0?1:.45}}>Registrar inversión</button>
      </div>
    </main>
    </AuthGuard>
  );
}
