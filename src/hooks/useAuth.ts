"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";

const supabase = createSupabaseBrowser();

const AUTH_INIT_TIMEOUT_MS = 2500;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let settled = false;

    const finish = (nextUser: User | null) => {
      if (settled) return;
      settled = true;
      setUser(nextUser);
      setLoading(false);
    };

    const timeout = setTimeout(() => finish(null), AUTH_INIT_TIMEOUT_MS);

    supabase.auth
      .getUser()
      .then(({ data: { user: nextUser } }) => {
        clearTimeout(timeout);
        finish(nextUser);
      })
      .catch(() => {
        clearTimeout(timeout);
        finish(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      clearTimeout(timeout);
      if (!settled) {
        finish(session?.user ?? null);
      } else {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/login";
  };

  return { user, loading, signOut };
}
