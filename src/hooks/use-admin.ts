import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  getAdminAnalytics,
  listAdminApplications,
  listAdminStudents,
  listAuditLogs,
  listBeneficiaryGaps,
  listReviewQueue,
} from "@/lib/tribalink.functions";

export function useAnalytics() {
  const fn = useServerFn(getAdminAnalytics);
  return useQuery({ queryKey: ["admin-analytics"], queryFn: () => fn({}), staleTime: 300_000 });
}

export function useAdminStudents() {
  const fn = useServerFn(listAdminStudents);
  return useQuery({ queryKey: ["admin-students"], queryFn: () => fn({}), staleTime: 300_000 });
}

export function useAdminApplications() {
  const fn = useServerFn(listAdminApplications);
  return useQuery({ queryKey: ["admin-applications"], queryFn: () => fn({}), staleTime: 300_000 });
}

export function useReviewQueue() {
  const fn = useServerFn(listReviewQueue);
  return useQuery({ queryKey: ["admin-review"], queryFn: () => fn({}), staleTime: 300_000 });
}

export function useGaps() {
  const fn = useServerFn(listBeneficiaryGaps);
  return useQuery({ queryKey: ["admin-gaps"], queryFn: () => fn({}), staleTime: 300_000 });
}

export function useAuditLogs() {
  const fn = useServerFn(listAuditLogs);
  return useQuery({ queryKey: ["admin-audit"], queryFn: () => fn({}), staleTime: 300_000 });
}

export function useRefreshAdmin() {
  const qc = useQueryClient();
  return () => {
    for (const key of ["admin-analytics", "admin-students", "admin-applications", "admin-review", "admin-gaps", "admin-audit"]) {
      void qc.invalidateQueries({ queryKey: [key] });
    }
  };
}
