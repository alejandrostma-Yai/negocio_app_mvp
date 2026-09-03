"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

let sessionVerified = false;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(!sessionVerified);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.replace("/login");
        return;
      }

      // La navegación interna no vuelve a mostrar la pantalla de verificación.
      sessionVerified = true;
      if (active) setChecking(false);

      // Verificación real en segundo plano sin bloquear la interfaz.
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        sessionVerified = false;
        await supabase.auth.signOut({ scope: "local" });
        window.location.replace("/login");
      }
    }

    void checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        sessionVerified = false;
        window.location.replace("/login");
      } else {
        sessionVerified = true;
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return <main className="shell"><div className="auth-loading subtle">Verificando sesión…</div></main>;
  }

  return <>{children}</>;
}
