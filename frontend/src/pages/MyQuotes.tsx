import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FileText, Clock, Check, X } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

const statusGroups = ["pending", "accepted", "rejected"] as const;

const statusConfig = {
  pending: { labelKey: "quote.statuses.pending", icon: Clock, color: "text-yellow-600 bg-yellow-50" },
  accepted: { labelKey: "quote.statuses.accepted", icon: Check, color: "text-green-600 bg-green-50" },
  rejected: { labelKey: "quote.statuses.rejected", icon: X, color: "text-red-600 bg-red-50" }
};

export default function MyQuotes() {
  const { t } = useTranslation();

  const { data: quotes = [], isLoading } = useQuery<any[]>({
    queryKey: ["my-quotes"],
    queryFn: () => apiRequest("GET", "/api/quotes?mine=true")
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-40" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
        <FileText className="w-7 h-7 text-primary" />
        {t("myQuotes.title")}
      </h1>

      {quotes.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground animate-fade-in">
          <FileText className="w-20 h-20 mx-auto mb-5 opacity-25" />
          <p className="text-xl font-medium mb-2">{t("myQuotes.noQuotes")}</p>
          <p className="text-sm">{t("myQuotes.noQuotesDesc")}</p>
          <Link href="/jobs">
            <Button className="mt-6 gradient-primary text-white border-0">{t("myQuotes.browseJobs")}</Button>
          </Link>
        </div>
      ) : (
        statusGroups.map(status => {
          const group = quotes.filter(q => q.status === status);
          if (group.length === 0) return null;
          const { labelKey, icon: Icon, color } = statusConfig[status];

          return (
            <div key={status}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                <h2 className="font-semibold">{t(labelKey)} ({group.length})</h2>
              </div>
              <div className="space-y-3">
                {group.map((q: any) => (
                  <Card key={q.id} className="hover-card">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-lg text-green-600 mb-1">{formatCurrency(q.amount)}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{q.description}</p>
                          {q.estimatedDuration && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />{q.estimatedDuration}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">Submitted {formatDate(q.createdAt)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <Badge variant={({ pending: "warning", accepted: "success", rejected: "destructive" } as any)[q.status]}>
                            {t(`quote.statuses.${q.status}`)}
                          </Badge>
                          {q.maintenanceRequestId && (
                            <Link href={`/maintenance/${q.maintenanceRequestId}`}>
                              <a><Button variant="ghost" size="sm" className="text-xs h-7">{t("common.view")}</Button></a>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
