"use client";

import { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";

type BlocNote = { id:string; note:string; created_at:string; updated_at:string; counter_value:number; timer_seconds:number };

function timeText(seconds:number){ return `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`; }

export default function LinkBlocPage(){
  const [notes,setNotes]=useState<BlocNote[]>([]), [loading,setLoading]=useState(true), [creating,setCreating]=useState(false), [message,setMessage]=useState("");
  const [running,setRunning]=useState<Record<string,boolean>>({});
  const saveTimers=useRef<Record<string,ReturnType<typeof setTimeout>>>({});

  async function loadNotes(){ const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user){window.location.replace("/login");return;} const {data,error}=await supabase.from("link_bloc_notes").select("id,note,created_at,updated_at,counter_value,timer_seconds").eq("user_id",user.id).order("created_at",{ascending:false}); if(error)setMessage(error.message); else setNotes(((data??[]) as BlocNote[]).map(n=>({...n,counter_value:Number(n.counter_value||0),timer_seconds:Number(n.timer_seconds||0)}))); setLoading(false); }
  useEffect(()=>{void loadNotes(); return()=>Object.values(saveTimers.current).forEach(clearTimeout);},[]);
  useEffect(()=>{ if(!Object.values(running).some(Boolean))return; const id=setInterval(()=>setNotes(current=>current.map(n=>running[n.id]?{...n,timer_seconds:n.timer_seconds+1}:n)),1000); return()=>clearInterval(id);},[running]);
  useEffect(()=>{ const id=setInterval(async()=>{ const active=notes.filter(n=>running[n.id]); if(!active.length)return; const supabase=createClient(); await Promise.all(active.map(n=>supabase.from("link_bloc_notes").update({timer_seconds:n.timer_seconds,updated_at:new Date().toISOString()}).eq("id",n.id))); },5000); return()=>clearInterval(id);},[notes,running]);

  async function addNote(){ setCreating(true); const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user){window.location.replace("/login");return;} const {data,error}=await supabase.from("link_bloc_notes").insert({user_id:user.id,note:"",counter_value:0,timer_seconds:0}).select("id,note,created_at,updated_at,counter_value,timer_seconds").single(); if(error)setMessage(error.message); else if(data)setNotes(c=>[data as BlocNote,...c]); setCreating(false); }
  function changeNote(id:string,value:string){ setNotes(c=>c.map(n=>n.id===id?{...n,note:value}:n)); if(saveTimers.current[id])clearTimeout(saveTimers.current[id]); saveTimers.current[id]=setTimeout(async()=>{const supabase=createClient(); const {error}=await supabase.from("link_bloc_notes").update({note:value,updated_at:new Date().toISOString()}).eq("id",id); setMessage(error?error.message:"Guardado automáticamente ✓"); if(!error)window.setTimeout(()=>setMessage(""),1200);},650); }
  async function patchTool(id:string, patch:Partial<Pick<BlocNote,"counter_value"|"timer_seconds">>){ setNotes(c=>c.map(n=>n.id===id?{...n,...patch}:n)); const supabase=createClient(); const {error}=await supabase.from("link_bloc_notes").update({...patch,updated_at:new Date().toISOString()}).eq("id",id); if(error)setMessage(error.message); }
  async function deleteNote(id:string){ if(!window.confirm("¿Seguro que quieres eliminar esta nota?"))return; setRunning(r=>({...r,[id]:false})); const supabase=createClient(); const {error}=await supabase.from("link_bloc_notes").delete().eq("id",id); if(error)setMessage(error.message); else setNotes(c=>c.filter(n=>n.id!==id)); }
  async function toggleTimer(note:BlocNote){ const next=!running[note.id]; setRunning(r=>({...r,[note.id]:next})); if(!next)await patchTool(note.id,{timer_seconds:note.timer_seconds}); }

  return <AuthGuard><main className="shell"><Nav/><div className="page-heading-row"><div><h1>Bloc</h1><p className="page-kicker">Notas de trabajo · guardado automático</p></div><a className="btn secondary small" href="/">Inicio</a></div>
    <div className="bloc-toolbar"><span className="muted">{notes.length} {notes.length===1?"nota":"notas"}</span><button className="bloc-add-button" type="button" onClick={()=>void addNote()} disabled={creating}>{creating?"…":"+"}</button></div>
    {message&&<div className="bloc-autosave-status" aria-live="polite">{message}</div>}
    {loading?<div className="card muted">Cargando bloc…</div>:notes.length===0?<div className="bloc-empty"><p>No tienes notas todavía.</p><button className="btn" type="button" onClick={()=>void addNote()}>Crear primera nota</button></div>:<section className="bloc-notes-list">{notes.map((item,index)=><article className="bloc-note-card" key={item.id}>
      <div className="bloc-note-header"><strong>Nota {notes.length-index}</strong><button className="bloc-delete-button" type="button" onClick={()=>void deleteNote(item.id)}>Eliminar</button></div>
      <textarea value={item.note} onChange={e=>changeNote(item.id,e.target.value)} placeholder="Escribe tu nota…" aria-label={`Nota ${notes.length-index}`}/>
      <div className="bloc-note-tools">
        <div className="bloc-note-tool"><span>Contador</span><strong>{item.counter_value}</strong><button type="button" onClick={()=>void patchTool(item.id,{counter_value:item.counter_value+1})}>+1</button><button className="mini-reset" type="button" onClick={()=>void patchTool(item.id,{counter_value:0})}>Reiniciar</button></div>
        <div className="bloc-note-tool"><span>Cronómetro</span><strong>{timeText(item.timer_seconds)}</strong><button type="button" onClick={()=>void toggleTimer(item)}>{running[item.id]?"Pausar":"Iniciar"}</button><button className="mini-reset" type="button" onClick={()=>{setRunning(r=>({...r,[item.id]:false})); void patchTool(item.id,{timer_seconds:0});}}>Reiniciar</button></div>
      </div>
    </article>)}</section>}
  </main></AuthGuard>;
}
