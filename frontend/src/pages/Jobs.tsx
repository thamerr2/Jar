import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, MapPin, Clock, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { formatDate, cn } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800"
};

export default function Jobs() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [quoteData, setQuoteData] = useState({ amount: "", description: "", estimatedDuration: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const { data: requests = [], isLoading } = useQuery<any[]>({
    queryKey: ["maintenance-requests-open"],
    queryFn: () => apiRequest("GET", "/api/maintenance-requests?status=submitted"),
    enabled: user?.role === "contractor"
  });

  const submitQuote = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/quotes", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance-requests-open"] });
      setQuoteOpen(false);
      setQuoteData({ amount: "", description: "", estimatedDuration: "" });
      toast({ title: t("common.success") });
    },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" })
  });

  // Filter jobs that have no assigned contractor
  const availableJobs = requests
    .filter((r: any) => !r.assignedToId)
    .filter((r: any) => !searchTerm || r.title?.toLowerCase().includes(searchTerm.toLowerCase()) || r.category?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Briefcase className="w-7 h-7 text-primary" />
          {t("jobs.title")}
        </h1>
        <Badge variant="outline" className="text-sm">{availableJobs.length} {t("jobs.available")}</Badge>
      </div>

      <Input
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        placeholder={t("jobs.searchPlaceholder")}
        className="max-w-sm h-10"
      />

      {availableJobs.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground animate-fade-in">
          <Briefcase className="w-20 h-20 mx-auto mb-5 opacity-25" />
          <p className="text-xl font-medium mb-2">{t("jobs.noJobs")}</p>
          <p className="text-sm">{t("jobs.noJobsDesc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableJobs.map((job: any) => (
            <Card key={job.id} className="hover-card">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-2">{job.title}</CardTitle>
                  <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium shrink-0", priorityColors[job.priority] || "bg-gray-100 text-gray-800")}>
                    {t(`maintenance.priorities.${job.priority}`)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                    <Briefcase className="w-3 h-3" />
                    {t(`maintenance.categories.${job.category}`)}
                  </span>
                  {job.unit?.property?.city && (
                    <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                      <MapPin className="w-3 h-3" />
                      {job.unit.property.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" />
                    {formatDate(job.createdAt)}
                  </span>
                </div>

                {job.priority === "urgent" && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-2 py-1.5">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>{t("jobs.urgentLabel")}</span>
                  </div>
                )}

                <Button
                  className="w-full gradient-primary text-white border-0 h-9"
                  size="sm"
                  onClick={() => {
                    setSelectedJob(job);
                    setQuoteOpen(true);
                  }}
                >
                  {t("jobs.submitQuote")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quote dialog */}
      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("jobs.submitQuote")}</DialogTitle>
            {selectedJob && <p className="text-sm text-muted-foreground mt-1">{selectedJob.title}</p>}
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("quote.amount")}</Label>
              <Input
                type="number"
                step="0.01"
                className="h-10"
                value={quoteData.amount}
                onChange={e => setQuoteData(d => ({ ...d, amount: e.target.value }))}
                placeholder={t("quote.amountPlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("quote.description")}</Label>
              <Textarea
                rows={3}
                value={quoteData.description}
                onChange={e => setQuoteData(d => ({ ...d, description: e.target.value }))}
                placeholder={t("quote.descPlaceholder")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("quote.estimatedDuration")}</Label>
              <Input
                className="h-10"
                value={quoteData.estimatedDuration}
                onChange={e => setQuoteData(d => ({ ...d, estimatedDuration: e.target.value }))}
                placeholder={t("quote.durationPlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuoteOpen(false)}>{t("common.cancel")}</Button>
            <Button
              className="gradient-primary text-white border-0"
              onClick={() => submitQuote.mutate({ ...quoteData, maintenanceRequestId: selectedJob?.id, amount: Number(quoteData.amount) })}
              disabled={submitQuote.isPending || !quoteData.amount}
            >
              {t("common.submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
