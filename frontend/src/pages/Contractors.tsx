import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { HardHat, Star, ShieldCheck } from "lucide-react";

const specialties = ["plumbing", "electrical", "hvac", "carpentry", "painting", "cleaning", "general"];

export default function Contractors() {
  const { t } = useTranslation();
  const [specialty, setSpecialty] = useState("all");

  const { data: contractors = [], isLoading } = useQuery<any[]>({
    queryKey: ["contractors", specialty],
    queryFn: () => apiRequest("GET", `/api/contractors${specialty !== "all" ? `?specialty=${specialty}` : ""}`)
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">{t("contractor.title")}</h1>
        <Select value={specialty} onValueChange={setSpecialty}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("contractor.filterBySpecialty")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {specialties.map(s => (
              <SelectItem key={s} value={s}>{t(`maintenance.categories.${s}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {contractors.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <HardHat className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p>{t("contractor.noContractors")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractors.map((c: any) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <HardHat className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{c.companyName}</h3>
                      {c.verified && <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{Number(c.rating).toFixed(1)} ({c.totalReviews} {t("contractor.rating")})</span>
                    </div>
                    {c.user?.name && <p className="text-sm text-muted-foreground mb-3">{c.user.name}</p>}
                    {c.specialties && c.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {c.specialties.slice(0, 4).map((s: string) => (
                          <Badge key={s} variant="secondary" className="text-xs">
                            {t(`maintenance.categories.${s}`)}
                          </Badge>
                        ))}
                        {c.specialties.length > 4 && (
                          <Badge variant="outline" className="text-xs">+{c.specialties.length - 4}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
