import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { getStudentWorkspace } from "@/lib/tribalink.functions";

export type Workspace = Awaited<ReturnType<typeof getStudentWorkspace>>;

export function useWorkspace() {
  const fn = useServerFn(getStudentWorkspace);
  return useQuery({
    queryKey: ["workspace"],
    queryFn: () => fn({}),
    staleTime: 300_000,
  });
}

export function useRefreshWorkspace() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ["workspace"] });
  };
}
