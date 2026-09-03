"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import CloseCountdown from "@/components/CloseCountdown";
import LogoMark from "@/components/LogoMark";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";

type Sale = { id:string; client_name:string; phone:string|null; sale_time:string; price:number|string; status:string; contact_status:string|null };
type Note = { id:string; note:string; updated_at:string };
type OpenList = "sales" | "phones" | "notes" | null;

type QuickData = {
  name:string;
  workingCapital:number;
  houseFund:number;
  goalBalance:number;
  goalAmount:number;
  grossToday:number;
  dailyGoal:number;
  createdToday:number;
  sales:Sale[];
  phones:Sale[];
  notes:Note[];
  dailyClosed:boolean;
  weeklyClosed:boolean;
  closeMode:"daily"|"weekly";
};

const initial:QuickData={name:"Usuario",workingCapital:0,houseFund:0,goalBalance:0,goalAmount:0,grossToday:0,dailyGoal:0,createdToday:0,sales:[],phones:[],notes:[],dailyClosed:false,weeklyClosed:false,closeMode:"daily"};

function dateKey(){
  return new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santo_Domingo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
}
function dayBounds(){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Santo_Domingo",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()).split("-").map(Number);
  const [y,m,d]=parts;
  return {start:new Date(Date.UTC(y,m-1,d,4,0,0)).toISOString(),end:new Date(Date.UTC(y,m-1,d+1,4,0,0)).toISOString()};
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
function money(v:number|string){return Number(v||0).toLocaleString("es-DO",{maximumFractionDigits:2});}
function clock(v:string){return v?.slice(0,5)||"";}

function CalendarIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>}
function PhoneIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7A2 2 0 0 1 22 16.9Z"/></svg>}
function NoteIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 12h7M9 16h7"/></svg>}

function FocusWork(){
  const [seconds,setSeconds]=useState(0);
  const [running,setRunning]=useState(false);
  const tips=[
    "Trabaja una sola tarea a la vez hasta terminarla.",
    "Empieza por las llamadas y citas que pueden producir una venta hoy.",
    "Silencia notificaciones que no sean de trabajo durante el bloque de enfoque.",
    "Haz bloques de 45–60 minutos y toma una pausa corta antes del siguiente.",
    "Antes de parar, deja escrita la próxima acción para volver rápido al trabajo."
  ];
  const [tipIndex,setTipIndex]=useState(0);

  useEffect(()=>{
    try{
      const saved=Number(localStorage.getItem("og-focus-seconds")||0);
      if(Number.isFinite(saved)&&saved>0)setSeconds(saved);
    }catch{}
  },[]);
  useEffect(()=>{
    if(!running)return;
    const id=window.setInterval(()=>setSeconds(v=>{const next=v+1;try{localStorage.setItem("og-focus-day",dateKey());localStorage.setItem("og-focus-seconds",String(next));}catch{}return next;}),1000);
    return()=>window.clearInterval(id);
  },[running]);

  const h=Math.floor(seconds/3600),m=Math.floor((seconds%3600)/60),sec=seconds%60;
  const label=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  function reset(){setRunning(false);setSeconds(0);try{localStorage.setItem("og-focus-seconds","0");}catch{}}

  return <section className="focus-work-card" aria-label="Enfoque de trabajo">
    <div className="focus-work-head"><div><span className="focus-kicker">Enfoque de trabajo</span><h2>Tiempo trabajando hoy</h2></div><strong className="focus-time" aria-live="polite">{label}</strong></div>
    <div className="focus-actions">
      <button type="button" className="btn" onClick={()=>setRunning(v=>!v)}>{running?"Pausar":"Iniciar trabajo"}</button>
      <button type="button" className="btn secondary" onClick={reset}>Reiniciar</button>
    </div>
    <div className="focus-tip">
      <div><span>Consejo para rendir más</span><p>{tips[tipIndex]}</p></div>
      <button type="button" className="focus-next-tip" onClick={()=>setTipIndex(i=>(i+1)%tips.length)}>Otro consejo</button>
    </div>
  </section>;
}

export default function VistaRapida(){
  const [data,setData]=useState(initial);
  const [loading,setLoading]=useState(true);
  const [message,setMessage]=useState("");
  const [open,setOpen]=useState<OpenList>(null);
  const [now,setNow]=useState(()=>new Date());
  const [showGross,setShowGross]=useState(true),[showCapital,setShowCapital]=useState(true),[showHouse,setShowHouse]=useState(true);

  const load=useCallback(async()=>{
    setLoading(true); setMessage("");
    const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){window.location.replace("/login");return;}
    const date=dateKey(),bounds=dayBounds(),week=weekStartKey();
    const [wallet,settings,sales,completed,created,notes,dailyClose,weeklyClose]=await Promise.all([
      supabase.from("wallets").select("working_capital,house_fund,goal_balance").eq("user_id",user.id).single(),
      supabase.from("settings").select("goal_amount,daily_unit_goal,close_mode").eq("user_id",user.id).single(),
      supabase.from("sales").select("id,client_name,phone,sale_time,price,status,contact_status").eq("user_id",user.id).eq("sale_date",date).neq("status","eliminada").order("sale_time",{ascending:true}),
      supabase.from("sales").select("price").eq("user_id",user.id).eq("status","completada").gte("completed_at",bounds.start).lt("completed_at",bounds.end),
      supabase.from("sales").select("id",{count:"exact",head:true}).eq("user_id",user.id).gte("created_at",bounds.start).lt("created_at",bounds.end).neq("status","eliminada"),
      supabase.from("link_bloc_notes").select("id,note,updated_at").eq("user_id",user.id).gte("updated_at",bounds.start).lt("updated_at",bounds.end).order("updated_at",{ascending:false}),
      supabase.from("daily_closures").select("id").eq("user_id",user.id).eq("business_date",date).maybeSingle(),
      supabase.from("weekly_closures").select("id").eq("user_id",user.id).eq("week_start",week).maybeSingle()
    ]);
    const error=wallet.error||settings.error||sales.error||completed.error||created.error||notes.error||dailyClose.error||weeklyClose.error;
    if(error)setMessage(error.message);
    const rows=(sales.data??[]) as Sale[];
    const phoneRows=rows.filter(v=>v.status==="pendiente"&&Boolean(v.phone)&&v.contact_status!=="llego");
    const gross=(completed.data??[]).reduce((sum,v)=>sum+Number(v.price||0),0);
    const profile=typeof user.user_metadata?.full_name==="string"?user.user_metadata.full_name.trim():"";
    setData({
      name:profile||user.email?.split("@")[0]||"Usuario",
      workingCapital:Number(wallet.data?.working_capital??0),houseFund:Number(wallet.data?.house_fund??0),goalBalance:Number(wallet.data?.goal_balance??0),goalAmount:Number(settings.data?.goal_amount??0),
      grossToday:gross,dailyGoal:Number(settings.data?.daily_unit_goal??0),createdToday:created.count??0,sales:rows,phones:phoneRows,notes:(notes.data??[]) as Note[],dailyClosed:Boolean(dailyClose.data),weeklyClosed:Boolean(weeklyClose.data),closeMode:settings.data?.close_mode==="weekly"?"weekly":"daily"
    });
    setLoading(false);
  },[]);

  useEffect(()=>{void load();try{setShowGross(localStorage.getItem("og-show-gross")!=="0");setShowCapital(localStorage.getItem("og-show-capital")!=="0");setShowHouse(localStorage.getItem("og-show-house")!=="0");}catch{}},[load]);
  useEffect(()=>{const id=window.setInterval(()=>setNow(new Date()),1000);return()=>window.clearInterval(id);},[]);
  useRealtimeRefresh(load);

  const pendingSales=useMemo(()=>data.sales.filter(v=>v.status==="pendiente"),[data.sales]);
  const dailyProgress=data.dailyGoal>0?Math.min(data.createdToday/data.dailyGoal*100,100):0;
  const goalProgress=data.goalAmount>0?Math.min(data.goalBalance/data.goalAmount*100,100):0;
  const dateLabel=new Intl.DateTimeFormat("es-DO",{timeZone:"America/Santo_Domingo",weekday:"long",day:"numeric",month:"long"}).format(now);
  const timeLabel=new Intl.DateTimeFormat("en-US",{timeZone:"America/Santo_Domingo",hour:"numeric",minute:"2-digit",hour12:true}).format(now);

  function toggle(which:OpenList){setOpen(current=>current===which?null:which);}

  return <AuthGuard><main className="quick-view-shell">
    <header className="quick-view-topbar">
      <div className="quick-view-brand"><LogoMark compact/><div><strong>Hola, {data.name}</strong><span>Vista rápida del día</span></div></div>
      <Link href="/" className="quick-view-close" aria-label="Volver al inicio">×</Link>
    </header>
    {message&&<div className="card error-message">{message}</div>}

    <section className="quick-orbit" aria-label="Resumen rápido">
      <div className="quick-time">{timeLabel}</div><div className="quick-date">{dateLabel}</div>
      <div className="quick-gross"><span>Monto bruto de hoy</span><strong>{loading?"…":showGross?`RD$${money(data.grossToday)}`:"RD$••••••"}</strong></div>
      <div className="quick-side quick-side-left"><span>Capital</span><strong>{showCapital?`RD$${money(data.workingCapital)}`:"RD$••••••"}</strong></div>
      <div className="quick-side quick-side-right"><span>Casa</span><strong>{showHouse?`RD$${money(data.houseFund)}`:"RD$••••••"}</strong></div>
      <div className="quick-goal-ring"><strong>{dailyProgress.toFixed(0)}%</strong><span>Meta diaria</span></div>
      <div className="quick-financial"><span>Meta financiera</span><strong>{goalProgress.toFixed(1)}%</strong></div>
      <div className="quick-actions" aria-label="Listas rápidas">
        <button type="button" className={open==="sales"?"active cyan":"cyan"} onClick={()=>toggle("sales")}><CalendarIcon/><span>Citas del día</span><strong>{pendingSales.length}</strong><small>{open==="sales"?"Cerrar":"Ver"}</small></button>
        <button type="button" className={open==="phones"?"active orange":"orange"} onClick={()=>toggle("phones")}><PhoneIcon/><span>Pendientes de llamar</span><strong>{data.phones.length}</strong><small>{open==="phones"?"Cerrar":"Ver"}</small></button>
        <button type="button" className={open==="notes"?"active purple":"purple"} onClick={()=>toggle("notes")}><NoteIcon/><span>Bloc · notas</span><strong>{data.notes.length}</strong><small>{open==="notes"?"Cerrar":"Ver"}</small></button>
      </div>
    </section>

    {open!==null&&<section className={`quick-drawer quick-drawer-${open}`}>
      <div className="quick-drawer-heading"><h2>{open==="sales"?"Citas del día":open==="phones"?"Pendientes de llamar hoy":"Notas del Bloc de hoy"}</h2><button type="button" onClick={()=>setOpen(null)} aria-label="Cerrar lista">×</button></div>
      {open==="sales"&&(pendingSales.length===0?<p className="muted">No hay citas pendientes para hoy.</p>:pendingSales.map(v=><Link href={`/agenda?date=${dateKey()}`} className="quick-list-row" key={v.id}><div><strong>{v.client_name}</strong><span>{clock(v.sale_time)} · RD${money(v.price)}</span></div><b>Pendiente</b></Link>))}
      {open==="phones"&&(data.phones.length===0?<p className="muted">No hay números pendientes de llamar para hoy.</p>:data.phones.map(v=><Link href={`/agenda?date=${dateKey()}`} className="quick-list-row" key={v.id}><div><strong>{v.client_name}</strong><span>{v.phone} · {clock(v.sale_time)}</span></div><b>{v.contact_status==="llamo"?"Llamó":"Pendiente"}</b></Link>))}
      {open==="notes"&&(data.notes.length===0?<p className="muted">No hay notas del Bloc modificadas hoy.</p>:data.notes.map(n=><Link href="/link/bloc" className="quick-note-row" key={n.id}><span>{n.note.trim()||"Nota sin texto"}</span><small>{new Date(n.updated_at).toLocaleTimeString("es-DO",{hour:"2-digit",minute:"2-digit",timeZone:"America/Santo_Domingo"})}</small></Link>))}
    </section>}

    <section className="quick-countdowns quick-countdowns-single">
      <CloseCountdown mode={data.closeMode} closed={data.closeMode==="weekly"?data.weeklyClosed:data.dailyClosed}/>
    </section>

    <FocusWork />

    <div className="quick-view-hint">Toca una lista para verla aquí. Si no abres ninguna, esta zona permanece vacía.</div>
  </main></AuthGuard>;
}
