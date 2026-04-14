import { useState } from "react";
import { useRoute } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ArrowLeft, Building2, X } from "lucide-react";
import { Link } from "wouter";
import { toast } from "@/hooks/use-toast";
import { formatDate, cn } from "@/lib/utils";

export default function PropertyDetails() {
  const [, params] = useRoute("/properties/:id");
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const [addLeaseOpen, setAddLeaseOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);

  const propertyId = params?.id ?? "";

  const { data: property, isLoading: loadingProp } = useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => apiRequest<any>("GET", `/api/properties/${propertyId}`),
    enabled: !!propertyId
  });

  const { data: units = [] } = useQuery({
    queryKey: ["units", propertyId],
    queryFn: () => apiRequest<any[]>("GET", `/api/units?propertyId=${propertyId}`),
    enabled: !!propertyId
  });

  const { data: leases = [] } = useQuery({
    queryKey: ["leases", propertyId],
    queryFn: () => apiRequest<any[]>("GET", "/api/leases"),
    enabled: !!propertyId
  });

  const { data: maintenanceRequests = [] } = useQuery({
    queryKey: ["maintenance-requests-property", propertyId],
    queryFn: () => apiRequest<any[]>("GET", "/api/maintenance-requests"),
    enabled: !!propertyId
  });

  const { register: regUnit, handleSubmit: handleUnit, reset: resetUnit, formState: { isSubmitting: submittingUnit } } = useForm<any>();
  const { register: regLease, handleSubmit: handleLease, reset: resetLease, formState: { isSubmitting: submittingLease } } = useForm<any>();

  const createUnit = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/units", {
      ...data, propertyId,
      floor: data.floor ? Number(data.floor) : null,
      bedrooms: data.bedrooms ? Number(data.bedrooms) : null,
      bathrooms: data.bathrooms ? Number(data.bathrooms) : null,
      rentAmount: data.rentAmount ? Number(data.rentAmount) : null,
      size: data.size ? Number(data.size) : null
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["units", propertyId] }); setAddUnitOpen(false); resetUnit(); toast({ title: t("common.success") }); },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" })
  });

  const createLease = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/leases", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leases", propertyId] }); setAddLeaseOpen(false); resetLease(); toast({ title: t("common.success") }); },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" })
  });

  if (loadingProp) return <Skeleton className="h-96 rounded-xl" />;

  // Unit grid color
  const getUnitColor = (unit: any) => {
    const hasMaintenance = maintenanceRequests.some((r: any) =>
      r.unitId === unit.id && ["submitted", "assigned", "in_progress"].includes(r.status)
    );
    if (hasMaintenance) return "bg-yellow-400 hover:bg-yellow-500 border-yellow-600";
    if (unit.isOccupied) return "bg-red-400 hover:bg-red-500 border-red-600";
    return "bg-green-400 hover:bg-green-500 border-green-600";
  };

  const selectedUnitLease = selectedUnit
    ? leases.find((l: any) => l.unitId === selectedUnit.id && l.active)
    : null;

  const selectedUnitMaintenance = selectedUnit
    ? maintenanceRequests.filter((r: any) => r.unitId === selectedUnit.id)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/properties">
          <a><Button variant="ghost" size="icon" aria-label="Back"><ArrowLeft className="w-4 h-4 rtl-flip" /></Button></a>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{property?.title}</h1>
          <p className="text-muted-foreground text-sm">{property?.city} — {property?.address}</p>
        </div>
      </div>

      <Tabs defaultValue="units">
        <TabsList>
          <TabsTrigger value="units">{t("property.units")} ({units.length})</TabsTrigger>
          <TabsTrigger value="leases">{t("lease.leases")} ({leases.length})</TabsTrigger>
        </TabsList>

        {/* Units Tab */}
        <TabsContent value="units" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-400 border border-green-600" />{t("unit.vacant")}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-400 border border-red-600" />{t("unit.occupied")}</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-400 border border-yellow-600" />{t("maintenance.title")}</span>
            </div>
            <Dialog open={addUnitOpen} onOpenChange={setAddUnitOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary text-white border-0">
                  <Plus className="w-4 h-4 mr-1" />{t("unit.addUnit")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{t("unit.addUnit")}</DialogTitle></DialogHeader>
                <form onSubmit={handleUnit(data => createUnit.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>{t("unit.unitNumber")}</Label><Input className="h-10" {...regUnit("unitNumber", { required: true })} /></div>
                    <div className="space-y-1.5"><Label>{t("unit.floor")}</Label><Input type="number" className="h-10" {...regUnit("floor")} /></div>
                    <div className="space-y-1.5"><Label>{t("unit.bedrooms")}</Label><Input type="number" className="h-10" {...regUnit("bedrooms")} /></div>
                    <div className="space-y-1.5"><Label>{t("unit.bathrooms")}</Label><Input type="number" className="h-10" {...regUnit("bathrooms")} /></div>
                    <div className="space-y-1.5"><Label>{t("unit.size")}</Label><Input type="number" step="0.01" className="h-10" {...regUnit("size")} /></div>
                    <div className="space-y-1.5"><Label>{t("unit.rentAmount")}</Label><Input type="number" step="0.01" className="h-10" {...regUnit("rentAmount")} /></div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAddUnitOpen(false)}>{t("common.cancel")}</Button>
                    <Button type="submit" className="gradient-primary text-white border-0" disabled={submittingUnit}>{t("common.add")}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {units.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p>{t("common.noData")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Visual unit grid */}
              <div className="xl:col-span-2">
                <Card>
                  <CardHeader><CardTitle className="text-sm">{t("unit.floorPlan")}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {units.map((unit: any) => (
                        <button
                          key={unit.id}
                          onClick={() => setSelectedUnit(selectedUnit?.id === unit.id ? null : unit)}
                          className={cn(
                            "aspect-square rounded-lg border-2 flex items-center justify-center text-xs font-bold text-white transition-all",
                            getUnitColor(unit),
                            selectedUnit?.id === unit.id && "ring-2 ring-offset-2 ring-primary scale-105"
                          )}
                          title={`${t("unit.unitNumber")} ${unit.unitNumber} — ${unit.isOccupied ? t("unit.occupied") : t("unit.vacant")}`}
                        >
                          {unit.unitNumber}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Unit detail side panel */}
              <div>
                {selectedUnit ? (
                  <Card className="animate-fade-in">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-sm">Unit {selectedUnit.unitNumber}</CardTitle>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedUnit(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t("unit.status")}</span>
                        <Badge variant={selectedUnit.isOccupied ? "warning" : "success"}>
                          {selectedUnit.isOccupied ? t("unit.occupied") : t("unit.vacant")}
                        </Badge>
                      </div>
                      {selectedUnit.floor !== null && <div className="flex justify-between"><span className="text-muted-foreground">{t("unit.floor")}</span><span>{selectedUnit.floor}</span></div>}
                      {selectedUnit.bedrooms && <div className="flex justify-between"><span className="text-muted-foreground">{t("unit.bedrooms")}</span><span>{selectedUnit.bedrooms}</span></div>}
                      {selectedUnit.bathrooms && <div className="flex justify-between"><span className="text-muted-foreground">{t("unit.bathrooms")}</span><span>{selectedUnit.bathrooms}</span></div>}
                      {selectedUnit.size && <div className="flex justify-between"><span className="text-muted-foreground">{t("unit.size")}</span><span>{selectedUnit.size} m²</span></div>}
                      {selectedUnit.rentAmount && <div className="flex justify-between"><span className="text-muted-foreground">{t("unit.rent")}</span><span className="font-semibold text-green-600">{selectedUnit.rentAmount} {t("common.sar")}</span></div>}

                      {selectedUnitLease && (
                        <div className="pt-2 border-t">
                          <p className="font-medium mb-1">{t("unit.activeLease")}</p>
                          <p className="text-xs text-muted-foreground">{t("unit.since")} {formatDate(selectedUnitLease.startDate)}</p>
                          {selectedUnitLease.endDate && <p className="text-xs text-muted-foreground">{t("unit.until")} {formatDate(selectedUnitLease.endDate)}</p>}
                        </div>
                      )}

                      {selectedUnitMaintenance.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="font-medium mb-1">{t("maintenance.title")} ({selectedUnitMaintenance.length})</p>
                          {selectedUnitMaintenance.slice(0, 3).map((r: any) => (
                            <p key={r.id} className="text-xs text-muted-foreground truncate">• {r.title}</p>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="h-full min-h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                    <div className="text-center">
                      <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>{t("unit.clickToView")}</p>
                    </div>
                  </Card>
                )}
              </div>

              {/* Table view */}
              <div className="xl:col-span-3">
                <Card>
                  <div className="overflow-x-auto">
                    <Table className="table-alt">
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("unit.unitNumber")}</TableHead>
                          <TableHead>{t("unit.floor")}</TableHead>
                          <TableHead>{t("unit.bedrooms")}</TableHead>
                          <TableHead>{t("unit.bathrooms")}</TableHead>
                          <TableHead>{t("unit.size")}</TableHead>
                          <TableHead>{t("unit.rentAmount")}</TableHead>
                          <TableHead>{t("unit.status")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {units.map((u: any) => (
                          <TableRow key={u.id} className="cursor-pointer" onClick={() => setSelectedUnit(u)}>
                            <TableCell className="font-medium">{u.unitNumber}</TableCell>
                            <TableCell>{u.floor ?? "—"}</TableCell>
                            <TableCell>{u.bedrooms ?? "—"}</TableCell>
                            <TableCell>{u.bathrooms ?? "—"}</TableCell>
                            <TableCell>{u.size ? `${u.size} m²` : "—"}</TableCell>
                            <TableCell>{u.rentAmount ? `${u.rentAmount} SAR` : "—"}</TableCell>
                            <TableCell>
                              <Badge variant={u.isOccupied ? "warning" : "success"}>
                                {u.isOccupied ? t("unit.occupied") : t("unit.vacant")}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Leases Tab */}
        <TabsContent value="leases" className="mt-4">
          <div className="flex justify-end mb-4">
            <Dialog open={addLeaseOpen} onOpenChange={setAddLeaseOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary text-white border-0">
                  <Plus className="w-4 h-4 mr-1" />{t("lease.addLease")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{t("lease.addLease")}</DialogTitle></DialogHeader>
                <form onSubmit={handleLease(data => createLease.mutate(data))} className="space-y-4">
                  <div className="space-y-1.5"><Label>{t("lease.unitId")}</Label><Input className="h-10" {...regLease("unitId", { required: true })} /></div>
                  <div className="space-y-1.5"><Label>{t("lease.tenantId")}</Label><Input className="h-10" {...regLease("tenantId", { required: true })} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>{t("lease.startDate")}</Label><Input type="date" className="h-10" {...regLease("startDate", { required: true })} /></div>
                    <div className="space-y-1.5"><Label>{t("lease.endDate")}</Label><Input type="date" className="h-10" {...regLease("endDate")} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label>{t("lease.monthlyRent")}</Label><Input type="number" step="0.01" className="h-10" {...regLease("monthlyRent", { required: true })} /></div>
                    <div className="space-y-1.5"><Label>{t("lease.deposit")}</Label><Input type="number" step="0.01" className="h-10" {...regLease("depositAmount")} /></div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setAddLeaseOpen(false)}>{t("common.cancel")}</Button>
                    <Button type="submit" className="gradient-primary text-white border-0" disabled={submittingLease}>{t("common.add")}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <Table className="table-alt">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("lease.startDate")}</TableHead>
                    <TableHead>{t("lease.endDate")}</TableHead>
                    <TableHead>{t("lease.monthlyRent")}</TableHead>
                    <TableHead>{t("lease.deposit")}</TableHead>
                    <TableHead>{t("unit.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leases.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell>{formatDate(l.startDate)}</TableCell>
                      <TableCell>{l.endDate ? formatDate(l.endDate) : "—"}</TableCell>
                      <TableCell className="font-medium">{l.monthlyRent} {t("common.sar")}</TableCell>
                      <TableCell>{l.depositAmount ?? "—"}</TableCell>
                      <TableCell><Badge variant={l.active ? "success" : "gray"}>{l.active ? t("lease.active") : t("lease.inactive")}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {leases.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("common.noData")}</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
