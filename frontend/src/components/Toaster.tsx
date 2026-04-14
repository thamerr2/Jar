import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4 shadow-lg bg-background text-foreground animate-fade-in",
            t.variant === "destructive" && "border-destructive bg-destructive text-destructive-foreground"
          )}
        >
          <div className="flex-1">
            <p className="text-sm font-semibold">{t.title}</p>
            {t.description && <p className="text-sm opacity-80 mt-1">{t.description}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
