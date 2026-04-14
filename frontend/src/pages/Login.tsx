import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional()
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<{ field?: string; message: string } | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { rememberMe: false }
  });

  const onSubmit = async (data: FormData) => {
    try {
      setServerError(null);
      await login(data.email, data.password);
      // If Remember Me, ensure token is in localStorage (default). Otherwise, move to sessionStorage.
      if (!data.rememberMe) {
        const token = localStorage.getItem("token");
        if (token) {
          sessionStorage.setItem("token", token);
          localStorage.removeItem("token");
        }
      }
      navigate("/dashboard");
    } catch (err: any) {
      const msg: string = err.message || t("common.error");
      if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("user")) {
        setServerError({ field: "email", message: msg });
      } else if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("credential")) {
        setServerError({ field: "password", message: msg });
      } else {
        setServerError({ message: msg });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #f0faf5 0%, #e8f5ef 50%, #f5f9f7 100%)" }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ background: "rgba(127,212,160,0.12)" }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl" style={{ background: "rgba(13,31,26,0.05)" }} />
      </div>

      <div className="w-full max-w-md animate-slide-up relative">
        <Card className="shadow-2xl glass-card">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <img src="/logo.svg" alt="Jar" className="w-14 h-14 rounded-2xl shadow-lg object-contain" />
            </div>
            <CardTitle className="text-2xl font-bold">{t("auth.welcomeBack")}</CardTitle>
            <CardDescription>{t("auth.signInSubtitle")}</CardDescription>
          </CardHeader>

          <CardContent>
            {serverError && !serverError.field && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {serverError.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  placeholder={t("auth.placeholders.email")}
                  className={cn(
                    "h-11",
                    (errors.email || serverError?.field === "email") && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                {serverError?.field === "email" && <p className="text-xs text-destructive">{serverError.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...register("password")}
                    className={cn(
                      "h-11 pr-10",
                      (errors.password || serverError?.field === "password") && "border-destructive focus-visible:ring-destructive"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                {serverError?.field === "password" && <p className="text-xs text-destructive">{serverError.message}</p>}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  {...register("rememberMe")}
                  className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
                />
                <Label htmlFor="rememberMe" className="cursor-pointer font-normal text-muted-foreground">
                  {t("auth.rememberMe")}
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-white border-0 font-semibold text-base shadow-md hover:shadow-lg hover:opacity-90 transition-all"
                style={{ background: "#0D1F1A" }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("auth.signingIn")}
                  </span>
                ) : t("auth.loginButton")}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              {t("auth.noAccount")}{" "}
              <Link href="/register">
                <a className="text-primary hover:underline font-semibold">{t("auth.registerButton")}</a>
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
