import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground"
      }
    },
    defaultVariants: { variant: "default" }
  }
);

interface ToastProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof toastVariants> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(({ className, variant, ...props }, ref) => (
  <div ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
));
Toast.displayName = "Toast";

const ToastTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
);
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
);
ToastDescription.displayName = "ToastDescription";

export type { ToastProps };
export { Toast, ToastTitle, ToastDescription };
