"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.replace("/login");
        return;
      }

      setChecking(false);
    }

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        window.location.replace("/login");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <main className="shell">
        <div className="auth-loading">Verificando sesión…</div>
      </main>
    );
  }

  return <>{children}</>;
}
