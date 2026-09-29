"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { demoFetch } from "@/lib/api/demo-fetch";

export function useCatalog() {
  return useQuery({
    queryKey: ["catalog"],
    queryFn: () => demoFetch<Array<Record<string, unknown>>>("/api/catalog/products")
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      demoFetch<Record<string, unknown>>("/api/catalog/products", {
        method: "POST",
        json: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["catalog"] });
    }
  });
}
