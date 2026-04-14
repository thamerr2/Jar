import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, Plus, MapPin, Home, Eye, Hammer, TrendingUp } from "lucide-react";

const MINT = "#88D9B0";
const NAVY = "#0D1B1E";
const GOLD = "#F59E0B";
import { toast } from "@/hooks/use-toast";
import { cn, cityToGradient } from "@/lib/utils";

interface Property {
  id: string;
  title: string;
  description?: string;
  address: string;
  city: string;
  totalUnits: number;
  image?: string;
  createdAt: string;
}

export default function Properties() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ["properties"],
    queryFn: () => apiRequest("GET", "/api/properties")
  });

  const { data: units = [] } = useQuery<any[]>({
    queryKey: ["units-all"],
    queryFn: () => apiRequest("GET", "/api/units")
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{
    title: string; description: string; address: string; city: string; totalUnits: number;
  }>();

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/properties", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["properties"] });
      setOpen(false);
      reset();
      toast({ title: t("common.success") });
    },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" })
  });

  const canCreate = user && ["owner", "super_admin", "union_admin"].includes(user.role);

  // Calculate stats per property
  const getPropertyStats = (propertyId: string) => {
    const propertyUnits = units.filter((u: any) => u.propertyId === propertyId);
    const occupied = propertyUnits.filter((u: any) => u.isOccupied).length;
    const revenue = propertyUnits
      .filter((u: any) => u.isOccupied && u.rentAmount)
      .reduce((s: number, u: any) => s + Number(u.rentAmount), 0);
    return { total: propertyUnits.length, occupied, revenue };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64 rounded-3xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t("property.title")}</h1>
        {canCreate && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold btn-lift text-white"
                style={{ background: NAVY }}>
                <Plus className="w-4 h-4" />{t("property.addProperty")}
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>{t("property.addProperty")}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit(data => createMutation.mutate({ ...data, totalUnits: Number(data.totalUnits) }))} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t("property.name")}</Label>
                  <Input className="h-10" {...register("title", { required: true })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("property.description")}</Label>
                  <Textarea rows={2} {...register("description")} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("property.address")}</Label>
                  <Input className="h-10" {...register("address", { required: true })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("property.city")}</Label>
                  <Input className="h-10" {...register("city", { required: true })} />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("property.totalUnits")}</Label>
                  <Input type="number" min="0" className="h-10" {...register("totalUnits", { required: true })} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
                  <Button type="submit" className="gradient-primary text-white border-0" disabled={isSubmitting}>{t("common.create")}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground animate-fade-in">
          <svg className="w-28 h-28 mx-auto mb-6 opacity-25" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="10" y="40" width="80" height="50" rx="4" stroke="currentColor" strokeWidth="4" />
            <path d="M30 40V30C30 25 35 20 50 20C65 20 70 25 70 30V40" stroke="currentColor" strokeWidth="4" />
            <rect x="40" y="60" width="20" height="30" rx="2" stroke="currentColor" strokeWidth="3" />
          </svg>
          <p className="text-xl font-medium mb-2">{t("property.noProperties")}</p>
          {canCreate && (
            <p className="text-sm mt-2 mb-6">{t("property.addFirst")}</p>
          )}
          {canCreate && (
            <Button className="gradient-primary text-white border-0" onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />{t("property.addProperty")}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {properties.map((prop, idx) => {
            const stats = getPropertyStats(prop.id);
            const occupancyPct = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0;
            const gradient = cityToGradient(prop.city);
            const badgeColor = occupancyPct >= 80 ? MINT : occupancyPct >= 50 ? GOLD : "#EF4444";
            const barColor   = occupancyPct >= 80 ? MINT : occupancyPct >= 50 ? GOLD : "#EF4444";

            return (
              <div key={prop.id} className="bento-card group spring-in" style={{ animationDelay: `${idx * 70}ms` }}>
                {/* Cover + hover overlay */}
                <div className={cn("h-40 bg-gradient-to-br relative overflow-hidden rounded-t-3xl", gradient)}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Landmark className="w-14 h-14 text-white/20" />
                  </div>
                  {/* Occupancy badge */}
                  <div className="absolute top-3 end-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ background: `${badgeColor}22`, border: `1px solid ${badgeColor}55`, color: badgeColor === MINT ? NAVY : "white" }}>
                      {occupancyPct}% {t("unit.occupied")}
                    </span>
                  </div>
                  {/* Hover quick-action overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-3"
                    style={{ background: "rgba(13,27,30,0.75)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
                    <Link href={`/properties/${prop.id}`}>
                      <a>
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold btn-lift"
                          style={{ background: MINT, color: NAVY }}>
                          <Eye className="w-3.5 h-3.5" />{t("property.view")}
                        </button>
                      </a>
                    </Link>
                    <Link href={`/maintenance?propertyId=${prop.id}`}>
                      <a>
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold btn-lift text-white"
                          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.35)" }}>
                          <Hammer className="w-3.5 h-3.5" />{t("property.viewMaintenance")}
                        </button>
                      </a>
                    </Link>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-base mb-1 truncate" style={{ color: NAVY }}>{prop.title}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{prop.city} — {prop.address}</span>
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { label: t("property.units"),    value: stats.total || prop.totalUnits, color: NAVY },
                      { label: t("property.occupied"),  value: stats.occupied,                 color: MINT },
                      { label: t("property.revenue"),   value: stats.revenue > 0 ? `${Math.round(stats.revenue / 1000)}K` : "—", color: "#1E6B8A" },
                    ].map(s => (
                      <div key={s.label} className="text-center p-2.5 rounded-2xl" style={{ background: "rgba(13,27,30,0.04)" }}>
                        <p className="text-xs text-muted-foreground mb-0.5">{s.label}</p>
                        <p className="font-bold text-sm" style={{ color: s.color }}>{s.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Occupancy bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{stats.occupied}/{stats.total || prop.totalUnits} {t("unit.occupied")}</span>
                      <span className="font-bold" style={{ color: barColor }}>{occupancyPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(13,27,30,0.08)" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${occupancyPct}%`, background: barColor }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
