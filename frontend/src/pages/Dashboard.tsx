import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCountUp } from "@/hooks/use-count-up";
import { Link } from "wouter";
import {
  Landmark, Users, Hammer, Wallet, TrendingUp, TrendingDown,
  Plus, X, Briefcase, Zap, Home, Activity
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// ─── Brand ────────────────────────────────────────────────────────────────────
const MINT   = "#88D9B0";
const NAVY   = "#0D1B1E";
const GOLD   = "#F59E0B";
const TEAL   = "#2A9D8F";

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface DashboardStats {
  properties: number;
  activeLeases: number;
  pendingRequests: number;
  monthlyRevenue: number;
  monthlyData: Array<{ month: string; requests: number; completed: number; revenue: number }>;
  categoryBreakdown: Record<string, number>;
}
interface MaintenanceStats {
  total: number; open: number; submitted: number; assigned: number;
  in_progress: number; completed: number; closed: number;
}

const DONUT_COLORS = [MINT, TEAL, GOLD, "#1E6B8A", "#5CC4A0", "#E8B84B", "#88C5D9", "#A8E6C3"];

const DATE_RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color = MINT }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const W = 80, H = 32;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * (H - 4) - 2}`
  );
  const id = `spk-${color.replace("#", "")}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}
      className="absolute bottom-3 end-3 opacity-35 pointer-events-none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M ${pts.join(" L ")} L ${W},${H} L 0,${H} Z`} fill={`url(#${id})`} />
      <polyline points={pts.join(" ")} fill="none" stroke={color}
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function AnimatedStatCard({
  title, value, icon, accentColor = MINT, trend, prefix = "", sparkColor, mesh
}: {
  title: string; value: number; icon: React.ReactNode;
  accentColor?: string; trend?: number; prefix?: string; sparkColor?: string; mesh?: boolean;
}) {
  const { t } = useTranslation();
  const displayed = useCountUp(value);

  const sparkData = useMemo(() => {
    if (!value) return [];
    return Array.from({ length: 8 }, (_, i) => {
      const t = i / 7;
      return value * (0.65 + 0.35 * t + Math.sin(i * 1.4 + value % 5) * 0.07);
    });
  }, [value]);

  return (
    <div className={`bento-card relative overflow-hidden p-5 ${mesh ? "mesh-gradient" : ""}`}>
      {!mesh && <Sparkline data={sparkData} color={sparkColor ?? accentColor} />}
      <div className="flex items-start justify-between mb-3">
        <p className={`text-sm font-medium leading-snug ${mesh ? "text-white/70" : "text-muted-foreground"}`}>{title}</p>
        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: mesh ? "rgba(136,217,176,0.2)" : `${accentColor}1A` }}>
          <span style={{ color: mesh ? MINT : accentColor }}>{icon}</span>
        </span>
      </div>
      <div className="text-3xl font-bold tracking-tight" style={{ color: mesh ? "white" : NAVY }}>
        {prefix}{displayed.toLocaleString()}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-semibold ${mesh ? "text-emerald-300" : trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {trend >= 0
            ? <TrendingUp className="w-3.5 h-3.5" />
            : <TrendingDown className="w-3.5 h-3.5" />}
          {Math.abs(trend)}% {t("dashboard.vsLastMonth")}
        </div>
      )}
      {mesh && (
        <div className="absolute bottom-0 end-0 w-24 h-24 opacity-10" aria-hidden>
          <svg viewBox="0 0 96 96" fill="none">
            <circle cx="48" cy="48" r="44" stroke="#88D9B0" strokeWidth="1.5" />
            <circle cx="48" cy="48" r="30" stroke="#88D9B0" strokeWidth="1" />
            <circle cx="48" cy="48" r="16" stroke="#88D9B0" strokeWidth="0.75" />
          </svg>
        </div>
      )}
    </div>
  );
}

// ─── Timeline icon ────────────────────────────────────────────────────────────
function TimelineIcon({ type }: { type?: string }) {
  const map: Record<string, React.ReactNode> = {
    maintenance: <Hammer className="w-4 h-4" style={{ color: GOLD }} />,
    payment:     <Wallet  className="w-4 h-4" style={{ color: MINT }} />,
    property:    <Landmark className="w-4 h-4" style={{ color: "#1E6B8A" }} />,
    warning:     <Zap     className="w-4 h-4" style={{ color: GOLD }} />,
  };
  return <span>{map[type ?? ""] ?? <Activity className="w-4 h-4" style={{ color: MINT }} />}</span>;
}

// ─── FAB ──────────────────────────────────────────────────────────────────────
function FAB({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const [magnetic, setMagnetic] = useState({ x: 0, y: 0 });
  const actions: Record<string, Array<{ label: string; path: string; icon: React.ReactNode }>> = {
    owner:        [{ label: "Add Property",  path: "/properties",  icon: <Landmark className="w-4 h-4" /> }, { label: "New Request", path: "/maintenance", icon: <Hammer className="w-4 h-4" /> }],
    tenant:       [{ label: "New Request",   path: "/maintenance", icon: <Hammer className="w-4 h-4" /> }],
    contractor:   [{ label: "View Jobs",     path: "/jobs",        icon: <Briefcase className="w-4 h-4" /> }],
    super_admin:  [{ label: "Add Property",  path: "/properties",  icon: <Landmark className="w-4 h-4" /> }, { label: "New Request", path: "/maintenance", icon: <Hammer className="w-4 h-4" /> }],
    union_admin:  [{ label: "Add Property",  path: "/properties",  icon: <Landmark className="w-4 h-4" /> }, { label: "New Request", path: "/maintenance", icon: <Hammer className="w-4 h-4" /> }],
  };
  const roleActions = actions[role] ?? [];

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setMagnetic({ x: (e.clientX - cx) * 0.35, y: (e.clientY - cy) * 0.35 });
  };
  const handleMouseLeave = () => setMagnetic({ x: 0, y: 0 });

  return (
    <div className="fixed bottom-20 md:bottom-8 end-6 z-40 flex flex-col items-end gap-2">
      {open && roleActions.map((action, i) => (
        <Link key={i} href={action.path}>
          <a
            className="flex items-center gap-2.5 shadow-xl rounded-full px-4 py-2.5 text-sm font-semibold spring-in btn-lift"
            style={{
              background: "rgba(13,27,30,0.92)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: MINT,
              border: "1px solid rgba(136,217,176,0.2)",
              animationDelay: `${i * 60}ms`,
            }}
            onClick={() => setOpen(false)}
          >
            {action.icon}
            {action.label}
          </a>
        </Link>
      ))}
      <button
        onClick={() => setOpen(p => !p)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-14 h-14 rounded-full fab-brand flex items-center justify-center active:scale-95"
        style={{
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          transform: `translate(${magnetic.x}px, ${magnetic.y}px) scale(${open ? 1.05 : 1})`,
          transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        aria-label="Quick actions"
      >
        {open ? <X className="w-5 h-5" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState(30);

  const { data: dashStats, isLoading: loadingDash } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: () => apiRequest("GET", "/api/dashboard/stats"),
    enabled: !!user && ["owner", "super_admin", "union_admin"].includes(user.role),
  });

  const { data: maintStats, isLoading: loadingMaint } = useQuery<MaintenanceStats>({
    queryKey: ["maintenance-stats"],
    queryFn: () => apiRequest("GET", "/api/maintenance/stats"),
    refetchInterval: 30000,
  });

  const { data: notifications = [] } = useQuery<any[]>({
    queryKey: ["notifications"],
    queryFn: () => apiRequest("GET", "/api/notifications"),
    enabled: !!user,
  });

  if (loadingDash || loadingMaint) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-72 rounded-3xl" />
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      </div>
    );
  }

  const categoryData = dashStats?.categoryBreakdown
    ? Object.entries(dashStats.categoryBreakdown).map(([name, value]) => ({
        name: t(`maintenance.categories.${name}`), value,
      }))
    : [];

  const recentNotifications = notifications.slice(0, 10);
  const isOwnerRole = ["owner", "super_admin", "union_admin"].includes(user?.role ?? "");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: NAVY }}>{t("dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* KPI Cards — Bento grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isOwnerRole && (
          <>
            <div className="spring-in" style={{ animationDelay: "0ms" }}>
              <AnimatedStatCard title={t("dashboard.properties")} value={dashStats?.properties ?? 0}
                icon={<Landmark className="w-4.5 h-4.5" />} accentColor="#1E6B8A" trend={5} />
            </div>
            <div className="spring-in" style={{ animationDelay: "60ms" }}>
              <AnimatedStatCard title={t("dashboard.activeLeases")} value={dashStats?.activeLeases ?? 0}
                icon={<Users className="w-4.5 h-4.5" />} accentColor={MINT} trend={2} />
            </div>
          </>
        )}
        <div className="spring-in" style={{ animationDelay: "120ms" }}>
          <AnimatedStatCard title={t("dashboard.pendingRequests")} value={maintStats?.open ?? 0}
            icon={<Hammer className="w-4.5 h-4.5" />} accentColor={GOLD} trend={-8} sparkColor={GOLD} />
        </div>
        {isOwnerRole && (
          <div className="spring-in" style={{ animationDelay: "180ms" }}>
            <AnimatedStatCard title={t("dashboard.monthlyRevenue")} value={Math.round(dashStats?.monthlyRevenue ?? 0)}
              icon={<Wallet className="w-4.5 h-4.5" />} accentColor={TEAL} trend={12} sparkColor={TEAL} mesh />
          </div>
        )}
        <div className="spring-in" style={{ animationDelay: "240ms" }}>
          <AnimatedStatCard title={t("maintenance.statuses.completed")} value={maintStats?.completed ?? 0}
            icon={<TrendingUp className="w-4.5 h-4.5" />} accentColor={MINT} trend={18} />
        </div>
      </div>

      {/* Charts + Live Timeline — 3-col bento */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">

          {/* Area chart */}
          {dashStats?.monthlyData && dashStats.monthlyData.length > 0 && (
            <div className="bento-card p-5">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                <h3 className="font-semibold text-base" style={{ color: NAVY }}>{t("dashboard.monthlyTrends")}</h3>
                <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "rgba(13,27,30,0.06)" }}>
                  {DATE_RANGES.map(r => (
                    <button key={r.label} onClick={() => setDateRange(r.days)}
                      className="px-3 py-1 text-xs font-semibold rounded-lg transition-all"
                      style={dateRange === r.days
                        ? { background: NAVY, color: MINT }
                        : { color: "rgba(13,27,30,0.5)" }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={dashStats.monthlyData}>
                  <defs>
                    <linearGradient id="grad-req" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={MINT}  stopOpacity={0.35} />
                      <stop offset="95%" stopColor={MINT}  stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grad-done" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={TEAL}  stopOpacity={0.3} />
                      <stop offset="95%" stopColor={TEAL}  stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,27,30,0.06)" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "rgba(13,27,30,0.45)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "rgba(13,27,30,0.45)" }} />
                  <Tooltip contentStyle={{ borderRadius: "16px", border: "1px solid rgba(13,27,30,0.08)", boxShadow: "0 20px 50px rgba(0,0,0,0.08)" }} />
                  <Area type="monotone" dataKey="requests" stroke={MINT} strokeWidth={2} fill="url(#grad-req)" name={t("dashboard.pendingRequests")} />
                  <Area type="monotone" dataKey="completed" stroke={TEAL} strokeWidth={2} fill="url(#grad-done)" name={t("maintenance.statuses.completed")} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Donut chart */}
          {categoryData.length > 0 && (
            <div className="bento-card p-5">
              <h3 className="font-semibold text-base mb-4" style={{ color: NAVY }}>{t("dashboard.categoryBreakdown")}</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={88}>
                    {categoryData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "14px", border: "1px solid rgba(13,27,30,0.08)" }} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Live Activity Timeline */}
        <div className="bento-card flex flex-col">
          <div className="p-5 border-b" style={{ borderColor: "rgba(13,27,30,0.06)" }}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base" style={{ color: NAVY }}>{t("dashboard.recentActivity")}</h3>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: `${MINT}18`, color: TEAL }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: MINT }} />
                {t("dashboard.live")}
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 420 }}>
            {recentNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-muted-foreground">
                <Activity className="w-10 h-10 opacity-25" />
                <p className="text-sm">{t("dashboard.noRecentActivity")}</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute start-4 top-2 bottom-2 w-px"
                  style={{ background: "linear-gradient(to bottom, rgba(136,217,176,0.35), transparent)" }} />

                {recentNotifications.map((n: any, i) => {
                  const isRecent = Date.now() - new Date(n.createdAt).getTime() < 3600000;
                  return (
                    <div key={n.id} className="flex gap-3 relative mb-5 stagger-in" style={{ animationDelay: `${i * 55}ms` }}>
                      <div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "rgba(136,217,176,0.12)", border: "1px solid rgba(136,217,176,0.22)" }}>
                        <TimelineIcon type={n.type} />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm font-semibold truncate leading-snug" style={{ color: NAVY }}>{n.title}</p>
                        {n.message && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.message}</p>
                        )}
                        <p className="text-xs mt-1 font-medium" style={{ color: isRecent ? TEAL : "rgba(13,27,30,0.4)" }}>
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: MINT }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance Status Grid */}
      {maintStats && (
        <div className="bento-card p-5">
          <h3 className="font-semibold text-base mb-4" style={{ color: NAVY }}>{t("maintenance.title")}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { key: "submitted",  color: "#1E6B8A", bg: "rgba(30,107,138,0.08)"  },
              { key: "assigned",   color: "#7C3AED", bg: "rgba(124,58,237,0.08)"  },
              { key: "in_progress",color: GOLD,      bg: "rgba(245,158,11,0.10)"  },
              { key: "completed",  color: MINT,      bg: "rgba(136,217,176,0.12)" },
              { key: "closed",     color: "#6B7280", bg: "rgba(107,114,128,0.08)" },
            ].map(s => (
              <div key={s.key} className="rounded-2xl p-4 text-center" style={{ background: s.bg }}>
                <div className="text-2xl font-black" style={{ color: s.color }}>
                  {maintStats[s.key as keyof MaintenanceStats]}
                </div>
                <div className="text-xs font-semibold mt-1" style={{ color: "rgba(13,27,30,0.6)" }}>
                  {t(`maintenance.statuses.${s.key}`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAB */}
      {user && <FAB role={user.role} />}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
