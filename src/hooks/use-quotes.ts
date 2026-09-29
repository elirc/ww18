"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { demoFetch } from "@/lib/api/demo-fetch";

export function useQuotes() {
  return useQuery({
    queryKey: ["quotes"],
    queryFn: () => demoFetch<Array<Record<string, unknown>>>("/api/quotes")
  });
}

export function useQuoteDetail(quoteId: string) {
  return useQuery({
    queryKey: ["quotes", quoteId],
    queryFn: () => demoFetch<Record<string, unknown>>(`/api/quotes/${quoteId}`),
    enabled: Boolean(quoteId)
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      demoFetch<Record<string, unknown>>("/api/quotes", {
        method: "POST",
        json: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["quotes"] });
    }
  });
}

export function useSubmitQuote(quoteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      demoFetch<Record<string, unknown>>(`/api/quotes/${quoteId}/submit`, {
        method: "POST",
        json: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["quotes"] });
      await queryClient.invalidateQueries({ queryKey: ["quotes", quoteId] });
    }
  });
}

export function useApproveQuote(quoteId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      demoFetch<Record<string, unknown>>(`/api/quotes/${quoteId}/approve`, {
        method: "POST",
        json: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["quotes"] });
      await queryClient.invalidateQueries({ queryKey: ["quotes", quoteId] });
    }
  });
}
