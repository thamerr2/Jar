import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Sun, Moon } from "lucide-react";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [profileSuccess, setProfileSuccess] = useState(false);

  const { register: regProfile, handleSubmit: handleProfile, formState: { isSubmitting: submittingProfile } } = useForm({
    defaultValues: { name: user?.name ?? "", phone: user?.phone ?? "" }
  });

  const { register: regPw, handleSubmit: handlePw, reset: resetPw, formState: { isSubmitting: submittingPw } } = useForm<{ currentPassword: string; newPassword: string; confirmNewPassword: string }>();

  const updateProfile = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/auth/me`, data),
    onSuccess: () => { setProfileSuccess(true); toast({ title: t("common.success") }); },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" })
  });

  const changePassword = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/auth/change-password", data),
    onSuccess: () => { resetPw(); toast({ title: t("common.success") }); },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" })
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">{t("settings.profile")}</TabsTrigger>
          <TabsTrigger value="security">{t("settings.security")}</TabsTrigger>
          <TabsTrigger value="preferences">{t("settings.preferences")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("settings.profile")}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleProfile(data => updateProfile.mutate(data))} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("auth.name")}</Label>
                  <Input {...regProfile("name")} />
                </div>
                <div className="space-y-2">
                  <Label>{t("auth.email")}</Label>
                  <Input type="email" defaultValue={user?.email} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label>{t("auth.phone")}</Label>
                  <Input {...regProfile("phone")} />
                </div>
                <Button type="submit" disabled={submittingProfile}>{t("settings.saveChanges")}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("settings.security")}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handlePw(data => {
                if (data.newPassword !== data.confirmNewPassword) {
                  toast({ title: "Passwords don't match", variant: "destructive" });
                  return;
                }
                changePassword.mutate(data);
              })} className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("settings.currentPassword")}</Label>
                  <Input type="password" {...regPw("currentPassword", { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.newPassword")}</Label>
                  <Input type="password" {...regPw("newPassword", { required: true, minLength: 8 })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("settings.confirmNewPassword")}</Label>
                  <Input type="password" {...regPw("confirmNewPassword", { required: true })} />
                </div>
                <Button type="submit" disabled={submittingPw}>{t("settings.saveChanges")}</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("settings.preferences")}</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {/* Language */}
              <div>
                <Label className="text-sm font-medium mb-3 block">{t("settings.language")}</Label>
                <div className="flex gap-2">
                  <Button
                    variant={i18n.language === "ar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => i18n.changeLanguage("ar")}
                  >
                    العربية
                  </Button>
                  <Button
                    variant={i18n.language === "en" ? "default" : "outline"}
                    size="sm"
                    onClick={() => i18n.changeLanguage("en")}
                  >
                    English
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Theme */}
              <div>
                <Label className="text-sm font-medium mb-3 block">{t("settings.theme")}</Label>
                <div className="flex gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="w-4 h-4 mr-1" />{t("settings.light")}
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="w-4 h-4 mr-1" />{t("settings.dark")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
