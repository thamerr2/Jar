import { useState, useCallback } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Wrench, Filter, LayoutList, LayoutGrid, X, ChevronUp, ChevronDown, Droplets, Zap, Wind, Hammer, Paintbrush, Sparkles, MoreHorizontal } from "lucide-react";

const MINT = "#88D9B0";
const NAVY = "#0D1B1E";
const GOLD = "#F59E0B";

const CATEGORY_CONFIG: Record<string, { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; color: string; bg: string }> = {
  plumbing:    { icon: Droplets,       color: "#1E6B8A", bg: "rgba(30,107,138,0.10)"   },
  electrical:  { icon: Zap,           color: GOLD,      bg: "rgba(245,158,11,0.10)"   },
  hvac:        { icon: Wind,          color: "#2A9D8F", bg: "rgba(42,157,143,0.10)"   },
  carpentry:   { icon: Hammer,        color: "#92400E", bg: "rgba(146,64,14,0.10)"    },
  painting:    { icon: Paintbrush,    color: "#7C3AED", bg: "rgba(124,58,237,0.10)"   },
  cleaning:    { icon: Sparkles,      color: "#0D9488", bg: "rgba(13,148,136,0.10)"   },
  general:     { icon: Wrench,        color: "#6B7280", bg: "rgba(107,114,128,0.10)"  },
  other:       { icon: MoreHorizontal,color: "#9CA3AF", bg: "rgba(156,163,175,0.10)"  },
};
import { toast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";

const categories = ["plumbing", "electrical", "hvac", "carpentry", "painting", "cleaning", "general", "other"];
const priorities = ["low", "medium", "high", "urgent"];
const statuses = ["submitted", "assigned", "in_progress", "completed", "closed"];

function priorityVariant(p: string) {
  return ({ low: "success", medium: "warning", high: "orange", urgent: "red" } as any)[p] ?? "secondary";
}
function statusVariant(s: string) {
  return ({ submitted: "info", assigned: "purple", in_progress: "warning", completed: "success", closed: "gray" } as any)[s] ?? "secondary";
}
function priorityColor(p: string) {
  return ({ low: "bg-green-100 text-green-800", medium: "bg-yellow-100 text-yellow-800", high: "bg-orange-100 text-orange-800", urgent: "bg-red-100 text-red-800 animate-pulse-slow" } as any)[p] ?? "";
}

function KanbanCard({ request, t }: { request: any; t: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: request.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, opacity: isDragging ? 0.5 : 1 } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Link href={`/maintenance/${request.id}`}>
        <a>
          <Card className={cn("cursor-grab active:cursor-grabbing hover-card transition-all", isDragging && "shadow-xl")}>
            <CardContent className="p-3 space-y-2">
              <p className="text-sm font-medium line-clamp-2">{request.title}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor(request.priority)}`}>
                  {t(`maintenance.priorities.${request.priority}`)}
                </span>
                <span className="text-xs text-muted-foreground">{t(`maintenance.categories.${request.category}`)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</p>
            </CardContent>
          </Card>
        </a>
      </Link>
    </div>
  );
}

function KanbanColumn({ status, requests, t }: { status: string; requests: any[]; t: any }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const columnColors: Record<string, string> = {
    submitted: "border-blue-300 bg-blue-50/50 dark:bg-blue-900/10",
    assigned: "border-purple-300 bg-purple-50/50 dark:bg-purple-900/10",
    in_progress: "border-yellow-300 bg-yellow-50/50 dark:bg-yellow-900/10",
    completed: "border-green-300 bg-green-50/50 dark:bg-green-900/10",
    closed: "border-gray-300 bg-gray-50/50 dark:bg-gray-800/20"
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 min-h-[200px] p-3 rounded-xl border-2 transition-colors flex-1 min-w-[220px]",
        columnColors[status],
        isOver && "ring-2 ring-primary ring-offset-1"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold">{t(`maintenance.statuses.${status}`)}</h3>
        <Badge variant="outline" className="text-xs">{requests.length}</Badge>
      </div>
      {requests.map(r => <KanbanCard key={r.id} request={r} t={t} />)}
      {requests.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-current/20 rounded-lg min-h-[80px]">
          {t("maintenance.dropHere")}
        </div>
      )}
    </div>
  );
}

export default function Maintenance() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"table" | "kanban">("table");

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const activeFilterCount = selectedStatuses.length + selectedCategories.length + selectedPriorities.length;

  const { data: requests = [], isLoading } = useQuery<any[]>({
    queryKey: ["maintenance-requests"],
    queryFn: () => apiRequest("GET", "/api/maintenance-requests")
  });

  const { data: units = [] } = useQuery<any[]>({
    queryKey: ["units-all"],
    queryFn: () => apiRequest("GET", "/api/units")
  });

  const { register, handleSubmit, setValue, reset, formState: { isSubmitting } } = useForm<any>();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/maintenance-requests", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance-requests"] });
      qc.invalidateQueries({ queryKey: ["maintenance-stats"] });
      setOpen(false);
      reset();
      toast({ title: t("common.success") });
    },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" })
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/maintenance-requests/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance-requests"] }),
    onError: (err: any) => toast({ title: err.message, variant: "destructive" })
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const newStatus = statuses.find(s => s === over.id);
    if (newStatus) {
      updateStatus.mutate({ id: String(active.id), status: newStatus });
    }
  }, [updateStatus]);

  const canCreate = user && ["tenant", "owner", "super_admin", "union_admin"].includes(user.role);

  const toggleFilter = (arr: string[], set: (v: string[]) => void, val: string) => {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };

  const clearFilters = () => { setSelectedStatuses([]); setSelectedCategories([]); setSelectedPriorities([]); setSearchTerm(""); };

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  // Filter and sort
  let filtered = requests.filter(r => {
    if (selectedStatuses.length && !selectedStatuses.includes(r.status)) return false;
    if (selectedCategories.length && !selectedCategories.includes(r.category)) return false;
    if (selectedPriorities.length && !selectedPriorities.includes(r.priority)) return false;
    if (searchTerm && !r.title?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (sortCol) {
    filtered = [...filtered].sort((a, b) => {
      const va = a[sortCol] ?? ""; const vb = b[sortCol] ?? "";
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  const byStatus = (s: string) => filtered.filter(r => r.status === s);

  function SortIcon({ col }: { col: string }) {
    if (sortCol !== col) return <span className="opacity-30 ml-1">↕</span>;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 ml-1 inline" /> : <ChevronDown className="w-3 h-3 ml-1 inline" />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold tracking-tight">{t("maintenance.title")}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t("common.search") + "..."}
            className="w-44 h-9"
          />

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-2", view === "table" && "bg-background shadow")}
              onClick={() => setView("table")}
              aria-label="Table view"
            >
              <LayoutList className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 px-2", view === "kanban" && "bg-background shadow")}
              onClick={() => setView("kanban")}
              aria-label="Kanban view"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>

          {/* Filter button */}
          <Button
            variant="outline"
            size="sm"
            className="relative h-9"
            onClick={() => setFilterOpen(p => !p)}
          >
            <Filter className="w-4 h-4 mr-1.5" />
            {t("common.filter")}
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {canCreate && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-white border-0 h-9">
                  <Plus className="w-4 h-4 mr-1.5" />{t("maintenance.newRequest")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{t("maintenance.newRequest")}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit(data => createMutation.mutate(data))} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>{t("maintenance.requestTitle")}</Label>
                    <Input className="h-10" {...register("title", { required: true })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("maintenance.description")}</Label>
                    <Textarea {...register("description", { required: true })} rows={3} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("maintenance.unit")}</Label>
                    <Select onValueChange={v => setValue("unitId", v)}>
                      <SelectTrigger><SelectValue placeholder={t("maintenance.unit")} /></SelectTrigger>
                      <SelectContent>
                        {units.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.unitNumber}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>{t("maintenance.category")}</Label>
                      <Select onValueChange={v => setValue("category", v)}>
                        <SelectTrigger><SelectValue placeholder={t("maintenance.category")} /></SelectTrigger>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c} value={c}>{t(`maintenance.categories.${c}`)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("maintenance.priority")}</Label>
                      <Select defaultValue="medium" onValueChange={v => setValue("priority", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {priorities.map(p => <SelectItem key={p} value={p}>{t(`maintenance.priorities.${p}`)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                    <Button type="submit" className="gradient-primary text-white border-0" disabled={isSubmitting}>{t("common.submit")}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {filterOpen && (
        <Card className="animate-fade-in">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">{t("maintenance.filters")}</h3>
              <div className="flex gap-2">
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                    <X className="w-3 h-3 mr-1" />{t("maintenance.clearFilters")}
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setFilterOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">{t("maintenance.statusFilter")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {statuses.map(s => (
                    <button
                      key={s}
                      onClick={() => toggleFilter(selectedStatuses, setSelectedStatuses, s)}
                      className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors", selectedStatuses.includes(s) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary")}
                    >
                      {t(`maintenance.statuses.${s}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">{t("maintenance.priorityFilter")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {priorities.map(p => (
                    <button
                      key={p}
                      onClick={() => toggleFilter(selectedPriorities, setSelectedPriorities, p)}
                      className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors", selectedPriorities.includes(p) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary")}
                    >
                      {t(`maintenance.priorities.${p}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase">{t("maintenance.categoryFilter")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(c => (
                    <button
                      key={c}
                      onClick={() => toggleFilter(selectedCategories, setSelectedCategories, c)}
                      className={cn("text-xs px-2.5 py-1 rounded-full border transition-colors", selectedCategories.includes(c) ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary")}
                    >
                      {t(`maintenance.categories.${c}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-20 text-muted-foreground animate-fade-in">
          <svg className="w-24 h-24 mx-auto mb-6 opacity-30" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="4" />
            <path d="M35 50l10 10 20-20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-lg font-medium mb-2">{t("maintenance.noRequests")}</p>
          <p className="text-sm">{activeFilterCount > 0 ? t("maintenance.tryClearFilters") : t("maintenance.createFirst")}</p>
        </div>
      )}

      {/* Kanban View */}
      {view === "kanban" && filtered.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {statuses.map(s => (
              <KanbanColumn key={s} status={s} requests={byStatus(s)} t={t} />
            ))}
          </div>
        </DndContext>
      )}

      {/* Table View */}
      {view === "table" && filtered.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <Table className="table-alt">
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("title")}>
                    {t("maintenance.requestTitle")}<SortIcon col="title" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("category")}>
                    {t("maintenance.category")}<SortIcon col="category" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("priority")}>
                    {t("maintenance.priority")}<SortIcon col="priority" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("status")}>
                    {t("maintenance.status")}<SortIcon col="status" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("createdAt")}>
                    {t("payment.date")}<SortIcon col="createdAt" />
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r: any) => {
                  const catCfg = CATEGORY_CONFIG[r.category] ?? CATEGORY_CONFIG.other;
                  const CatIcon = catCfg.icon;
                  const isUrgent = r.priority === "urgent";
                  return (
                    <TableRow key={r.id} className="transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium max-w-xs truncate">{r.title}</span>
                          {isUrgent && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold shrink-0"
                              style={{ background: `${GOLD}18`, color: GOLD }}>
                              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GOLD }} />
                              Live
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                            style={{ background: catCfg.bg }}>
                            <CatIcon className="w-3.5 h-3.5" style={{ color: catCfg.color }} />
                          </span>
                          <span className="text-sm">{t(`maintenance.categories.${r.category}`)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{
                          background: ({ low: "rgba(136,217,176,0.12)", medium: "rgba(245,158,11,0.12)", high: "rgba(239,68,68,0.12)", urgent: "rgba(239,68,68,0.18)" } as any)[r.priority] ?? "rgba(107,114,128,0.1)",
                          color:      ({ low: "#0D9488",                medium: "#92400E",                high: "#B91C1C",              urgent: "#991B1B"              } as any)[r.priority] ?? "#374151",
                          border: `1px solid ${({ low: "rgba(136,217,176,0.3)", medium: "rgba(245,158,11,0.3)", high: "rgba(239,68,68,0.3)", urgent: "rgba(239,68,68,0.4)" } as any)[r.priority] ?? "rgba(107,114,128,0.2)"}`,
                        }}>
                          {t(`maintenance.priorities.${r.priority}`)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{
                          background: ({ submitted: "rgba(30,107,138,0.1)", assigned: "rgba(124,58,237,0.1)", in_progress: "rgba(245,158,11,0.1)", completed: "rgba(136,217,176,0.12)", closed: "rgba(107,114,128,0.08)" } as any)[r.status] ?? "rgba(107,114,128,0.08)",
                          color:      ({ submitted: "#1E6B8A",              assigned: "#7C3AED",             in_progress: "#92400E",               completed: "#0D7055",               closed: "#6B7280"                  } as any)[r.status] ?? "#6B7280",
                          border: "1px solid transparent",
                        }}>
                          {t(`maintenance.statuses.${r.status}`)}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(r.createdAt)}</TableCell>
                      <TableCell>
                        <Link href={`/maintenance/${r.id}`}>
                          <a>
                            <button className="px-3 py-1.5 rounded-xl text-xs font-semibold btn-lift"
                              style={{ background: `${MINT}18`, color: NAVY }}>
                              {t("common.view")}
                            </button>
                          </a>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
