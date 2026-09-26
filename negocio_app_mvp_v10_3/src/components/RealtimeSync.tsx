"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export const REALTIME_EVENT = "og:realtime-change";

const TABLES = [
  "sales",
  "wallets",
  "settings",
  "transaction_history",
  "daily_closures",
  "weekly_closures",
  "second_order_phones",
  "link_bloc_notes"
] as const;

export default function RealtimeSync() {
  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const emit = (table: string) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent(REALTIME_EVENT, { detail: { table } }));
      }, 140);
    };

    async function connect() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      let next = supabase.channel(`og-live-${user.id}`);
      for (const table of TABLES) {
        next = next
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table, filter: `user_id=eq.${user.id}` },
            () => emit(table)
          )
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table, filter: `user_id=eq.${user.id}` },
            () => emit(table)
          )
          .on(
            "postgres_changes",
            { event: "DELETE", schema: "public", table },
            () => emit(table)
          );
      }
      channel = next.subscribe();
    }

    void connect();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !channel) void connect();
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      authListener.subscription.unsubscribe();
      if (channel) void supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
