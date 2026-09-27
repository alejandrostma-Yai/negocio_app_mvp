"use client";

import { useEffect } from "react";
import { REALTIME_EVENT } from "@/components/RealtimeSync";

export function useRealtimeRefresh(refresh: () => void | Promise<void>, tables?: string[]) {
  useEffect(() => {
    const handler = (event: Event) => {
      const table = (event as CustomEvent<{ table?: string }>).detail?.table;
      if (tables?.length && table && !tables.includes(table)) return;
      void refresh();
    };
    window.addEventListener(REALTIME_EVENT, handler);
    return () => window.removeEventListener(REALTIME_EVENT, handler);
  }, [refresh, tables]);
}
