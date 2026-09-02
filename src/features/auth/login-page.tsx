import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useLocation } from "react-router-dom";
import { User, PenTool, Loader2 } from "lucide-react";
import { loginSchema, type LoginFormValues } from "@/domain/schemas/auth.schema";
import { useAuth } from "@/features/auth/auth-context";
import { FieldError } from "@/components/ui/input";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
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

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 bg-tai p-6">
      <div className="absolute inset-0 z-0">
        <div className="absolute left-[10%] top-[20%] h-96 w-96 rounded-full bg-brand/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] h-96 w-96 rounded-full bg-teal-400/10 blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 !p-8 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="mb-4 flex flex-col items-center text-center">
            <img src="/logo-smartai.png" alt="SmartTai" className="h-32 w-auto object-contain drop-shadow-2xl" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="label-caps mb-1.5 block">
                E-mail
              </label>
              <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 transition-all focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
                <User className="h-4 w-4 shrink-0 text-muted transition-colors group-focus-within:text-brand-light" />
                <input
                  id="email"
                  type="email"
                  placeholder="ex@empresa.com"
                  autoComplete="username"
                  className="w-full bg-transparent text-sm text-white focus:outline-none"
                  {...register("email")}
                />
              </div>
              <FieldError message={errors.email?.message} />
            </div>

            <div>
              <label htmlFor="password" className="label-caps mb-1.5 block">
                Senha
              </label>
              <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 transition-all focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
                <PenTool className="h-4 w-4 shrink-0 text-muted transition-colors group-focus-within:text-brand-light" />
                <input
                  id="password"
                  type="password"
                  placeholder="********"
                  autoComplete="current-password"
                  className="w-full bg-transparent text-sm text-white focus:outline-none"
                  {...register("password")}
                />
              </div>
              <FieldError message={errors.password?.message} />
            </div>

            {serverError && (
              <div role="alert" className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger-light">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full overflow-hidden rounded-2xl bg-brand py-4 text-sm font-black uppercase tracking-wide text-white shadow-xl shadow-brand/20 transition-all hover:bg-brand/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
            >
              <span className="flex items-center justify-center gap-2">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Entrar
              </span>
            </button>
          </form>
        </div>
        <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-muted/40">
          Powered by Tai Industrial Platform v3.0
        </p>
      </div>
    </div>
  );
}
