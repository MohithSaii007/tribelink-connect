import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import {
  getAdminAnalytics,
  listAdminApplications,
  listAdminStudents,
  listAuditLogs,
  listBeneficiaryGaps,
  listReviewQueue,
} from "@/lib/tribalink.functions";

/**
 * Server functions require a live Supabase bearer token. When a tab has been
 * open for a while the cached token can be stale, which surfaces to the user as
 * a generic "could not be loaded" error. Refresh the session once and retry
 * before giving up; if there is genuinely no session, send them to sign in.
 */
async function callWithAuthRetry<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    const { data } = await supabase.auth.refreshSession();
    if (!data.session) {
      const { data: existing } = await supabase.auth.getSession();
      if (!existing.session) {
        if (typeof window !== "undefined") {
          window.location.href = `/auth?next=${encodeURIComponent(window.location.pathname)}`;
        }
        throw error;
      }
    }
    return await run();
  }
}

export function useAnalytics() {
  const fn = useServerFn(getAdminAnalytics);
  return useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => callWithAuthRetry(() => fn({})),
    staleTime: 300_000,
    retry: 1,
  });
}

export function useAdminStudents() {
  const fn = useServerFn(listAdminStudents);
  return useQuery({
    queryKey: ["admin-students"],
    queryFn: () => callWithAuthRetry(() => fn({})),
    staleTime: 300_000,
    retry: 1,
  });
}

export function useAdminApplications() {
  const fn = useServerFn(listAdminApplications);
  return useQuery({
    queryKey: ["admin-applications"],
    queryFn: () => callWithAuthRetry(() => fn({})),
    staleTime: 300_000,
    retry: 1,
  });
}

export function useReviewQueue() {
  const fn = useServerFn(listReviewQueue);
  return useQuery({
    queryKey: ["admin-review"],
    queryFn: () => callWithAuthRetry(() => fn({})),
    staleTime: 300_000,
    retry: 1,
  });
}

export function useGaps() {
  const fn = useServerFn(listBeneficiaryGaps);
  return useQuery({
    queryKey: ["admin-gaps"],
    queryFn: () => callWithAuthRetry(() => fn({})),
    staleTime: 300_000,
    retry: 1,
  });
}

export function useAuditLogs() {
  const fn = useServerFn(listAuditLogs);
  return useQuery({
    queryKey: ["admin-audit"],
    queryFn: () => callWithAuthRetry(() => fn({})),
    staleTime: 300_000,
    retry: 1,
  });
}

export function useRefreshAdmin() {
  const qc = useQueryClient();
  return () => {
    for (const key of ["admin-analytics", "admin-students", "admin-applications", "admin-review", "admin-gaps", "admin-audit"]) {
      void qc.invalidateQueries({ queryKey: [key] });
    }
  };
}
