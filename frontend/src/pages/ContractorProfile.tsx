import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Star, Edit, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SPECIALTIES = ["plumbing", "electrical", "hvac", "carpentry", "painting", "cleaning", "general", "other"];

export default function ContractorProfile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [form, setForm] = useState({
    companyName: "",
    description: "",
    licenseNumber: "",
    insuranceInfo: ""
  });

  const { data: contractor, isLoading } = useQuery<any>({
    queryKey: ["contractor-profile"],
    queryFn: () => apiRequest("GET", `/api/contractors/me`).catch(() => null),
    enabled: !!user
  });

  const updateProfile = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/contractors/${contractor?.id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contractor-profile"] });
      setEditing(false);
      toast({ title: t("contractorProfile.profileUpdated") });
    },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" })
  });

  const startEditing = () => {
    setForm({
      companyName: contractor?.companyName || "",
      description: contractor?.description || "",
      licenseNumber: contractor?.licenseNumber || "",
      insuranceInfo: contractor?.insuranceInfo || ""
    });
    setSelectedSpecialties(
      typeof contractor?.specialties === "string"
        ? contractor.specialties.split(",").map((s: string) => s.trim())
        : Array.isArray(contractor?.specialties) ? contractor.specialties : []
    );
    setEditing(true);
  };

  const handleSave = () => {
    updateProfile.mutate({
      ...form,
      specialties: selectedSpecialties.join(", ")
    });
  };

  const toggleSpecialty = (s: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  if (isLoading) return <Skeleton className="h-96 rounded-xl" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <User className="w-7 h-7 text-primary" />
          {t("contractorProfile.title")}
        </h1>
        {!editing ? (
          <Button variant="outline" onClick={startEditing}>
            <Edit className="w-4 h-4 mr-2" />{t("contractorProfile.editProfile")}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>{t("common.cancel")}</Button>
            <Button className="gradient-primary text-white border-0" onClick={handleSave} disabled={updateProfile.isPending}>
              <Check className="w-4 h-4 mr-2" />{t("common.save")}
            </Button>
          </div>
        )}
      </div>

      {/* Rating and stats header */}
      {contractor && (
        <Card className="hover-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-bold">
                {(contractor.companyName || user?.name || "C").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg">{contractor.companyName || user?.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className={cn("w-4 h-4", i <= Math.round(contractor.averageRating || 0) ? "text-yellow-500 fill-current" : "text-muted-foreground")}
                      />
                    ))}
                    <span className="text-sm ml-1">{contractor.averageRating?.toFixed(1) || "—"}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{contractor.totalReviews || 0} reviews</span>
                </div>
              </div>
              {contractor.verified && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <Check className="w-3 h-3 mr-1" />{t("contractorProfile.verified")}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile details */}
      <Card className="hover-card">
        <CardHeader><CardTitle className="text-base">{t("contractorProfile.businessInfo")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-1.5">
                <Label>{t("contractorProfile.companyName")}</Label>
                <Input className="h-10" value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("contractorProfile.description")}</Label>
                <Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t("contractorProfile.descPlaceholder")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("contractorProfile.licenseNumber")}</Label>
                <Input className="h-10" value={form.licenseNumber} onChange={e => setForm(f => ({ ...f, licenseNumber: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("contractorProfile.insuranceInfo")}</Label>
                <Input className="h-10" value={form.insuranceInfo} onChange={e => setForm(f => ({ ...f, insuranceInfo: e.target.value }))} />
              </div>
            </>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("contractorProfile.company")}</span><span className="font-medium">{contractor?.companyName || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("contractorProfile.license")}</span><span>{contractor?.licenseNumber || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("contractorProfile.insurance")}</span><span>{contractor?.insuranceInfo || "—"}</span></div>
              {contractor?.description && (
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground mb-1">{t("contractorProfile.about")}</p>
                  <p>{contractor.description}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Specialties */}
      <Card className="hover-card">
        <CardHeader><CardTitle className="text-base">{t("contractorProfile.specialties")}</CardTitle></CardHeader>
        <CardContent>
          {editing ? (
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpecialty(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm border transition-all",
                    selectedSpecialties.includes(s)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary"
                  )}
                >
                  {t(`maintenance.categories.${s}`)}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(typeof contractor?.specialties === "string"
                ? contractor.specialties.split(",").map((s: string) => s.trim())
                : Array.isArray(contractor?.specialties) ? contractor.specialties : []
              ).filter(Boolean).map((s: string) => (
                <Badge key={s} variant="outline">{t(`maintenance.categories.${s}`) || s}</Badge>
              ))}
              {!contractor?.specialties && <p className="text-sm text-muted-foreground">{t("contractorProfile.noSpecialties")}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
