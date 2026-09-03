"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";
import CloseCountdown from "@/components/CloseCountdown";
import LogoMark from "@/components/LogoMark";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";

type Sale = { id:string; client_name:string; phone:string|null; sale_time:string; price:number|string; status:string; contact_status:string|null };
type Note = { id:string; note:string; updated_at:string };
type QuickData = {
  name:string;
  workingCapital:number;
  houseFund:number;
  goalBalance:number;
  goalAmount:number;
  grossToday:number;
  monthSales:number;
  dailyHouseAmount:number;
  mp1:number;
  mp2:number;
  mp3:number;
  dailyGoal:number;
  createdToday:number;
  completedToday:number;
  totalClients:number;
  sales:Sale[];
  phones:Sale[];
  notes:Note[];
  dailyClosed:boolean;
  weeklyClosed:boolean;
  closeMode:"daily"|"weekly";
};

const initial:QuickData={name:"Usuario",workingCapital:0,houseFund:0,goalBalance:0,goalAmount:0,grossToday:0,monthSales:0,dailyHouseAmount:0,mp1:0,mp2:0,mp3:0,dailyGoal:0,createdToday:0,completedToday:0,totalClients:0,sales:[],phones:[],notes:[],dailyClosed:false,weeklyClosed:false,closeMode:"daily"};

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
  const [showGross,setShowGross]=useState(true);
  const [showCapital,setShowCapital]=useState(true);
  const [showHouse,setShowHouse]=useState(true);

  const load=useCallback(async()=>{
    setLoading(true);setMessage("");
    const supabase=createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){window.location.replace("/login");return;}
    const date=dateKey(),bounds=dayBounds(),month=monthBounds(),week=weekStartKey();
    const [wallet,settings,sales,completed,created,notes,dailyClose,weeklyClose,monthCompleted,totalClients]=await Promise.all([
      supabase.from("wallets").select("working_capital,house_fund,goal_balance").eq("user_id",user.id).single(),
      supabase.from("settings").select("goal_amount,daily_unit_goal,daily_house_amount,mp1,mp2,mp3,close_mode").eq("user_id",user.id).single(),
      supabase.from("sales").select("id,client_name,phone,sale_time,price,status,contact_status").eq("user_id",user.id).eq("sale_date",date).neq("status","eliminada").order("sale_time",{ascending:true}),
      supabase.from("sales").select("price").eq("user_id",user.id).eq("status","completada").gte("completed_at",bounds.start).lt("completed_at",bounds.end),
      supabase.from("sales").select("id",{count:"exact",head:true}).eq("user_id",user.id).gte("created_at",bounds.start).lt("created_at",bounds.end).neq("status","eliminada"),
      supabase.from("link_bloc_notes").select("id,note,updated_at").eq("user_id",user.id).gte("updated_at",bounds.start).lt("updated_at",bounds.end).order("updated_at",{ascending:false}).limit(20),
      supabase.from("daily_closures").select("id").eq("user_id",user.id).eq("business_date",date).maybeSingle(),
      supabase.from("weekly_closures").select("id").eq("user_id",user.id).eq("week_start",week).maybeSingle(),
      supabase.from("sales").select("price").eq("user_id",user.id).eq("status","completada").gte("completed_at",month.start).lt("completed_at",month.end),
      supabase.from("sales").select("id",{count:"exact",head:true}).eq("user_id",user.id).neq("status","eliminada")
    ]);
    const error=wallet.error||settings.error||sales.error||completed.error||created.error||notes.error||dailyClose.error||weeklyClose.error||monthCompleted.error||totalClients.error;
    if(error)setMessage(error.message);
    const rows=(sales.data??[]) as Sale[];
    const phoneRows=rows.filter(v=>v.status==="pendiente"&&Boolean(v.phone)&&v.contact_status!=="llego");
    const completedRows=(completed.data??[]) as {price:number|string}[];
    const gross=completedRows.reduce((sum,v)=>sum+Number(v.price||0),0);
    const monthGross=((monthCompleted.data??[]) as {price:number|string}[]).reduce((sum,v)=>sum+Number(v.price||0),0);
    const profile=typeof user.user_metadata?.full_name==="string"?user.user_metadata.full_name.trim():"";
    setData({
      name:profile||user.email?.split("@")[0]||"Usuario",
      workingCapital:Number(wallet.data?.working_capital??0),houseFund:Number(wallet.data?.house_fund??0),goalBalance:Number(wallet.data?.goal_balance??0),goalAmount:Number(settings.data?.goal_amount??0),
      grossToday:gross,monthSales:monthGross,dailyHouseAmount:Number(settings.data?.daily_house_amount??0),mp1:Number(settings.data?.mp1??0),mp2:Number(settings.data?.mp2??0),mp3:Number(settings.data?.mp3??0),dailyGoal:Number(settings.data?.daily_unit_goal??0),createdToday:created.count??0,completedToday:completedRows.length,totalClients:totalClients.count??0,
      sales:rows,phones:phoneRows,notes:(notes.data??[]) as Note[],dailyClosed:Boolean(dailyClose.data),weeklyClosed:Boolean(weeklyClose.data),closeMode:settings.data?.close_mode==="weekly"?"weekly":"daily"
    });
    setLoading(false);
  },[]);

  useEffect(()=>{void load();},[load]);
  useEffect(()=>{
    const syncPrivacy=()=>{
      try{
        setShowGross(localStorage.getItem("og-show-gross")!=="0");
        setShowCapital(localStorage.getItem("og-show-capital")!=="0");
        setShowHouse(localStorage.getItem("og-show-house")!=="0");
      }catch{}
    };
    syncPrivacy();
    window.addEventListener("storage",syncPrivacy);
    window.addEventListener("focus",syncPrivacy);
    document.addEventListener("visibilitychange",syncPrivacy);
    return()=>{
      window.removeEventListener("storage",syncPrivacy);
      window.removeEventListener("focus",syncPrivacy);
      document.removeEventListener("visibilitychange",syncPrivacy);
    };
  },[]);
  useRealtimeRefresh(load);

  const pendingSales=useMemo(()=>data.sales.filter(v=>v.status==="pendiente"),[data.sales]);
  const completedSales=useMemo(()=>data.sales.filter(v=>v.status==="completada"),[data.sales]);
  const goalProgress=data.goalAmount>0?Math.min(data.goalBalance/data.goalAmount*100,100):0;
  const dailyProgress=data.dailyGoal>0?Math.min(data.createdToday/data.dailyGoal*100,100):0;
  const houseProgress=data.dailyHouseAmount>0?Math.min(data.houseFund/(data.dailyHouseAmount*5)*100,100):0;
  const capitalPerSale=data.mp1+data.mp2+data.mp3;
  const currentCapitalNeed=data.completedToday*capitalPerSale;
  const currentAfterCapital=Math.max(data.grossToday-currentCapitalNeed,0);
  const currentHouseNeed=Math.min(data.dailyHouseAmount,currentAfterCapital);
  const currentMetaPotential=Math.max(data.grossToday-currentCapitalNeed-currentHouseNeed,0);
  const pendingGross=pendingSales.reduce((sum,v)=>sum+Number(v.price||0),0);
  const projectedGross=data.grossToday+pendingGross;
  const projectedCompleted=data.completedToday+pendingSales.length;
  const projectedCapitalNeed=projectedCompleted*capitalPerSale;
  const projectedAfterCapital=Math.max(projectedGross-projectedCapitalNeed,0);
  const projectedHouseNeed=Math.min(data.dailyHouseAmount,projectedAfterCapital);
  const projectedMetaPotential=Math.max(projectedGross-projectedCapitalNeed-projectedHouseNeed,0);
  const scheduledGoalIncrease=Math.max(projectedMetaPotential-currentMetaPotential,0);
  const projectedGoalProgress=data.goalAmount>0?Math.min((data.goalBalance+scheduledGoalIncrease)/data.goalAmount*100,100):0;

  return <AuthGuard><main className="v96-shell">
    <header className="v96-topbar">
      <div className="v96-brand"><LogoMark compact/><div><strong>Hola, {data.name}</strong><span>● Vista rápida del día</span></div></div>
      <div className="v96-top-actions"><span className="v96-view-pill"><Icon kind="screen"/> Vista rápida</span><Link href="/" className="v96-exit"><Icon kind="exit"/> Salir</Link></div>
    </header>
    {message&&<div className="card error-message">{message}</div>}

    <section className="v96-finance-grid">
      <article className="v96-card v96-house-card">
        <div className="v96-card-heading orange"><span className="v96-round-icon"><Icon kind="home"/></span><span>Casa</span></div>
        <strong className="v96-big-money orange">{loading?"…":showHouse?`RD$${money(data.houseFund)}`:"RD$••••••"}</strong>
        <div className="v96-house-copy">Gasto diario: RD${money(data.dailyHouseAmount)}<br/>Disponible para usar</div>
        <div className="v96-progress"><i style={{width:`${houseProgress}%`}}/><span>{Math.round(houseProgress)}%</span></div>
        <Link href="/casa" className="v96-outline-btn orange">Retirar</Link>
      </article>

      <article className="v96-capital-card">
        <span className="v96-capital-title">Capital de trabajo</span>
        <strong>{loading?"…":showCapital?`RD$${money(data.workingCapital)}`:"RD$••••••"}</strong>
        <span className="v96-capital-icon"><Icon kind="wallet"/></span>
        <p>Disponible para invertir y producir</p>
        <small>● Sincronizado en todos tus dispositivos</small>
        <Link href="/capital" className="v96-capital-btn">Agregar manual</Link>
      </article>

      <article className="v96-card v96-goal-card">
        <div className="v96-card-heading purple"><span>Meta financiera</span><span className="v96-round-icon"><Icon kind="target"/></span></div>
        <strong className="v96-goal-percent">{goalProgress.toFixed(1)}%</strong>
        <div className="v96-goal-progress"><i style={{width:`${goalProgress}%`}}/></div>
        <div className="v99-goal-potential">
          <span>Potencial con lo agendado hoy</span>
          <strong>{loading?"…":`+RD$${money(scheduledGoalIncrease)}`}</strong>
          <small>{pendingSales.length>0?`Si completas todo, podrías llegar a ${projectedGoalProgress.toFixed(1)}%`:`No hay trabajo pendiente agendado hoy.`}</small>
        </div>
        <Link href="/configuracion" className="v96-outline-btn purple">Ver progreso</Link>
      </article>
    </section>

    <section className="v96-lists-grid">
      <article className="v96-list-card cyan">
        <div className="v96-list-head"><span className="v96-round-icon"><Icon kind="calendar"/></span><div><b>Citas del día</b><strong>{data.sales.length}</strong><small>{pendingSales.length} pendientes · {completedSales.length} completada{completedSales.length===1?"":"s"}</small></div><Link href={`/agenda?date=${dateKey()}`}>Ver todas ›</Link></div>
        <div className="v96-list-body">{data.sales.length===0?<p className="v96-empty">No hay citas para hoy.</p>:data.sales.slice(0,3).map(v=><div className="v96-list-row" key={v.id}><span>{clock(v.sale_time)}</span><b>{v.client_name}</b><em className={v.status==="completada"?"done":"pending"}>{v.status==="completada"?"Completada":"Pendiente"}</em></div>)}</div>
        <Link href="/agenda/nueva" className="v96-list-action">＋ Nueva cita</Link>
      </article>

      <article className="v96-list-card orange">
        <div className="v96-list-head"><span className="v96-round-icon"><Icon kind="phone"/></span><div><b>Pendientes de llamar</b><strong>{data.phones.length}</strong><small>Solo de hoy</small></div><Link href={`/agenda?date=${dateKey()}`}>Ver todas ›</Link></div>
        <div className="v96-list-body">{data.phones.length===0?<p className="v96-empty">No hay llamadas pendientes.</p>:data.phones.slice(0,4).map(v=><a className="v96-phone-row" href={`tel:${v.phone}`} key={v.id}><span>{v.phone}</span><Icon kind="phone"/></a>)}</div>
        <Link href="/telefonos" className="v96-list-action">＋ Agregar número</Link>
      </article>

      <article className="v96-list-card purple">
        <div className="v96-list-head"><span className="v96-round-icon"><Icon kind="note"/></span><div><b>Bloc · notas del día</b><strong>{data.notes.length}</strong><small>Notas registradas</small></div><Link href="/link/bloc">Ver todas ›</Link></div>
        <div className="v96-list-body">{data.notes.length===0?<p className="v96-empty">No hay notas.</p>:data.notes.slice(0,2).map(n=><Link className="v96-note-row" href="/link/bloc" key={n.id}><div><b>{n.note.split("\n")[0]||"Nota"}</b><span>{n.note.split("\n").slice(1).join(" ").slice(0,70)}</span></div><small>{timeStamp(n.updated_at)}</small></Link>)}</div>
        <Link href="/link/bloc" className="v96-list-action">＋ Nueva nota</Link>
      </article>
    </section>

    <section className="v96-bottom-grid">
      <article className="v96-close-card">
        <div className="v96-section-title green"><Icon kind="calendar"/> Cierre activo</div>
        <div className="v96-close-inner"><div className="v96-close-copy"><Icon kind="calendar"/><b>{data.closeMode==="weekly"?"Cierre semanal":"Cierre del día"}</b><span>{data.closeMode==="weekly"?"Hasta terminar el domingo":"Hasta terminar el día"}</span></div><CloseCountdown mode={data.closeMode} closed={data.closeMode==="weekly"?data.weeklyClosed:data.dailyClosed}/></div>
      </article>
      <FocusWork/>
    </section>

    <section className="v96-metrics">
      <Link href="/" className="v96-metric cyan"><Icon kind="chart"/><div><span>Monto bruto de hoy</span><strong>{showGross?`RD$${money(data.grossToday)}`:"RD$••••••"}</strong><small>Ver detalle ›</small></div></Link>
      <Link href="/" className="v96-metric purple"><Icon kind="money"/><div><span>Meta diaria</span><strong>{dailyProgress.toFixed(0)}%</strong><small>Ver progreso ›</small></div></Link>
      <Link href="/historial" className="v96-metric gold"><Icon kind="trophy"/><div><span>Órdenes hoy</span><strong>{data.completedToday}</strong><small>Ver historial ›</small></div></Link>
      <Link href="/agenda" className="v96-metric blue"><Icon kind="user"/><div><span>Clientes totales</span><strong>{data.totalClients}</strong><small>Ver todos ›</small></div></Link>
      <Link href="/historial" className="v96-metric green"><Icon kind="money"/><div><span>Ventas del mes</span><strong>RD${money(data.monthSales)}</strong><small>Ver reporte ›</small></div></Link>
      <div className="v96-motivation">⚡ <span>Enfócate hoy,<br/>construye tu mañana.<br/><b>¡Tú puedes lograrlo! 💪</b></span></div>
    </section>

    <footer className="v96-footer"><span>🛡 Tus datos están seguros y sincronizados en la nube</span><span>● Última sincronización: ahora mismo</span></footer>
  </main></AuthGuard>;
}
