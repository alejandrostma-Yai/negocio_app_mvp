"use client";

import { useEffect, useState } from "react";

type CloseMode = "daily" | "weekly";

function santoDomingoParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santo_Domingo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short"
  }).formatToParts(date);
  const pick = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  return {
    year: Number(pick("year")),
    month: Number(pick("month")),
    day: Number(pick("day")),
    weekday: pick("weekday")
  };
}

function targetFor(mode: CloseMode, now = new Date()) {
  const p = santoDomingoParts(now);
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const currentDay = dayMap[p.weekday] ?? 0;
  const addDays = mode === "daily" ? 1 : (8 - currentDay) % 7 || 7;
  // República Dominicana usa UTC-4 todo el año. 00:00 local = 04:00 UTC.
  return new Date(Date.UTC(p.year, p.month - 1, p.day + addDays, 4, 0, 0));
}

function formatRemaining(ms: number, mode: CloseMode) {
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const clock = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return mode === "weekly" && days > 0 ? `${days}d ${clock}` : clock;
}

export default function CloseCountdown({ mode, closed }: { mode: CloseMode; closed: boolean }) {
  const [now, setNow] = useState(() => new Date());
  const target = targetFor(mode, now);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = target.getTime() - now.getTime();

  return (
    <section className="close-countdown-card" aria-live="polite" aria-label={mode === "weekly" ? "Tiempo restante para cierre semanal" : "Tiempo restante para cierre diario"}>
      <div className="close-countdown-copy">
        <span>{mode === "weekly" ? "Cierre semanal" : "Cierre del día"}</span>
        <small>{closed ? "Cierre realizado" : mode === "weekly" ? "Hasta terminar el domingo" : "Hasta las 12:00 a. m."}</small>
      </div>
      <strong className="close-countdown-time">{closed ? "✓" : formatRemaining(remaining, mode)}</strong>
    </section>
  );
}
