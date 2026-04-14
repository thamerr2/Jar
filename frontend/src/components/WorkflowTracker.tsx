import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  FileText, Search, UserCheck, Wrench, CheckCircle2, ClipboardCheck, LockKeyhole
} from "lucide-react";

// ── Step definitions ──────────────────────────────────────────────────────────
const STEPS = [
  {
    key:       "submitted",
    statuses:  ["submitted"],
    icon:      FileText,
    labelAr:   "تم الإرسال",
    labelEn:   "Submitted",
    descAr:    "تم استلام الطلب",
    descEn:    "Request received",
  },
  {
    key:       "matching",
    statuses:  [], // virtual — shown when status=submitted and dispatch is happening
    icon:      Search,
    labelAr:   "البحث عن مزود",
    labelEn:   "Finding Provider",
    descAr:    "يتم مطابقة مزودي الخدمة",
    descEn:    "Matching service providers",
  },
  {
    key:       "assigned",
    statuses:  ["assigned"],
    icon:      UserCheck,
    labelAr:   "تم التعيين",
    labelEn:   "Assigned",
    descAr:    "تم اختيار مزود الخدمة",
    descEn:    "Provider selected",
  },
  {
    key:       "in_progress",
    statuses:  ["in_progress"],
    icon:      Wrench,
    labelAr:   "قيد التنفيذ",
    labelEn:   "In Progress",
    descAr:    "يعمل المزود على الطلب",
    descEn:    "Provider working on it",
  },
  {
    key:       "completed",
    statuses:  ["completed"],
    icon:      CheckCircle2,
    labelAr:   "مكتمل",
    labelEn:   "Completed",
    descAr:    "أنهى المزود العمل",
    descEn:    "Work finished by provider",
  },
  {
    key:       "under_review",
    statuses:  ["under_review"],
    icon:      ClipboardCheck,
    labelAr:   "قيد المراجعة",
    labelEn:   "Under Review",
    descAr:    "في انتظار تأكيد المستفيد",
    descEn:    "Awaiting beneficiary confirmation",
  },
  {
    key:       "closed",
    statuses:  ["closed"],
    icon:      LockKeyhole,
    labelAr:   "مغلق",
    labelEn:   "Closed",
    descAr:    "تم الدفع وإغلاق الطلب",
    descEn:    "Payment released & closed",
  },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

// Map a maintenance status → active step index
function statusToStepIndex(status: string): number {
  if (status === "submitted")    return 1; // "matching" step
  if (status === "assigned")     return 2;
  if (status === "in_progress")  return 3;
  if (status === "completed")    return 4;
  if (status === "under_review") return 5;
  if (status === "closed")       return 6;
  return 0;
}

// ── Brand colors (matching Landing.tsx) ──────────────────────────────────────
const GREEN   = "#7FD4A0";
const TEAL    = "#0D9488";
const BG_DARK = "#0D1F1A";

interface WorkflowTrackerProps {
  status: string;
  /** compact=true renders a slim horizontal bar for list views */
  compact?: boolean;
  className?: string;
}

export default function WorkflowTracker({ status, compact = false, className }: WorkflowTrackerProps) {
  const { i18n } = useTranslation();
  const isAr      = i18n.language === "ar";
  const activeIdx = statusToStepIndex(status);

  if (compact) return <CompactTracker activeIdx={activeIdx} isAr={isAr} />;
  return <FullTracker activeIdx={activeIdx} isAr={isAr} className={className} />;
}

// ── Full tracker (MaintenanceDetail) ─────────────────────────────────────────
function FullTracker({ activeIdx, isAr, className }: { activeIdx: number; isAr: boolean; className?: string }) {
  return (
    <div className={cn("w-full", className)}>
      {/* Horizontal scrollable container on mobile */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-start min-w-max gap-0 relative">
          {STEPS.map((step, idx) => {
            const done    = idx < activeIdx;
            const current = idx === activeIdx;
            const future  = idx > activeIdx;
            const Icon    = step.icon;
            const isLast  = idx === STEPS.length - 1;

            return (
              <div key={step.key} className="flex items-start">
                {/* Step node */}
                <div className="flex flex-col items-center gap-2" style={{ minWidth: 88 }}>
                  {/* Icon circle */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative",
                      done    && "shadow-md",
                      current && "shadow-lg ring-4",
                    )}
                    style={{
                      background: done
                        ? GREEN
                        : current
                        ? `linear-gradient(135deg, ${GREEN}, ${TEAL})`
                        : "rgba(127,212,160,0.12)",
                      borderColor:  future ? "rgba(127,212,160,0.25)" : GREEN,
                      border:       future ? "1.5px solid rgba(127,212,160,0.25)" : "none",
                      boxShadow:    current ? `0 0 0 4px ${GREEN}28` : undefined,
                    }}>
                    <Icon
                      className="w-4 h-4"
                      style={{ color: future ? "rgba(127,212,160,0.4)" : done || current ? "#0D1F1A" : GREEN }}
                    />
                    {/* Pulse animation on current step */}
                    {current && (
                      <span
                        className="absolute inset-0 rounded-full animate-ping opacity-20"
                        style={{ background: GREEN }}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <div className="text-center" style={{ maxWidth: 88 }}>
                    <p
                      className={cn("text-xs font-semibold leading-tight", future && "opacity-40")}
                      style={{ color: current ? GREEN : done ? "var(--foreground)" : "inherit" }}>
                      {isAr ? step.labelAr : step.labelEn}
                    </p>
                    {current && (
                      <p className="text-xs mt-0.5 opacity-60 hidden sm:block"
                        style={{ color: GREEN, fontSize: 10 }}>
                        {isAr ? step.descAr : step.descEn}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div className="flex-shrink-0 mt-5 mx-1">
                    <div
                      className="h-0.5 transition-all duration-500"
                      style={{
                        width:      40,
                        background: idx < activeIdx
                          ? `linear-gradient(to right, ${GREEN}, ${GREEN})`
                          : idx === activeIdx - 1
                          ? `linear-gradient(to right, ${GREEN}, rgba(127,212,160,0.25))`
                          : "rgba(127,212,160,0.18)",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Compact tracker (list cards / dashboard) ──────────────────────────────────
function CompactTracker({ activeIdx, isAr }: { activeIdx: number; isAr: boolean }) {
  const totalSteps = STEPS.length - 1; // exclude the last "closed" visually
  const pct        = Math.min(100, Math.round((activeIdx / totalSteps) * 100));
  const currentStep = STEPS[Math.min(activeIdx, STEPS.length - 1)];

  return (
    <div className="w-full space-y-1.5">
      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(127,212,160,0.15)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width:      `${pct}%`,
            background: `linear-gradient(to right, ${GREEN}, ${TEAL})`,
          }}
        />
      </div>

      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: GREEN }}>
          {isAr ? currentStep.labelAr : currentStep.labelEn}
        </span>
        <span className="text-xs opacity-50">{pct}%</span>
      </div>
    </div>
  );
}
