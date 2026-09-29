"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { demoFetch } from "@/lib/api/demo-fetch";

export function useDealDeskCases() {
  return useQuery({
    queryKey: ["deal-desk-cases"],
    queryFn: () => demoFetch<Array<Record<string, unknown>>>("/api/deal-desk/cases")
  });
}

export function useResolveDealDeskCase(quoteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      demoFetch<Record<string, unknown>>(`/api/quotes/${quoteId}/deal-desk`, {
        method: "POST",
        json: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["deal-desk-cases"] });
      await queryClient.invalidateQueries({ queryKey: ["quotes"] });
    }
  });
}
