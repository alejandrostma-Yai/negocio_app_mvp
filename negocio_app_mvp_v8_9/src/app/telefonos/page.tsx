"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";
import { phoneDigits } from "@/lib/phone";

type ContactStatus = "llamo" | "camino" | "llego" | null;
type PendingPhone = { id:string; client_name:string; phone:string|null; sale_date:string; sale_time:string; contact_status:ContactStatus };
type SecondOrderPhone = { id:string; phone:string; phone_digits:string; created_at:string };

function prettyDate(value:string){ const [y,m,d]=value.split("-").map(Number); return new Date(y,m-1,d).toLocaleDateString("es-DO",{weekday:"short",day:"numeric",month:"short"}); }

export default function TelefonosPage(){
  const [ventas,setVentas]=useState<PendingPhone[]>([]), [segundaOrden,setSegundaOrden]=useState<SecondOrderPhone[]>([]);
  const [buscar,setBuscar]=useState(""), [cargando,setCargando]=useState(true), [mensaje,setMensaje]=useState(""), [guardando,setGuardando]=useState<string|null>(null);
  const cargar=useCallback(async()=>{
    setCargando(true); setMensaje(""); const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user){window.location.replace("/login");return;}
    const [a,b]=await Promise.all([
      supabase.from("sales").select("id,client_name,phone,sale_date,sale_time,contact_status").eq("user_id",user.id).eq("status","pendiente").not("phone","is",null).order("sale_date",{ascending:true}).order("sale_time",{ascending:true}).order("created_at",{ascending:true}),
      supabase.from("second_order_phones").select("id,phone,phone_digits,created_at").eq("user_id",user.id).order("created_at",{ascending:true})
    ]);
    if(a.error)setMensaje(a.error.message); else if(b.error)setMensaje(b.error.message); setVentas((a.data??[]) as PendingPhone[]); setSegundaOrden((b.data??[]) as SecondOrderPhone[]); setCargando(false);
  },[]);
  useEffect(()=>{void cargar();},[cargar]);
  async function cambiarEstado(id:string,status:ContactStatus){ setGuardando(id); const supabase=createClient(); const {error}=await supabase.from("sales").update({contact_status:status}).eq("id",id); if(error)setMensaje(error.message); else setVentas(p=>p.map(v=>v.id===id?{...v,contact_status:status}:v)); setGuardando(null); }
  async function borrarSegunda(item:SecondOrderPhone){ if(!window.confirm(`¿Quitar ${item.phone} de pendiente a segunda orden?`))return; setGuardando(item.id); const supabase=createClient(); const {error}=await supabase.from("second_order_phones").delete().eq("id",item.id); if(error)setMensaje(error.message); else setSegundaOrden(v=>v.filter(x=>x.id!==item.id)); setGuardando(null); }
  const q=phoneDigits(buscar), filtradas=useMemo(()=>!q?ventas:ventas.filter(v=>phoneDigits(v.phone??"").includes(q)),[q,ventas]), seg=useMemo(()=>!q?segundaOrden:segundaOrden.filter(v=>v.phone_digits.includes(q)),[q,segundaOrden]);
  return <AuthGuard><main className="shell"><Nav/><div className="page-heading-row"><h1>Teléfonos</h1></div>
    <div className="phone-search-wrap"><input className="phone-search" type="tel" inputMode="numeric" placeholder="Buscar por cualquier dígito" value={buscar} onChange={e=>setBuscar(e.target.value.replace(/[^0-9]/g,""))}/></div>
    {mensaje&&<div className="inline-status error-message">{mensaje}</div>}
    {cargando?<div className="card muted">Cargando teléfonos…</div>:filtradas.length===0?<div className="card muted">No hay teléfonos pendientes que coincidan.</div>:<div className="phone-list">{filtradas.map(v=><article className={`phone-card phone-status-${v.contact_status??"normal"}`} key={v.id}>
      <a className="phone-card-link" href={`/agenda?date=${encodeURIComponent(v.sale_date)}`}><div className="phone-number">{v.phone}</div><div className="phone-client">{v.client_name}</div><div className="phone-appointment">{prettyDate(v.sale_date)} · {v.sale_time.slice(0,5)}</div></a>
      <div className="phone-actions"><button className={`phone-status-button status-called ${v.contact_status==="llamo"?"active":""}`} disabled={guardando===v.id} onClick={()=>void cambiarEstado(v.id,"llamo")}>LLAMÓ</button><button className={`phone-status-button status-way ${v.contact_status==="camino"?"active":""}`} disabled={guardando===v.id} onClick={()=>void cambiarEstado(v.id,"camino")}>CAMINO</button><button className={`phone-status-button status-arrived ${v.contact_status==="llego"?"active":""}`} disabled={guardando===v.id} onClick={()=>void cambiarEstado(v.id,"llego")}>LLEGÓ</button></div>
      {v.contact_status&&<button className="phone-clear-status" disabled={guardando===v.id} onClick={()=>void cambiarEstado(v.id,null)}>Limpiar</button>}
    </article>)}</div>}
    {!cargando&&<section className="second-order-section"><div className="second-order-heading"><div><h2>Pendiente a segunda orden</h2><p>Números disponibles para reutilizar.</p></div><span>{seg.length}</span></div>{seg.length===0?<div className="second-order-empty">No hay números pendientes de segunda orden.</div>:<div className="second-order-list">{seg.map(item=><div className="second-order-phone" key={item.id}><span>{item.phone}</span><button type="button" className="second-order-delete" aria-label={`Eliminar ${item.phone}`} disabled={guardando===item.id} onClick={()=>void borrarSegunda(item)}>×</button></div>)}</div>}</section>}
  </main></AuthGuard>;
}
