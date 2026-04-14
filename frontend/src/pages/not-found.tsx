import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-8xl font-bold text-muted-foreground mb-4">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Page not found</p>
      <Link href="/dashboard">
        <Button><Home className="w-4 h-4 mr-2" />{t("nav.dashboard")}</Button>
      </Link>
    </div>
  );
}
