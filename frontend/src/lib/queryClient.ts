import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

const API_BASE = import.meta.env.VITE_API_URL || "";

export async function apiRequest<T = unknown>(
  method: string,
  url: string,
  data?: unknown
): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: data !== undefined ? JSON.stringify(data) : undefined
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as T;
}
