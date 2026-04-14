import { useState, useCallback } from "react";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

interface Toast extends ToastOptions {
  id: string;
}

let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toastQueue: Toast[] = [];

function notifyListeners() {
  toastListeners.forEach(l => l([...toastQueue]));
}

export function toast(options: ToastOptions) {
  const id = Math.random().toString(36).slice(2);
  const duration = options.duration ?? 5000;
  const newToast: Toast = { ...options, id };
  toastQueue = [...toastQueue, newToast];
  notifyListeners();
  setTimeout(() => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    notifyListeners();
  }, duration);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastQueue);

  const subscribe = useCallback((listener: (toasts: Toast[]) => void) => {
    toastListeners.push(listener);
    return () => { toastListeners = toastListeners.filter(l => l !== listener); };
  }, []);

  useState(() => {
    const unsub = subscribe(setToasts);
    return unsub;
  });

  const dismiss = useCallback((id: string) => {
    toastQueue = toastQueue.filter(t => t.id !== id);
    notifyListeners();
  }, []);

  return { toasts, toast, dismiss };
}
