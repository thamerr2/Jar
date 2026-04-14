import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

type WSMessage = { type: string; data?: unknown };

export function useWebSocket(userId?: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const qc = useQueryClient();
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!userId) return;

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = (import.meta as any).env?.VITE_WS_URL || `${protocol}//${window.location.hostname}:5001`;

    try {
      const ws = new WebSocket(host);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "auth", token }));
      };

      ws.onmessage = (event) => {
        try {
          const msg: WSMessage = JSON.parse(event.data);
          if (msg.type === "notification" && msg.data) {
            qc.setQueryData<unknown[]>(["notifications"], (old) => {
              if (!Array.isArray(old)) return [msg.data];
              return [msg.data, ...old];
            });
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        reconnectRef.current = setTimeout(() => connect(), 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // WebSocket not available in this environment
    }
  }, [userId, qc]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connect]);

  return wsRef;
}
