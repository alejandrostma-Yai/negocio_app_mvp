"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";
import CloseCountdown from "@/components/CloseCountdown";
import LogoMark from "@/components/LogoMark";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";

type VistaSale = { id:string; client_name:string; phone:string|null; sale_time:string; price:number|string; status:string; contact_status:string|null; company_id:1|2 };
type QuickData = {
  name:string; grossToday:number; dailyGoal:number; createdToday:number; completedToday:number;
  sales:VistaSale[]; phones:VistaSale[]; dailyClosed:boolean; weeklyClosed:boolean; closeMode:"daily"|"weekly";
};
const initial:QuickData={name:"Usuario",grossToday:0,dailyGoal:0,createdToday:0,completedToday:0,sales:[],phones:[],dailyClosed:false,weeklyClosed:false,closeMode:"daily"};

function dateKey(){return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santo_Domingo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());}
function dayBounds(){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santo_Domingo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()).split("-").map(Number);
  const [y,m,d]=parts;
  return {start:new Date(Date.UTC(y,m-1,d,4,0,0)).toISOString(),end:new Date(Date.UTC(y,m-1,d+1,4,0,0)).toISOString()};
}
function monthBounds(){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santo_Domingo",year:"numeric",month:"2-digit"}).format(new Date()).split("-").map(Number);
  const [y,m]=parts;
  return {start:new Date(Date.UTC(y,m-1,1,4,0,0)).toISOString(),end:new Date(Date.UTC(y,m,1,4,0,0)).toISOString()};
}
function weekStartKey(){
  const now=new Date();
  const p=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santo_Domingo",year:"numeric",month:"2-digit",day:"2-digit",weekday:"short"}).formatToParts(now);
  const get=(t:string)=>p.find(x=>x.type===t)?.value||"";
  const map:Record<string,number>={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
  const y=Number(get("year")),m=Number(get("month")),d=Number(get("day")),dow=map[get("weekday")]??0;
  const diff=dow===0?-6:1-dow;
  const dt=new Date(Date.UTC(y,m-1,d+diff));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,"0")}-${String(dt.getUTCDate()).padStart(2,"0")}`;
}
function money(v:number|string){return Number(v||0).toLocaleString("es-DO",{maximumFractionDigits:0});}
function clock(v:string){
  if(!v)return "";
  const [h,m]=v.slice(0,5).split(":").map(Number);
  const hour=h%12||12;
  return `${hour}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`;
}
function timeStamp(v:string){return new Date(v).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true,timeZone:"America/Santo_Domingo"});}

function Icon({kind}:{kind:"home"|"wallet"|"target"|"calendar"|"phone"|"note"|"chart"|"money"|"trophy"|"user"|"focus"|"bulb"|"screen"|"exit"}){
  const paths:Record<string,ReactNode>={
    home:<><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
    wallet:<><rect x="3" y="6" width="18" height="14" rx="3"/><path d="M16 10h5v6h-5a3 3 0 1 1 0-6ZM6 6V4h11v2"/></>,
    target:<><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="m14 10 7-7M17 3h4v4"/></>,
    calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></>,
    phone:<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7A2 2 0 0 1 22 16.9Z"/>,
    note:<><path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 12h7M9 16h7"/></>,
    chart:<><path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/><path d="m3 9 6-5 6 5 7-6"/></>,
    money:<><circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.8-.6-1.7-.9-2.7-.9-1.5 0-2.7.8-2.7 2s1.2 1.8 2.9 2.2c1.7.4 2.9.9 2.9 2.4s-1.3 2.3-3 2.3c-1.2 0-2.4-.4-3.3-1.2M12 5.5v13"/></>,
    trophy:<><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v4M8 20h8"/></>,
    user:<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    focus:<><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2M22 12h-2M12 22v-2M2 12h2"/></>,
    bulb:<><path d="M9 18h6M10 22h4"/><path d="M8 14a6 6 0 1 1 8 0c-1.2 1-1 2-1 2H9s.2-1-1-2Z"/></>,
    screen:<><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8M12 18v4"/></>,
    exit:<><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5"/></>
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="v96-icon">{paths[kind]}</svg>;
}

function FocusWork(){
  const [seconds,setSeconds]=useState(0);
  const [running,setRunning]=useState(false);
  const tips=[
    "Trabaja en bloques de tiempo de 25–50 minutos y toma pequeñas pausas. La constancia vence a la motivación.",
    "Empieza por las llamadas y citas que pueden producir una venta hoy.",
    "Silencia notificaciones que no sean de trabajo durante el bloque de enfoque.",
    "Trabaja una sola tarea a la vez hasta terminarla.",
    "Antes de parar, deja escrita la próxima acción para volver rápido al trabajo."
  ];
  const [tipIndex,setTipIndex]=useState(0);
  useEffect(()=>{try{const day=localStorage.getItem("og-focus-day");if(day===dateKey()){const saved=Number(localStorage.getItem("og-focus-seconds")||0);if(Number.isFinite(saved)&&saved>0)setSeconds(saved);}else{localStorage.setItem("og-focus-day",dateKey());localStorage.setItem("og-focus-seconds","0");}}catch{}},[]);
  useEffect(()=>{if(!running)return;const id=window.setInterval(()=>setSeconds(v=>{const next=v+1;try{localStorage.setItem("og-focus-day",dateKey());localStorage.setItem("og-focus-seconds",String(next));}catch{}return next;}),1000);return()=>window.clearInterval(id);},[running]);
  const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),sec=seconds%60;
  const label=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  function reset(){setRunning(false);setSeconds(0);try{localStorage.setItem("og-focus-seconds","0");}catch{}}
  return <section className="v96-focus-card">
    <div className="v96-section-title green"><Icon kind="focus"/> Enfoque de trabajo</div>
    <div className="v96-focus-grid">
      <div className="v96-focus-time"><span>Tiempo trabajando hoy</span><strong>{label}</strong><small>{seconds>0?"¡Sigue así! 💪":"Listo para empezar"}</small></div>
      <div className="v96-focus-actions">
        <button type="button" className="green-btn" onClick={()=>setRunning(true)} disabled={running}>▶ Iniciar</button>
        <button type="button" className="orange-btn" onClick={()=>setRunning(false)} disabled={!running}>Ⅱ Pausar</button>
        <button type="button" className="dark-btn" onClick={reset}>↻ Reiniciar</button>
      </div>
      <div className="v96-tip"><div className="v96-tip-title"><Icon kind="bulb"/> Consejo para rendir más</div><p>{tips[tipIndex]}</p><button type="button" onClick={()=>setTipIndex(i=>(i+1)%tips.length)}>↻ Otro consejo</button></div>
    </div>
  </section>;
}

export default function VistaRapida(){
  const [data,setData]=useState(initial);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);setMessage("");
    const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){window.location.replace("/login");return;}
    const date=dateKey(),bounds=dayBounds(),week=weekStartKey();
    const [settings,sales,completed,created,dailyClose,weeklyClose]=await Promise.all([
      supabase.from("settings").select("daily_unit_goal,close_mode").eq("user_id",user.id).single(),
      supabase.from("sales").select("id,client_name,phone,sale_time,price,status,contact_status,company_id").eq("user_id",user.id).eq("sale_date",date).eq("company_id",2).neq("status","eliminada").order("sale_time",{ascending:true}),
      supabase.from("sales").select("price").eq("user_id",user.id).eq("status","completada").eq("company_id",2).gte("completed_at",bounds.start).lt("completed_at",bounds.end),
      supabase.from("sales").select("id",{count:"exact",head:true}).eq("user_id",user.id).eq("company_id",2).gte("created_at",bounds.start).lt("created_at",bounds.end).neq("status","eliminada"),
      supabase.from("daily_closures").select("id").eq("user_id",user.id).eq("business_date",date).maybeSingle(),
      supabase.from("weekly_closures").select("id").eq("user_id",user.id).eq("week_start",week).maybeSingle()
    ]);
    const error=settings.error||sales.error||completed.error||created.error||dailyClose.error||weeklyClose.error;
    if(error)setMessage(error.message);
    const rows=(sales.data??[]) as VistaSale[];
    const completedRows=(completed.data??[]) as {price:number|string}[];
    const gross=completedRows.reduce((sum,v)=>sum+Number(v.price||0),0);
    const profile=typeof user.user_metadata?.full_name==="string"?user.user_metadata.full_name.trim():"";
    setData({
      name:profile||user.email?.split("@")[0]||"Usuario",
      grossToday:gross,dailyGoal:Number(settings.data?.daily_unit_goal??0),createdToday:created.count??0,
      completedToday:completedRows.length,sales:rows,
      phones:rows.filter(v=>v.status==="pendiente"&&Boolean(v.phone)&&v.contact_status!=="llego"),
      dailyClosed:Boolean(dailyClose.data),weeklyClosed:Boolean(weeklyClose.data),closeMode:settings.data?.close_mode==="weekly"?"weekly":"daily"
    });
    setLoading(false);
  },[]);
  useEffect(()=>{void load();},[load]);
  useRealtimeRefresh(load);
  const pendingSales=useMemo(()=>data.sales.filter(v=>v.status==="pendiente"),[data.sales]);
  const dailyProgress=data.dailyGoal>0?Math.min(data.sales.length/data.dailyGoal*100,100):0;

  return <AuthGuard><main className="v104-shell">
    <header className="v96-topbar">
      <div className="v96-brand"><LogoMark compact/><div><strong>Hola, {data.name}</strong><span>● Vista rápida · Empresa 2</span></div></div>
      <div className="v96-top-actions"><span className="v96-view-pill"><Icon kind="screen"/> Vista rápida</span><Link href="/" className="v96-exit"><Icon kind="exit"/> Salir</Link></div>
    </header>
    {message&&<div className="card error-message">{message}</div>}

    <section className="v104-kpis">
      <article className="v104-kpi v104-gross"><span>Monto bruto cobrado hoy</span><strong>{loading?"…":`RD$${money(data.grossToday)}`}</strong><small>Empresa 2 · órdenes completadas</small></article>
      <article className="v104-kpi v104-pending"><span>Órdenes pendientes</span><strong>{loading?"…":pendingSales.length}</strong><small>Por completar hoy</small></article>
      <article className="v104-kpi v104-calls"><span>Pendientes de llamada</span><strong>{loading?"…":data.phones.length}</strong><small>Clientes para contactar</small><Link href={`/agenda?date=${dateKey()}`}>Ver agenda ›</Link></article>
      <article className="v104-kpi v104-total"><span>Citas totales de hoy</span><strong>{loading?"…":data.sales.length}</strong><small>{pendingSales.length} pendientes · {data.sales.filter(v=>v.status==="completada").length} completadas</small></article>
    </section>

    <section className="v104-daily-goal">
      <div className="v104-goal-heading"><div><span>Meta de clientes diarios</span><strong>{loading?"…":`${data.sales.length} / ${data.dailyGoal||"—"}`}</strong></div><b>{loading?"…":`${dailyProgress.toFixed(0)}%`}</b></div>
      <div className="v104-goal-track"><i style={{width:`${dailyProgress}%`}}/></div>
      <small>Progreso de las citas agendadas para hoy frente a tu meta diaria.</small>
    </section>

    <section className="v104-main-grid">
      <article className="v104-appointments">
        <div className="v104-section-head"><div><span>Todas las citas del día</span><small>Solo Empresa 2 · ordenadas por hora</small></div><strong>{data.sales.length}</strong><Link href={`/agenda?date=${dateKey()}`}>Abrir agenda ›</Link></div>
        <div className="v104-appointment-list">{data.sales.length===0?<p className="v96-empty">No hay citas de Empresa 2 para hoy.</p>:data.sales.map(v=><div className="v104-appointment" key={v.id}><time>{clock(v.sale_time)}</time><div className="v104-client"><b>{v.client_name}</b><small>{v.phone||"Sin teléfono"}</small></div><strong className="v104-price">RD${money(v.price)}</strong><em className={v.status==="completada"?"done":"pending"}>{v.status==="completada"?"Completada":v.status==="instalada"?"Instalada":"Pendiente"}</em>{v.status==="pendiente"&&v.phone?<a className="v104-call" href={`tel:${v.phone}`} aria-label={`Llamar a ${v.client_name}`}><Icon kind="phone"/></a>:<span className="v104-call-placeholder"/>}</div>)}</div>
        <Link href="/agenda/nueva" className="v104-new-appointment">＋ Nueva cita</Link>
      </article>
      <article className="v104-calls-panel">
        <div className="v104-section-head"><div><span>Pendientes de llamada</span><small>Órdenes de hoy que necesitan contacto</small></div><strong>{data.phones.length}</strong></div>
        <div className="v104-calls-list">{data.phones.length===0?<p className="v96-empty">No hay llamadas pendientes.</p>:data.phones.map(v=><a className="v104-call-row" href={`tel:${v.phone}`} key={v.id}><span><b>{v.client_name}</b><small>{v.phone}</small></span><Icon kind="phone"/></a>)}</div>
        <Link href="/telefonos" className="v104-new-appointment">Ver teléfonos ›</Link>
      </article>
    </section>

    <section className="v104-bottom-grid">
      <article className="v104-close-card">
        <div className="v96-section-title green"><Icon kind="calendar"/> CONTADOR PARA EL CIERRE</div>
        <div className="v104-close-inner"><div><b>{data.closeMode==="weekly"?"Cierre semanal":"Cierre del día"}</b><span>{data.closeMode==="weekly"?"Tiempo restante de la semana":"Tiempo restante para cerrar el día"}</span></div><CloseCountdown mode={data.closeMode} closed={data.closeMode==="weekly"?data.weeklyClosed:data.dailyClosed}/></div>
      </article>
      <FocusWork/>
    </section>
    <footer className="v96-footer"><span>● Datos sincronizados · Vista rápida de Empresa 2</span><span>Meta diaria, citas y cierre en tiempo real</span></footer>
  </main></AuthGuard>;
}
