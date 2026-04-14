import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, TrendingDown, Download, Search, ChevronUp, ChevronDown } from "lucide-react";

const MINT = "#88D9B0";
const NAVY = "#0D1B1E";
const GOLD = "#F59E0B";
const TEAL = "#2A9D8F";

const PAYMENT_PILL: Record<string, { bg: string; text: string; border: string }> = {
  completed:  { bg: "rgba(136,217,176,0.14)", text: "#0D7055", border: "rgba(136,217,176,0.4)"  },
  pending:    { bg: "rgba(245,158,11,0.12)",  text: "#92400E", border: "rgba(245,158,11,0.35)"  },
  processing: { bg: "rgba(30,107,138,0.12)",  text: "#1E4A6B", border: "rgba(30,107,138,0.3)"   },
  failed:     { bg: "rgba(239,68,68,0.12)",   text: "#991B1B", border: "rgba(239,68,68,0.3)"    },
  refunded:   { bg: "rgba(107,114,128,0.1)",  text: "#374151", border: "rgba(107,114,128,0.25)" },
};
import { formatDate, formatCurrency, downloadCSV, cn } from "@/lib/utils";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { useCountUp } from "@/hooks/use-count-up";

function statusVariant(s: string) {
  return ({ pending: "warning", processing: "info", completed: "success", failed: "destructive", refunded: "secondary" } as any)[s] ?? "secondary";
}

function SummaryCard({ label, value, accentColor = MINT, icon, trend }: { label: string; value: number; accentColor?: string; icon: React.ReactNode; trend?: number }) {
  const { t } = useTranslation();
  const displayed = useCountUp(value);
  return (
    <div className="bento-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${accentColor}1A`, color: accentColor }}>{icon}</span>
      </div>
      <p className="text-2xl font-black animate-count" style={{ color: NAVY }}>
        {displayed.toLocaleString()} <span className="text-sm font-semibold text-muted-foreground">{t("common.sar")}</span>
      </p>
      {trend !== undefined && (
        <p className={`text-xs mt-1.5 flex items-center gap-1 font-semibold ${trend >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {Math.abs(trend)}% {t("dashboard.vsLastMonth")}
        </p>
      )}
    </div>
  );
}

export default function Payments() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortCol, setSortCol] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: payments = [], isLoading } = useQuery<any[]>({
    queryKey: ["payments"],
    queryFn: () => apiRequest("GET", "/api/payments")
  });

  const total = payments.reduce((s, p) => s + Number(p.amount), 0);
  const completed = payments.filter(p => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0);
  const pending = payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const failed = payments.filter(p => p.status === "failed").reduce((s, p) => s + Number(p.amount), 0);

  // Build daily revenue data for mini chart (last 30 days)
  const dailyData = (() => {
    const map: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = 0;
    }
    payments.filter(p => p.status === "completed").forEach(p => {
      const key = new Date(p.createdAt).toISOString().slice(0, 10);
      if (map[key] !== undefined) map[key] += Number(p.amount);
    });
    return Object.entries(map).map(([date, value]) => ({ date: date.slice(5), value }));
  })();

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  function SortIcon({ col }: { col: string }) {
    if (sortCol !== col) return <span className="opacity-30 ml-1">↕</span>;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 ml-1 inline" /> : <ChevronDown className="w-3 h-3 ml-1 inline" />;
  }

  let filtered = payments.filter(p => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (searchTerm && !p.description?.toLowerCase().includes(searchTerm.toLowerCase()) && !p.id?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (sortCol) {
    filtered = [...filtered].sort((a, b) => {
      const va = a[sortCol] ?? ""; const vb = b[sortCol] ?? "";
      if (typeof va === "number") return sortDir === "asc" ? va - vb : vb - va;
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  const exportCSV = () => {
    downloadCSV(filtered.map(p => ({
      ID: p.id,
      Description: p.description,
      Amount: p.amount,
      Currency: p.currency,
      Status: p.status,
      Date: formatDate(p.createdAt)
    })), "payments.csv");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("payment.title")}</h1>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" />{t("payment.exportCSV")}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard label={t("payment.total")}              value={Math.round(total)}     accentColor={NAVY} icon={<Wallet className="w-4 h-4" />} />
        <SummaryCard label={t("payment.statuses.completed")} value={Math.round(completed)} accentColor={MINT} icon={<TrendingUp className="w-4 h-4" />} trend={8} />
        <SummaryCard label={t("payment.statuses.pending")}   value={Math.round(pending)}   accentColor={GOLD} icon={<Wallet className="w-4 h-4" />} />
        <SummaryCard label={t("payment.statuses.failed")}    value={Math.round(failed)}    accentColor="#EF4444" icon={<TrendingDown className="w-4 h-4" />} />
      </div>

      {/* Daily revenue chart */}
      {dailyData.some(d => d.value > 0) && (
        <Card className="hover-card">
          <CardHeader><CardTitle className="text-base">{t("payment.dailyRevenue")}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="revenue-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={MINT} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={MINT} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="value" stroke={MINT} strokeWidth={2} fill="url(#revenue-grad)" name="Revenue (SAR)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={t("payment.searchPlaceholder")} className="pl-9 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {["pending", "processing", "completed", "failed", "refunded"].map(s => (
              <SelectItem key={s} value={s}>{t(`payment.statuses.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground animate-fade-in">
          <svg className="w-20 h-20 mx-auto mb-5 opacity-25" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="25" width="70" height="55" rx="6" stroke="currentColor" strokeWidth="4" />
            <path d="M15 40h70M35 25v-8M65 25v-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
            <path d="M30 58h40M30 68h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <p className="text-lg font-medium">{t("payment.noPayments")}</p>
        </div>
      ) : (
        <div className="bento-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="table-alt">
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("description")}>
                    {t("payment.description")}<SortIcon col="description" />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("amount")}>
                    {t("payment.amount")}<SortIcon col="amount" />
                  </TableHead>
                  <TableHead>{t("payment.currency")}</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("status")}>
                    {t("payment.status")}<SortIcon col="status" />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("createdAt")}>
                    {t("payment.date")}<SortIcon col="createdAt" />
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="max-w-xs truncate">{p.description ?? "—"}</TableCell>
                    <TableCell className="font-semibold">{Number(p.amount).toLocaleString("en-SA")}</TableCell>
                    <TableCell className="text-muted-foreground">{p.currency}</TableCell>
                    <TableCell>
                      {(() => {
                        const pill = PAYMENT_PILL[p.status] ?? PAYMENT_PILL.refunded;
                        return (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ background: pill.bg, color: pill.text, border: `1px solid ${pill.border}` }}>
                            {t(`payment.statuses.${p.status}`)}
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(p.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          const w = window.open("", "_blank");
                          if (!w) return;
                          w.document.write(`
                            <html><head><title>Receipt #${p.id}</title><style>
                              body{font-family:sans-serif;max-width:400px;margin:40px auto;padding:20px}
                              .header{text-align:center;margin-bottom:20px}
                              .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}
                              .total{font-weight:bold;font-size:1.2em}
                              @media print{.no-print{display:none}}
                            </style></head><body>
                            <div class="header"><h2>Jar Property Management</h2><h3>Payment Receipt</h3></div>
                            <div class="row"><span>Payment ID</span><span>${p.id}</span></div>
                            <div class="row"><span>Description</span><span>${p.description || "—"}</span></div>
                            <div class="row total"><span>Amount</span><span>${p.amount} ${p.currency}</span></div>
                            <div class="row"><span>Status</span><span>${p.status}</span></div>
                            <div class="row"><span>Date</span><span>${formatDate(p.createdAt)}</span></div>
                            <br/><button class="no-print" onclick="window.print()">Print Receipt</button>
                            </body></html>`);
                          w.document.close();
                        }}
                      >
                        {t("payment.receipt")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
