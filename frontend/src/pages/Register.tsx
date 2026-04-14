import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, Wrench, Check, Eye, EyeOff, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  password: z.string().min(8, "At least 8 characters"),
  confirmPassword: z.string(),
  role: z.enum(["tenant", "owner", "contractor"]),
  companyName: z.string().optional(),
  specialties: z.string().optional(),
  licenseNumber: z.string().optional()
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

type FormData = z.infer<typeof schema>;

const roleCardDefs = [
  { value: "tenant", icon: User, labelKey: "auth.roles.tenant", descKey: "auth.roles.tenantDesc" },
  { value: "owner", icon: Building2, labelKey: "auth.roles.owner", descKey: "auth.roles.ownerDesc" },
  { value: "contractor", icon: Wrench, labelKey: "auth.roles.contractor", descKey: "auth.roles.contractorDesc" }
];

function PasswordStrength({ password, t }: { password: string; t: TFunction }) {
  const checks = [
    { key: "minLength", pass: password.length >= 8 },
    { key: "uppercase", pass: /[A-Z]/.test(password) },
    { key: "number", pass: /\d/.test(password) },
    { key: "special", pass: /[^a-zA-Z0-9]/.test(password) }
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ["", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  const levelKeys = ["", "weak", "fair", "good", "strong"];

  if (!password) return null;

  return (
    <div className="space-y-2 mt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={cn("strength-bar flex-1", i <= score ? colors[score] : "bg-muted")} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{t("auth.passwordStrength")} <span className={`font-medium ${score >= 3 ? "text-green-600" : score >= 2 ? "text-yellow-600" : "text-red-500"}`}>{score > 0 ? t(`auth.strengthLevels.${levelKeys[score]}`) : ""}</span></p>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map(c => (
          <span key={c.key} className={cn("text-xs flex items-center gap-1", c.pass ? "text-green-600" : "text-muted-foreground")}>
            <Check className="w-3 h-3" />
            {t(`auth.passwordChecks.${c.key}`)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Register() {
  const { t } = useTranslation();
  const { register: authRegister } = useAuth();
  const [, navigate] = useLocation();
  const [serverError, setServerError] = useState<{ field?: string; message: string } | null>(null);
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState("tenant");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const { register, handleSubmit, setValue, getValues, trigger, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "tenant" }
  });

  const nextStep = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      const valid = await trigger(["name", "email", "phone", "password", "confirmPassword"]);
      if (valid) setStep(3);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setServerError(null);
      await authRegister(data as Record<string, string>);
      navigate("/dashboard");
    } catch (err: any) {
      const msg: string = err.message || t("common.error");
      if (msg.toLowerCase().includes("email")) {
        setServerError({ field: "email", message: msg });
        setStep(2);
      } else {
        setServerError({ message: msg });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #f0faf5 0%, #e8f5ef 50%, #f5f9f7 100%)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl" style={{ background: "rgba(127,212,160,0.12)" }} />
      </div>

      <div className="w-full max-w-lg animate-slide-up relative">
        <Card className="shadow-2xl glass-card">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <img src="/logo.svg" alt="Jar" className="w-14 h-14 rounded-2xl shadow-lg object-contain" />
            </div>
            <CardTitle className="text-2xl font-bold">{t("auth.createAccount")}</CardTitle>
            <CardDescription>{t("auth.joinJarStep", { step })}</CardDescription>

            {/* Progress bar */}
            <div className="flex gap-1.5 mt-4">
              {[1, 2, 3].map(s => (
                <div key={s} className={cn("h-1.5 flex-1 rounded-full transition-all duration-300", s <= step ? "gradient-primary" : "bg-muted")} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
              <span>{t("auth.accountType")}</span>
              <span>{t("auth.personalInfo")}</span>
              <span>{t("auth.details")}</span>
            </div>
          </CardHeader>

          <CardContent>
            {serverError && !serverError.field && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                {serverError.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Step 1: Role Selection */}
              {step === 1 && (
                <div className="space-y-3 animate-fade-in">
                  <p className="text-sm font-medium text-center text-muted-foreground mb-4">{t("auth.chooseAccountType")}</p>
                  {roleCardDefs.map(role => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => { setSelectedRole(role.value); setValue("role", role.value as any); }}
                      className={cn(
                        "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all",
                        selectedRole === role.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30 hover:bg-muted/30"
                      )}
                    >
                      <div className={cn("p-2.5 rounded-lg shrink-0", selectedRole === role.value ? "gradient-primary" : "bg-muted")}>
                        <role.icon className={cn("w-5 h-5", selectedRole === role.value ? "text-white" : "text-muted-foreground")} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{t(role.labelKey)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t(role.descKey)}</p>
                      </div>
                      {selectedRole === role.value && (
                        <div className="ml-auto shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Personal Info */}
              {step === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1.5">
                    <Label>{t("auth.name")}</Label>
                    <Input
                      className="h-11"
                      {...register("name")}
                      placeholder={t("auth.placeholders.fullName")}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label>{t("auth.email")}</Label>
                    <Input
                      type="email"
                      className={cn("h-11", (errors.email || serverError?.field === "email") && "border-destructive")}
                      {...register("email")}
                      placeholder={t("auth.placeholders.email")}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    {serverError?.field === "email" && <p className="text-xs text-destructive">{serverError.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label>{t("auth.phone")}</Label>
                    <Input type="tel" inputMode="tel" className="h-11" {...register("phone")} placeholder={t("auth.placeholders.phone")} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>{t("auth.password")}</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        className={cn("h-11 pr-10", errors.password && "border-destructive")}
                        {...register("password")}
                        onChange={e => { setPasswordValue(e.target.value); }}
                      />
                      <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                    <PasswordStrength password={passwordValue} t={t} />
                  </div>

                  <div className="space-y-1.5">
                    <Label>{t("auth.confirmPassword")}</Label>
                    <Input
                      type="password"
                      className={cn("h-11", errors.confirmPassword && "border-destructive")}
                      {...register("confirmPassword")}
                    />
                    {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                  </div>
                </div>
              )}

              {/* Step 3: Role-specific info */}
              {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-sm">
                    <span className="font-medium">{t("auth.accountTypeLabel")} </span>
                    {t(`auth.roles.${selectedRole}`)}
                  </div>

                  {selectedRole === "owner" && (
                    <div className="space-y-1.5">
                      <Label>{t("auth.companyName")}</Label>
                      <Input className="h-11" {...register("companyName")} placeholder={t("auth.placeholders.companyName")} />
                    </div>
                  )}

                  {selectedRole === "contractor" && (
                    <>
                      <div className="space-y-1.5">
                        <Label>{t("auth.companyName")}</Label>
                        <Input className="h-11" {...register("companyName")} placeholder={t("auth.placeholders.businessName")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t("auth.specialties")}</Label>
                        <Input className="h-11" {...register("specialties")} placeholder={t("auth.specialtiesPlaceholder")} />
                      </div>
                      <div className="space-y-1.5">
                        <Label>{t("auth.licenseNumber")}</Label>
                        <Input className="h-11" {...register("licenseNumber")} />
                      </div>
                    </>
                  )}

                  {selectedRole === "tenant" && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Check className="w-12 h-12 mx-auto mb-3 text-green-500" />
                      <p className="font-medium">{t("auth.allSetTitle")}</p>
                      <p className="text-sm mt-1">{t("auth.allSetSubtitle")}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex gap-3 pt-2">
                {step > 1 && (
                  <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setStep(s => s - 1)}>
                    {t("auth.back")}
                  </Button>
                )}
                {step < 3 ? (
                  <Button
                    type="button"
                    className="flex-1 h-11 text-white border-0 font-semibold hover:opacity-90" style={{ background: "#0D1F1A" }}
                    onClick={nextStep}
                  >
                    {t("auth.continue")}
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="flex-1 h-11 text-white border-0 font-semibold hover:opacity-90" style={{ background: "#0D1F1A" }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t("auth.creatingAccount")}
                      </span>
                    ) : t("auth.registerButton")}
                  </Button>
                )}
              </div>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              {t("auth.hasAccount")}{" "}
              <Link href="/login">
                <a className="text-primary hover:underline font-semibold">{t("auth.loginButton")}</a>
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
