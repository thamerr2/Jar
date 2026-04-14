import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];

export default function Reports() {
  const { t } = useTranslation();

  const { data: dashStats, isLoading } = useQuery<any>({
    queryKey: ["dashboard-stats"],
    queryFn: () => apiRequest("GET", "/api/dashboard/stats")
  });

  const { data: maintStats } = useQuery<any>({
    queryKey: ["maintenance-stats"],
    queryFn: () => apiRequest("GET", "/api/maintenance/stats")
  });

  const categoryData = dashStats?.categoryBreakdown
    ? Object.entries(dashStats.categoryBreakdown).map(([name, value], i) => ({
        name: t(`maintenance.categories.${name}`),
        value,
        color: COLORS[i % COLORS.length]
      }))
    : [];

  const statusData = maintStats
    ? [
        { name: t("maintenance.statuses.submitted"), value: maintStats.submitted },
        { name: t("maintenance.statuses.assigned"), value: maintStats.assigned },
        { name: t("maintenance.statuses.in_progress"), value: maintStats.in_progress },
        { name: t("maintenance.statuses.completed"), value: maintStats.completed },
        { name: t("maintenance.statuses.closed"), value: maintStats.closed }
      ].filter(d => d.value > 0)
    : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("nav.reports")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        {dashStats?.monthlyData?.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base">{t("dashboard.monthlyTrends")}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={dashStats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2} name={t("dashboard.pendingRequests")} />
                  <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} name={t("maintenance.statuses.completed")} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Category Breakdown Bar */}
        {categoryData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">{t("dashboard.categoryBreakdown")}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Status Pie */}
        {statusData.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">{t("maintenance.status")}</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
