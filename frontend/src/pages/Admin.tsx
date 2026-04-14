import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, UserCheck, UserX, Trash2, Shield, Plus, Download,
  ChevronLeft, ChevronRight, Activity, Server, AlertTriangle,
  CheckCircle, XCircle, Clock, Database, Radio, Store, Settings2,
  Users, Wrench
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDate, formatDistanceShort, downloadCSV, cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/use-count-up";

const ROLES = ["super_admin", "owner", "tenant", "contractor", "union_admin"];
const PAGE_SIZE = 25;

const actionColors: Record<string, string> = {
  create: "text-green-600 bg-green-50 dark:bg-green-900/20",
  update: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
  delete: "text-red-600 bg-red-50 dark:bg-red-900/20",
  login: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
  activate: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
  deactivate: "text-orange-600 bg-orange-50 dark:bg-orange-900/20"
};

function getActionColor(action: string): string {
  const key = Object.keys(actionColors).find(k => action.toLowerCase().includes(k));
  return key ? actionColors[key] : "text-muted-foreground bg-muted";
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  const displayed = useCountUp(value);
  return (
    <Card className="hover-card">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">{label}</p>
          {icon}
        </div>
        <p className="text-2xl font-bold animate-count">{displayed}</p>
      </CardContent>
    </Card>
  );
}

export default function Admin() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgData, setMsgData] = useState({ titleAr: "", titleEn: "", messageAr: "", messageEn: "", type: "info", priority: 0 });
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "tenant", phone: "" });

  const { data: dispatchSetting, isLoading: loadingDispatch } = useQuery<{ mode: string }>({
    queryKey: ["dispatch-mode"],
    queryFn: () => apiRequest("GET", "/api/admin/settings/dispatch-mode")
  });

  const { data: tenantUsers = [], isLoading: loadingTenants } = useQuery<any[]>({
    queryKey: ["admin-tenants"],
    queryFn: () => apiRequest("GET", "/api/admin/users?role=tenant")
  });

  const { data: allMaintenanceRequests = [], isLoading: loadingAllMaintenance } = useQuery<any[]>({
    queryKey: ["admin-all-maintenance"],
    queryFn: () => apiRequest("GET", "/api/maintenance")
  });

  const setDispatchMode = useMutation({
    mutationFn: (mode: string) => apiRequest("PATCH", "/api/admin/settings/dispatch-mode", { mode }),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["dispatch-mode"] });
      toast({ title: i18n.language === "ar" ? "تم الحفظ" : "Saved", description: `Mode: ${data.mode}` });
    },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" })
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery<any[]>({
    queryKey: ["admin-users", search, roleFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);
      return apiRequest("GET", `/api/admin/users?${params}`);
    }
  });

  const { data: stats, refetch: refetchStats } = useQuery<any>({
    queryKey: ["admin-stats"],
    queryFn: () => apiRequest("GET", "/api/admin/stats"),
    refetchInterval: 60000
  });

  const { data: activityLogs = [] } = useQuery<any[]>({
    queryKey: ["activity-logs"],
    queryFn: () => apiRequest("GET", "/api/admin/activity-logs?limit=100")
  });

  const { data: failedLogins = [] } = useQuery<any[]>({
    queryKey: ["failed-logins"],
    queryFn: () => apiRequest("GET", "/api/admin/failed-logins")
  });

  const { data: sysMessages = [] } = useQuery<any[]>({
    queryKey: ["admin-messages"],
    queryFn: () => apiRequest("GET", "/api/admin/messages")
  });

  const { data: health } = useQuery<any>({
    queryKey: ["system-health"],
    queryFn: () => apiRequest("GET", "/api/health").catch(() => null),
    refetchInterval: 30000
  });

  const activateUser = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/users/${id}/activate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast({ title: t("common.success") }); }
  });

  const deactivateUser = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/users/${id}/deactivate`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast({ title: t("common.success") }); }
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast({ title: t("common.success") }); },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" })
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => apiRequest("PATCH", `/api/admin/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] })
  });

  const resolveLogin = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/failed-logins/${id}/resolve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["failed-logins"] })
  });

  const createMessage = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/admin/messages", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-messages"] }); setMsgOpen(false); toast({ title: t("common.success") }); }
  });

  const deleteMessage = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/messages/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-messages"] })
  });

  const createUser = useMutation({
    mutationFn: (data: typeof newUser) => apiRequest("POST", "/api/admin/users", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["admin-tenants"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      setAddUserOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "tenant", phone: "" });
      toast({ title: t("common.success") });
    },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" })
  });

  // Pagination
  const totalPages = Math.ceil(users.length / PAGE_SIZE);
  const paginatedUsers = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Group activity logs by date
  const groupedLogs = activityLogs.reduce((acc: Record<string, any[]>, log) => {
    const d = new Date(log.createdAt).toDateString();
    if (!acc[d]) acc[d] = [];
    acc[d].push(log);
    return acc;
  }, {});

  const exportActivityCSV = () => {
    downloadCSV(activityLogs.map(l => ({
      User: l.userEmail,
      Action: l.action,
      Entity: l.entityType,
      Date: formatDate(l.createdAt)
    })), "activity-logs.csv");
  };

  const msgTypeColors: Record<string, string> = {
    info: "bg-blue-50 border-blue-200",
    warning: "bg-yellow-50 border-yellow-200",
    error: "bg-red-50 border-red-200",
    success: "bg-green-50 border-green-200"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">{t("admin.title")}</h1>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label={t("dashboard.totalUsers")} value={stats.totalUsers} icon={<UserCheck className="w-4 h-4 text-blue-500" />} />
          <StatCard label={t("admin.activeUsers")} value={stats.activeUsers} icon={<Activity className="w-4 h-4 text-green-500" />} />
          <StatCard label={t("dashboard.totalProperties")} value={stats.totalProperties} icon={<Shield className="w-4 h-4 text-purple-500" />} />
          <StatCard label={t("dashboard.pendingRequests")} value={stats.openRequests} icon={<Clock className="w-4 h-4 text-orange-500" />} />
        </div>
      )}

      <Tabs defaultValue="users">
        <TabsList className="flex-wrap">
          <TabsTrigger value="users" className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {t("admin.users")}
          </TabsTrigger>
          <TabsTrigger value="tenants" className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            {t("admin.tenants")}
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" />
            {t("admin.allMaintenance")}
          </TabsTrigger>
          <TabsTrigger value="activity">{t("admin.activityLogs")}</TabsTrigger>
          <TabsTrigger value="logins">{t("admin.failedLogins")}</TabsTrigger>
          <TabsTrigger value="messages">{t("admin.systemMessages")}</TabsTrigger>
          <TabsTrigger value="health">{t("admin.systemHealth")}</TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-1.5">
            <Settings2 className="w-3.5 h-3.5" />
            {t("admin.dispatchMode")}
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="mt-4 space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder={t("common.search")} className="ps-9 h-9" />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {ROLES.map(r => <SelectItem key={r} value={r}>{t(`roles.${r}`)}</SelectItem>)}
              </SelectContent>
            </Select>

            {/* Add User */}
            <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary text-white border-0 h-9">
                  <Plus className="w-4 h-4 me-1" />
                  {i18n.language === "ar" ? "إضافة مستخدم" : "Add User"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{i18n.language === "ar" ? "إضافة مستخدم جديد" : "Add New User"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>{t("auth.name")}</Label>
                    <Input value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} placeholder={i18n.language === "ar" ? "الاسم الكامل" : "Full name"} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("auth.email")}</Label>
                    <Input type="email" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} placeholder="email@example.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("auth.password")}</Label>
                    <Input type="password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} placeholder="••••••••" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("auth.phone")}</Label>
                    <Input value={newUser.phone} onChange={e => setNewUser(u => ({ ...u, phone: e.target.value }))} placeholder="+966 5X XXX XXXX" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("auth.role")}</Label>
                    <Select value={newUser.role} onValueChange={v => setNewUser(u => ({ ...u, role: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ROLES.map(r => <SelectItem key={r} value={r}>{t(`roles.${r}`)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddUserOpen(false)}>{t("common.cancel")}</Button>
                  <Button
                    className="gradient-primary text-white border-0"
                    onClick={() => createUser.mutate(newUser)}
                    disabled={createUser.isPending || !newUser.name || !newUser.email || !newUser.password}
                  >
                    {createUser.isPending ? (i18n.language === "ar" ? "جاري الإنشاء..." : "Creating...") : t("common.create")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <Table className="table-alt">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("auth.name")}</TableHead>
                    <TableHead>{t("auth.email")}</TableHead>
                    <TableHead>{t("auth.role")}</TableHead>
                    <TableHead>{t("maintenance.status")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers
                    ? [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8" /></TableCell></TableRow>)
                    : paginatedUsers.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <Select defaultValue={u.role} onValueChange={role => changeRole.mutate({ id: u.id, role })}>
                            <SelectTrigger className="w-32 h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ROLES.map(r => <SelectItem key={r} value={r} className="text-xs">{t(`roles.${r}`)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.active ? "success" : "destructive"}>
                            {u.active ? t("admin.userActive") : t("admin.userInactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {u.active
                              ? <Button size="sm" variant="ghost" onClick={() => deactivateUser.mutate(u.id)} title={t("admin.deactivate")} aria-label={t("admin.deactivate")}><UserX className="w-3 h-3" /></Button>
                              : <Button size="sm" variant="ghost" onClick={() => activateUser.mutate(u.id)} title={t("admin.activate")} aria-label={t("admin.activate")}><UserCheck className="w-3 h-3" /></Button>
                            }
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => { if (confirm(t("admin.deleteUserConfirm"))) deleteUser.mutate(u.id); }}
                              title={t("admin.deleteUser")}
                              aria-label={t("admin.deleteUser")}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t("admin.showing", { from: (page - 1) * PAGE_SIZE + 1, to: Math.min(page * PAGE_SIZE, users.length), total: users.length })}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tenants Tab */}
        <TabsContent value="tenants" className="mt-4">
          <Card>
            <div className="overflow-x-auto">
              <Table className="table-alt">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("auth.name")}</TableHead>
                    <TableHead>{t("auth.email")}</TableHead>
                    <TableHead>{t("maintenance.status")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingTenants
                    ? [...Array(3)].map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8" /></TableCell></TableRow>)
                    : tenantUsers.length === 0
                    ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">{t("admin.noTenants")}</TableCell></TableRow>
                    : tenantUsers.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.active ? "success" : "destructive"}>
                            {u.active ? t("admin.userActive") : t("admin.userInactive")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {u.active
                              ? <Button size="sm" variant="ghost" onClick={() => deactivateUser.mutate(u.id)} title={t("admin.deactivate")}><UserX className="w-3 h-3" /></Button>
                              : <Button size="sm" variant="ghost" onClick={() => activateUser.mutate(u.id)} title={t("admin.activate")}><UserCheck className="w-3 h-3" /></Button>
                            }
                            <Button size="sm" variant="ghost" className="text-destructive"
                              onClick={() => { if (confirm(t("admin.deleteUserConfirm"))) deleteUser.mutate(u.id); }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* All Maintenance Requests Tab */}
        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <div className="overflow-x-auto">
              <Table className="table-alt">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("maintenance.requestTitle")}</TableHead>
                    <TableHead>{t("maintenance.category")}</TableHead>
                    <TableHead>{t("maintenance.priority")}</TableHead>
                    <TableHead>{t("maintenance.status")}</TableHead>
                    <TableHead>{t("payment.date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAllMaintenance
                    ? [...Array(5)].map((_, i) => <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8" /></TableCell></TableRow>)
                    : allMaintenanceRequests.length === 0
                    ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("common.noData")}</TableCell></TableRow>
                    : allMaintenanceRequests.map((mr: any) => (
                      <TableRow key={mr.id}>
                        <TableCell className="font-medium">{mr.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">
                            {t(`maintenance.categories.${mr.category}`) || mr.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={mr.priority === "urgent" ? "destructive" : mr.priority === "high" ? "warning" : "outline"} className="capitalize text-xs">
                            {t(`maintenance.priorities.${mr.priority}`) || mr.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={mr.status === "closed" ? "success" : mr.status === "in_progress" ? "warning" : "outline"} className="capitalize text-xs">
                            {t(`maintenance.statuses.${mr.status}`) || mr.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(mr.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Activity Logs (grouped timeline) */}
        <TabsContent value="activity" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportActivityCSV}>
              <Download className="w-4 h-4 me-2" />{t("admin.exportCSV")}
            </Button>
          </div>

          {Object.entries(groupedLogs).length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">{t("common.noData")}</div>
          ) : (
            Object.entries(groupedLogs).map(([date, logs]) => (
              <div key={date}>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  {date}
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="space-y-2">
                  {logs.map((log: any) => (
                    <div key={log.id} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Activity className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1 flex items-center justify-between gap-2 py-1.5 px-3 rounded-lg border bg-background">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getActionColor(log.action))}>
                            {log.action.replace(/_/g, " ")}
                          </span>
                          <span className="text-sm text-muted-foreground truncate">{log.userEmail ?? "—"}</span>
                          {log.entityType && <span className="text-xs text-muted-foreground">• {log.entityType}</span>}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{formatDistanceShort(log.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* Failed Logins */}
        <TabsContent value="logins" className="mt-4">
          <Card>
            <div className="overflow-x-auto">
              <Table className="table-alt">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("auth.email")}</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>{t("maintenance.description")}</TableHead>
                    <TableHead>{t("payment.date")}</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {failedLogins.map((fl: any) => (
                    <TableRow key={fl.id}>
                      <TableCell>{fl.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fl.ipAddress ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fl.reason}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(fl.createdAt)}</TableCell>
                      <TableCell>
                        {!fl.resolved && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => resolveLogin.mutate(fl.id)}>
                            {t("admin.resolve")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {failedLogins.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("common.noData")}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* System Messages */}
        <TabsContent value="messages" className="mt-4">
          <div className="flex justify-end mb-4">
            <Dialog open={msgOpen} onOpenChange={setMsgOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary text-white border-0">
                  <Plus className="w-4 h-4 me-1" />{t("admin.newMessage")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{t("admin.createMessage")}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>{t("admin.messageType")}</Label>
                    <Select value={msgData.type} onValueChange={v => setMsgData(d => ({ ...d, type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["info", "warning", "error", "success"].map(t => (
                          <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>{t("admin.titleAr")}</Label><Input className="h-10" value={msgData.titleAr} onChange={e => setMsgData(d => ({ ...d, titleAr: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label>{t("admin.titleEn")}</Label><Input className="h-10" value={msgData.titleEn} onChange={e => setMsgData(d => ({ ...d, titleEn: e.target.value }))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>{t("admin.messageAr")}</Label><Textarea rows={3} value={msgData.messageAr} onChange={e => setMsgData(d => ({ ...d, messageAr: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label>{t("admin.messageEn")}</Label><Textarea rows={3} value={msgData.messageEn} onChange={e => setMsgData(d => ({ ...d, messageEn: e.target.value }))} /></div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("admin.priority")}</Label>
                    <Input type="range" min="0" max="10" value={msgData.priority} onChange={e => setMsgData(d => ({ ...d, priority: Number(e.target.value) }))} />
                    <p className="text-xs text-muted-foreground">{t("admin.priorityValue", { value: msgData.priority })}</p>
                  </div>

                  {/* Live preview */}
                  {msgData.titleEn && (
                    <div className={cn("p-3 rounded-lg border text-sm", msgTypeColors[msgData.type] || "bg-muted")}>
                      <p className="font-medium">{msgData.titleEn}</p>
                      {msgData.messageEn && <p className="text-muted-foreground mt-1">{msgData.messageEn}</p>}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setMsgOpen(false)}>{t("common.cancel")}</Button>
                  <Button className="gradient-primary text-white border-0" onClick={() => createMessage.mutate(msgData)} disabled={createMessage.isPending}>{t("common.create")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="space-y-3">
            {sysMessages.map((msg: any) => (
              <Card key={msg.id} className={cn("border", msgTypeColors[msg.type] || "")}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{msg.titleEn} / {msg.titleAr}</p>
                      <p className="text-sm text-muted-foreground mt-1">{msg.messageEn}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={msg.visible ? "success" : "gray"}>{msg.visible ? t("admin.visible") : t("admin.hidden")}</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{msg.type}</Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMessage.mutate(msg.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {sysMessages.length === 0 && <p className="text-center text-muted-foreground py-8">{t("common.noData")}</p>}
          </div>
        </TabsContent>

        {/* System Health */}
        <TabsContent value="health" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Database status */}
            <Card className="hover-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  {t("admin.database")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {health ? (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600">{t("admin.dbConnected")}</span>
                    </div>
                    {health.dbResponseTime && (
                      <p className="text-xs text-muted-foreground">Response: {health.dbResponseTime}ms</p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-600">{t("admin.dbUnavailable")}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* API status */}
            <Card className="hover-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-500" />
                  {t("admin.apiServer")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">{t("admin.apiOnline")}</span>
                </div>
                {health?.uptime && (
                  <p className="text-xs text-muted-foreground">{t("admin.apiUptime", { hours: Math.floor(health.uptime / 3600) })}</p>
                )}
              </CardContent>
            </Card>

            {/* Memory */}
            <Card className="hover-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  {t("admin.memoryUsage")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {health?.memoryUsage ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      {Math.round(health.memoryUsage.heapUsed / 1024 / 1024)}MB / {Math.round(health.memoryUsage.heapTotal / 1024 / 1024)}MB
                    </p>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (health.memoryUsage.heapUsed / health.memoryUsage.heapTotal) * 100)}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("admin.memoryUnavailable")}</p>
                )}
              </CardContent>
            </Card>

            {/* Failed logins last 24h */}
            <Card className="hover-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  {t("admin.failedLoginsToday")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {failedLogins.filter((fl: any) => {
                    return Date.now() - new Date(fl.createdAt).getTime() < 86400000;
                  }).length}
                </p>
              </CardContent>
            </Card>

            {/* Stripe */}
            <Card className="hover-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCardIcon className="w-4 h-4 text-indigo-500" />
                  {t("admin.stripe")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">{t("admin.stripeConfigured")}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Dispatch Mode ─────────────────────────────────────────────────── */}
        <TabsContent value="workflow" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="w-5 h-5" />
                {t("admin.dispatchModeTitle")}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{t("admin.dispatchModeDesc")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingDispatch ? (
                <Skeleton className="h-40 rounded-xl" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Marketplace Option */}
                  <button
                    onClick={() => setDispatchMode.mutate("marketplace")}
                    disabled={setDispatchMode.isPending}
                    className={cn(
                      "relative text-left p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-md",
                      dispatchSetting?.mode === "marketplace"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    )}>
                    {dispatchSetting?.mode === "marketplace" && (
                      <span className="absolute top-3 end-3 flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                        <CheckCircle className="w-3 h-3" />
                        {t("admin.activeMode")}
                      </span>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(127,212,160,0.15)" }}>
                        <Store className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{t("admin.marketplace")}</p>
                        <p className="text-xs text-muted-foreground">{t("admin.marketplaceDesc")}</p>
                      </div>
                    </div>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {(i18n.language === "ar"
                        ? ["يرى المستفيد قائمة بالمزودين المطابقين", "يختار المستفيد مزوداً مباشرة", "مصفّاة حسب التخصص والتقييم", "تعيين فوري"]
                        : ["Beneficiary sees matching providers", "Direct provider selection", "Filtered by specialty & rating", "Instant assignment"]
                      ).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </button>

                  {/* Bidding Option */}
                  <button
                    onClick={() => setDispatchMode.mutate("bidding")}
                    disabled={setDispatchMode.isPending}
                    className={cn(
                      "relative text-left p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-md",
                      dispatchSetting?.mode === "bidding"
                        ? "border-[#0D9488] bg-[#0D9488]/5"
                        : "border-border hover:border-[#0D9488]/40"
                    )}>
                    {dispatchSetting?.mode === "bidding" && (
                      <span className="absolute top-3 end-3 flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(13,148,136,0.15)", color: "#0D9488" }}>
                        <CheckCircle className="w-3 h-3" />
                        {t("admin.activeMode")}
                      </span>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(13,148,136,0.12)" }}>
                        <Radio className="w-5 h-5" style={{ color: "#0D9488" }} />
                      </div>
                      <div>
                        <p className="font-semibold">{t("admin.bidding")}</p>
                        <p className="text-xs text-muted-foreground">{t("admin.biddingDesc")}</p>
                      </div>
                    </div>
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {(i18n.language === "ar"
                        ? ["الطلب يُذاع لجميع المزودين المطابقين", "المزودون يقدمون عروض أسعار", "المستفيد يختار أفضل عرض", "منافسة على السعر والجودة"]
                        : ["Request broadcast to all matching providers", "Providers submit price quotes", "Beneficiary picks best offer", "Price & quality competition"]
                      ).map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#0D9488" }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreditCardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}
