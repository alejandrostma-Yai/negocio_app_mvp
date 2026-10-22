"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";
import CloseCountdown from "@/components/CloseCountdown";
import LogoMark from "@/components/LogoMark";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";

type VistaSale = { id:string; client_name:string; phone:string|null; sale_time:string; price:number|string; status:string; contact_status:string|null; contact_note:string|null; company_id:1|2 };
type QuickData = {
  name:string; grossToday:number; grossMonth:number; totalAppointments:number; dailyGoal:number; createdToday:number; completedToday:number;
  sales:VistaSale[]; phones:VistaSale[]; dailyClosed:boolean; weeklyClosed:boolean; closeMode:"daily"|"weekly";
};
const initial:QuickData={name:"Usuario",grossToday:0,grossMonth:0,totalAppointments:0,dailyGoal:0,createdToday:0,completedToday:0,sales:[],phones:[],dailyClosed:false,weeklyClosed:false,closeMode:"daily"};

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

export default function VistaRapida(){
  const [data,setData]=useState(initial);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");
  const [showGrossToday,setShowGrossToday]=useState(true);
  const [showGrossMonth,setShowGrossMonth]=useState(true);

  const load=useCallback(async()=>{
    setLoading(true);setMessage("");
    const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){window.location.replace("/login");return;}
    const date=dateKey(),bounds=dayBounds(),week=weekStartKey();
    const month=monthBounds();
    const [settings,sales,completed,monthCompleted,created,allAppointments,dailyClose,weeklyClose,expensesToday]=await Promise.all([
      supabase.from("settings").select("daily_unit_goal,close_mode").eq("user_id",user.id).single(),
      supabase.from("sales").select("id,client_name,phone,sale_time,price,status,contact_status,contact_note,company_id").eq("user_id",user.id).eq("sale_date",date).eq("company_id",2).neq("status","eliminada").order("sale_time",{ascending:true}),
      supabase.from("sales").select("price").eq("user_id",user.id).eq("status","completada").eq("company_id",2).gte("completed_at",bounds.start).lt("completed_at",bounds.end),
      supabase.from("sales").select("price").eq("user_id",user.id).eq("status","completada").eq("company_id",2).gte("completed_at",month.start).lt("completed_at",month.end),
      supabase.from("sales").select("id",{count:"exact",head:true}).eq("user_id",user.id).eq("company_id",2).gte("created_at",bounds.start).lt("created_at",bounds.end).neq("status","eliminada"),
      supabase.from("sales").select("id",{count:"exact",head:true}).eq("user_id",user.id).eq("company_id",2).neq("status","eliminada").neq("status","cancelada"),
      supabase.from("daily_closures").select("id").eq("user_id",user.id).eq("business_date",date).maybeSingle(),
      supabase.from("weekly_closures").select("id").eq("user_id",user.id).eq("week_start",week).maybeSingle(),
      supabase.from("business_expenses").select("amount").eq("user_id",user.id).eq("company_id",2).gte("created_at",bounds.start).lt("created_at",bounds.end)
    ]);
    const error=settings.error||sales.error||completed.error||monthCompleted.error||created.error||allAppointments.error||dailyClose.error||weeklyClose.error||expensesToday.error;
    if(error)setMessage(error.message);
    const rows=(sales.data??[]) as VistaSale[];
    const completedRows=(completed.data??[]) as {price:number|string}[];
    const monthRows=(monthCompleted.data??[]) as {price:number|string}[];
    const gross=completedRows.reduce((sum,v)=>sum+Number(v.price||0),0);
    const spentToday=(expensesToday.data??[]).reduce((sum,v)=>sum+Number(v.amount||0),0);
    const grossAvailableToday=Math.max(gross-spentToday,0);
    const grossMonth=monthRows.reduce((sum,v)=>sum+Number(v.price||0),0);
    const profile=typeof user.user_metadata?.full_name==="string"?user.user_metadata.full_name.trim():"";
    setData({
      name:profile||user.email?.split("@")[0]||"Usuario",
      grossToday:grossAvailableToday,grossMonth,totalAppointments:allAppointments.count??0,dailyGoal:Number(settings.data?.daily_unit_goal??0),createdToday:created.count??0,
      completedToday:completedRows.length,sales:rows,
      phones:rows.filter(v=>Boolean(v.phone)&&(v.status==="pendiente"||v.status==="cancelada"||Boolean(v.contact_status))),
      dailyClosed:Boolean(dailyClose.data),weeklyClosed:Boolean(weeklyClose.data),closeMode:settings.data?.close_mode==="weekly"?"weekly":"daily"
    });
    setLoading(false);
  },[]);
  useEffect(()=>{void load();},[load]);
  // Refresca automáticamente al cambiar la fecha local de República Dominicana, incluso si la pantalla queda abierta.
  useEffect(()=>{
    let lastDate=dateKey();
    const timer=window.setInterval(()=>{
      const current=dateKey();
      if(current!==lastDate){lastDate=current;void load();}
    },30_000);
    return ()=>window.clearInterval(timer);
  },[load]);
  useRealtimeRefresh(load);
  // Actualiza el monto disponible después de un retiro aunque Supabase Realtime no emita el evento.
  useEffect(()=>{const timer=window.setInterval(()=>{void load();},15000);return ()=>window.clearInterval(timer);},[load]);
  const pendingSales=useMemo(()=>data.sales.filter(v=>v.status==="pendiente"),[data.sales]);
  const activeAppointments=data.sales.filter(v=>v.status!=="cancelada").length;
  const pendingCalls=data.phones.filter(v=>v.status==="pendiente"&&!v.contact_status).length;
  const dailyProgress=data.dailyGoal>0?Math.min(data.createdToday/data.dailyGoal*100,100):0;

  return <AuthGuard><main className="v104-shell">
    <header className="v96-topbar">
      <div className="v96-brand"><LogoMark compact/><div><strong>Hola, {data.name}</strong><span>● Vista rápida · Empresa 2</span></div></div>
      <div className="v96-top-actions"><span className="v96-view-pill"><Icon kind="screen"/> Vista rápida</span><Link href="/" className="v96-exit"><Icon kind="exit"/> Salir</Link></div>
    </header>
    {message&&<div className="card error-message">{message}</div>}

    <section className="v104-kpis">
      <article className="v104-kpi v104-gross"><div className="v110-kpi-title"><span>Monto bruto disponible hoy</span><button type="button" className="v110-eye" aria-label={showGrossToday?"Ocultar monto bruto de hoy":"Mostrar monto bruto de hoy"} title={showGrossToday?"Ocultar monto":"Mostrar monto"} onClick={()=>setShowGrossToday(v=>!v)}>{showGrossToday?"◉":"◎"}</button></div><strong>{loading?"…":showGrossToday?`RD$${money(data.grossToday)}`:"RD$••••••"}</strong><small>Ventas completadas menos retiros y gastos · Empresa 2</small></article>
      <article className="v104-kpi v104-month-gross"><div className="v110-kpi-title"><span>Monto bruto generado este mes</span><button type="button" className="v110-eye" aria-label={showGrossMonth?"Ocultar monto bruto del mes":"Mostrar monto bruto del mes"} title={showGrossMonth?"Ocultar monto":"Mostrar monto"} onClick={()=>setShowGrossMonth(v=>!v)}>{showGrossMonth?"◉":"◎"}</button></div><strong>{loading?"…":showGrossMonth?`RD$${money(data.grossMonth)}`:"RD$••••••"}</strong><small>Acumulado desde el día 1 · Empresa 2</small></article>
      <article className="v104-kpi v104-system-total"><span>Citas totales en el sistema</span><strong>{loading?"…":data.totalAppointments}</strong><small>Empresa 2 · excluye citas eliminadas</small></article>
      <article className="v104-kpi v104-pending"><span>Órdenes pendientes</span><strong>{loading?"…":pendingSales.length}</strong><small>Por completar hoy</small></article>
      <article className="v104-kpi v104-calls"><span>Pendientes de llamada</span><strong>{loading?"…":pendingCalls}</strong><small>Sin llamada registrada todavía</small><Link href={`/agenda?date=${dateKey()}`}>Ver agenda ›</Link></article>
      <article className="v104-kpi v104-total"><span>Citas totales de hoy</span><strong>{loading?"…":data.sales.length}</strong><small>{pendingSales.length} pendientes · {data.sales.filter(v=>v.status==="completada").length} completadas</small></article>
    </section>

    <section className="v104-daily-goal">
      <div className="v104-goal-heading"><div><span>Meta de clientes diarios</span><strong>{loading?"…":`${data.createdToday} / ${data.dailyGoal||"—"}`}</strong></div><b>{loading?"…":`${dailyProgress.toFixed(0)}%`}</b></div>
      <div className="v104-goal-track"><i style={{width:`${dailyProgress}%`}}/></div>
      <small>Citas nuevas agregadas hoy a la agenda, sin importar para qué fecha fueron programadas.</small>
    </section>

    <section className="v104-main-grid">
      <article className="v104-appointments">
        <div className="v104-section-head"><div><span>Todas las citas del día</span><small>Solo Empresa 2 · ordenadas por hora</small></div><strong>{data.sales.length}</strong><Link href={`/agenda?date=${dateKey()}`}>Abrir agenda ›</Link></div>
        <div className="v104-appointment-list">{data.sales.length===0?<p className="v96-empty">No hay citas de Empresa 2 para hoy.</p>:data.sales.map(v=><div className="v104-appointment" key={v.id}><time>{clock(v.sale_time)}</time><div className="v104-client"><b>{v.client_name}</b></div><strong className="v104-price">RD${money(v.price)}</strong><em className={v.status==="completada"?"done":v.status==="cancelada"?"cancelled":"pending"}>{v.status==="completada"?"Completada":v.status==="instalada"||v.status==="pendiente_pago"?"Instalada":v.status==="cancelada"?"Cancelada":"Pendiente"}</em></div>)}</div>
        <Link href="/agenda/nueva" className="v104-new-appointment">＋ Nueva cita</Link>
      </article>
      <article className="v104-calls-panel">
        <div className="v104-section-head"><div><span>Estado de llamadas</span><small>Seguimiento de contacto y órdenes canceladas</small></div><strong>{data.phones.length}</strong></div>
        <div className="v104-calls-list">{data.phones.length===0?<p className="v96-empty">No hay contactos para mostrar.</p>:data.phones.map(v=><div className="v104-call-row" key={v.id}><span><b>{v.client_name}</b><small className="v104-call-phone">{v.phone||"Sin teléfono"}</small>{v.contact_note&&<small className="v104-call-note">Nota: {v.contact_note}</small>}</span><em className={`v104-contact-status ${v.status==="cancelada"?"is-cancelled":v.contact_status?`is-${v.contact_status}`:"is-pending"}`}>{v.status==="cancelada"?"Cancelada":v.contact_status==="llamo"?"Llamó":v.contact_status==="camino"?"Está en camino":v.contact_status==="llego"?"Llegó":"Pendiente de llamada"}</em>{v.phone&&v.status==="pendiente"?<a className="v104-call" href={`tel:${v.phone}`} aria-label={`Llamar a ${v.client_name}`}><Icon kind="phone"/></a>:null}</div>)}</div>
        <Link href="/telefonos" className="v104-new-appointment">Ver teléfonos ›</Link>
      </article>
    </section>

    <section className="v104-bottom-grid v107-bottom-grid">
      <article className="v104-close-card">
        <div className="v96-section-title green"><Icon kind="calendar"/> CONTADOR PARA EL CIERRE</div>
        <div className="v104-close-inner"><div><b>{data.closeMode==="weekly"?"Cierre semanal":"Cierre del día"}</b><span>{data.closeMode==="weekly"?"Tiempo restante de la semana":"Tiempo restante para cerrar el día"}</span></div><CloseCountdown mode={data.closeMode} closed={data.closeMode==="weekly"?data.weeklyClosed:data.dailyClosed}/></div>
      </article>
    </section>
    <footer className="v96-footer"><span>● Datos sincronizados · Vista rápida de Empresa 2</span><span>Meta diaria, citas y cierre en tiempo real</span></footer>
  </main></AuthGuard>;
}
