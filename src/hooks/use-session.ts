import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/tribalink.functions";

export function useAuthUser() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    // The protected server functions validate the user token. For the shell we
    // only need the locally cached session, avoiding a remote /auth/v1/user
    // request every time a portal layout mounts.
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return userId;
}

export function useTribalinkSession() {
  const fn = useServerFn(getSession);
  return useQuery({
    queryKey: ["tl-session"],
    queryFn: () => fn({}),
    staleTime: 300_000,
  });
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "/";
}
