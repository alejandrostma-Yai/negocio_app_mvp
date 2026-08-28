"use client";

import { useEffect, useRef, useState } from "react";
import Nav from "@/components/Nav";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/client";

type BlocNote = { id:string; note:string; created_at:string; updated_at:string };

export default function LinkBlocPage() {
  const [notes,setNotes]=useState<BlocNote[]>([]);
  const [loading,setLoading]=useState(true);
  const [creating,setCreating]=useState(false);
  const [message,setMessage]=useState("");
  const [counter,setCounter]=useState(0);
  const [seconds,setSeconds]=useState(0);
  const [running,setRunning]=useState(false);
  const timers=useRef<Record<string,ReturnType<typeof setTimeout>>>({});

  async function loadNotes(){
    const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser();
    if(!user){window.location.replace("/login");return;}
    const {data,error}=await supabase.from("link_bloc_notes").select("id,note,created_at,updated_at").eq("user_id",user.id).order("created_at",{ascending:false});
    if(error)setMessage(error.message); else setNotes((data??[]) as BlocNote[]); setLoading(false);
  }
  useEffect(()=>{void loadNotes(); try{setCounter(Number(localStorage.getItem("og-bloc-counter")||0));}catch{}},[]);
  useEffect(()=>{ if(!running)return; const id=setInterval(()=>setSeconds(v=>v+1),1000); return()=>clearInterval(id);},[running]);

  async function addNote(){
    setCreating(true); setMessage(""); const supabase=createClient(); const {data:{user}}=await supabase.auth.getUser();
    if(!user){window.location.replace("/login");return;}
    const {data,error}=await supabase.from("link_bloc_notes").insert({user_id:user.id,note:""}).select("id,note,created_at,updated_at").single();
    if(error)setMessage(error.message); else if(data)setNotes(c=>[data as BlocNote,...c]); setCreating(false);
  }
  function changeNote(id:string,value:string){
    setNotes(c=>c.map(n=>n.id===id?{...n,note:value}:n));
    if(timers.current[id])clearTimeout(timers.current[id]);
    timers.current[id]=setTimeout(async()=>{
      const supabase=createClient(); const {error}=await supabase.from("link_bloc_notes").update({note:value,updated_at:new Date().toISOString()}).eq("id",id);
      setMessage(error?error.message:"Guardado automáticamente ✓");
    },650);
  }
  async function deleteNote(id:string){
    if(!window.confirm("¿Seguro que quieres eliminar esta nota?"))return;
    const supabase=createClient(); const {error}=await supabase.from("link_bloc_notes").delete().eq("id",id);
    if(error)setMessage(error.message); else setNotes(c=>c.filter(n=>n.id!==id));
  }
  function addCounter(){ const n=counter+1; setCounter(n); try{localStorage.setItem("og-bloc-counter",String(n));}catch{} }
  function resetCounter(){ setCounter(0); try{localStorage.setItem("og-bloc-counter","0");}catch{} }
  const mm=String(Math.floor(seconds/60)).padStart(2,"0"), ss=String(seconds%60).padStart(2,"0");

  return <AuthGuard><main className="shell"><Nav/>
    <div className="page-heading-row"><div><h1>Bloc</h1><p className="page-kicker">Notas de trabajo · guardado automático</p></div><a className="btn secondary small" href="/">Inicio</a></div>
    <div className="bloc-toolbar"><span className="muted">{notes.length} {notes.length===1?"nota":"notas"}</span><button className="bloc-add-button" type="button" onClick={()=>void addNote()} disabled={creating}>{creating?"…":"+"}</button></div>
    <section className="bloc-tools">
      <div className="bloc-tool"><span>Contador</span><strong>{counter}</strong><button type="button" onClick={addCounter}>+1</button><button className="tool-reset" type="button" onClick={resetCounter}>Reiniciar</button></div>
      <div className="bloc-tool"><span>Cronómetro</span><strong>{mm}:{ss}</strong><button type="button" onClick={()=>setRunning(v=>!v)}>{running?"Pausar":"Iniciar"}</button><button className="tool-reset" type="button" onClick={()=>{setRunning(false);setSeconds(0);}}>Reiniciar</button></div>
    </section>
    {message&&<div className="bloc-autosave-status" aria-live="polite">{message}</div>}
    {loading?<div className="card muted">Cargando bloc…</div>:notes.length===0?<div className="bloc-empty"><p>No tienes notas todavía.</p><button className="btn" type="button" onClick={()=>void addNote()}>Crear primera nota</button></div>:<section className="bloc-notes-list">{notes.map((item,index)=><article className="bloc-note-card" key={item.id}><div className="bloc-note-header"><strong>Nota {notes.length-index}</strong><button className="bloc-delete-button" type="button" onClick={()=>void deleteNote(item.id)}>Eliminar</button></div><textarea value={item.note} onChange={e=>changeNote(item.id,e.target.value)} placeholder="Escribe tu nota…" aria-label={`Nota ${notes.length-index}`}/></article>)}</section>}
  </main></AuthGuard>;
}
