import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { loginSchema, type LoginFormValues } from "@/domain/schemas/auth.schema";
import { useAuth } from "@/features/auth/auth-context";
import { Input, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DEMO_PASSWORD } from "@/data/mocks/seed-users";

const demoAccounts = [
  { label: "Master", email: "app@taiproject.com.br" },
  { label: "Operador", email: "operador@teste.com.br" },
  { label: "Visitante", email: "visitante@smarttai.com.br" },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Nao foi possivel entrar.");
    }
  };

  const fillDemo = (email: string) => {
    setValue("email", email);
    setValue("password", DEMO_PASSWORD);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4">
      <div
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(600px circle at 20% 20%, rgba(59,130,246,0.12), transparent 60%), radial-gradient(600px circle at 80% 80%, rgba(59,130,246,0.08), transparent 60%)",
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="panel px-8 py-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/15 text-brand-light">
              <span className="font-display text-2xl font-black">TAI</span>
            </div>
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-slate-100">
              Tai Project
            </h1>
            <p className="mt-1 text-sm text-muted">Plataforma industrial de monitoramento</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="label-caps mb-1.5 block">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="ex@empresa.com"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                autoComplete="username"
                {...register("email")}
              />
              <FieldError message={errors.email?.message} />
            </div>

            <div>
              <label htmlFor="password" className="label-caps mb-1.5 block">
                Senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  leftIcon={<Lock className="h-4 w-4" />}
                  error={errors.password?.message}
                  autoComplete="current-password"
                  className="pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-slate-200"
                  aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FieldError message={errors.password?.message} />
            </div>

            {serverError && (
              <div role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger-light">
                {serverError}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isSubmitting} size="lg">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Entrar
            </Button>
          </form>

          <div className="mt-6 border-t border-panel-border pt-5">
            <p className="label-caps mb-2">Contas de demonstracao</p>
            <div className="flex flex-wrap gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc.email)}
                  className="rounded-md border border-panel-border bg-navy-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:border-brand hover:text-brand-light"
                >
                  {acc.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-muted">Senha para todas as contas: {DEMO_PASSWORD}</p>
          </div>
        </div>
        <p className="mt-6 text-center text-[11px] uppercase tracking-widest text-muted">
          Powered by Tai Industrial Platform v3.0
        </p>
      </div>
    </div>
  );
}
