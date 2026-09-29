"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { demoFetch } from "@/lib/api/demo-fetch";

export function useOpportunities() {
  return useQuery({
    queryKey: ["opportunities"],
    queryFn: () => demoFetch<Array<Record<string, unknown>>>("/api/opportunities")
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      demoFetch<Record<string, unknown>>("/api/opportunities", {
        method: "POST",
        json: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["opportunities"] });
    }
  });
}
