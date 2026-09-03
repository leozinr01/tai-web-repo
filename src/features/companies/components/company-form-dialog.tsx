import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel, Input } from "@/components/ui/input";
import { companySchema, type CompanyFormValues } from "@/domain/schemas/company.schema";
import type { Company } from "@/domain/entities/company";

const emptyValues: CompanyFormValues = {
  name: "",
  email: "",
  phone: "",
  state: "",
  city: "",
  initialPassword: "",
};

export function CompanyFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: CompanyFormValues) => Promise<void>;
  isSubmitting: boolean;
  initial?: Company | null;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) {
      reset(initial ? { ...emptyValues, name: initial.name, email: initial.email } : emptyValues);
    }
  }, [open, initial, reset]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? "Editar empresa" : "Cadastrar nova empresa"}
      titleClassName="uppercase tracking-tight"
      icon={initial ? <Pencil className="h-5 w-5" /> : undefined}
      size="sm"
      contentClassName="max-w-lg !p-8 bg-navy-950"
      hint="Preencha os campos para registrar a operação"
      footer={
        <Button
          form="company-form"
          type="submit"
          isLoading={isSubmitting}
          className="h-auto w-full py-4 text-xs font-black uppercase shadow-lg shadow-brand/20"
        >
          {initial ? "Salvar alterações" : "Cadastrar empresa"}
        </Button>
      }
    >
      <form id="company-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div>
          <FieldLabel>Nome da empresa</FieldLabel>
          <Input
            placeholder="Ex: TAI Logistics"
            error={errors.name?.message}
            className="h-auto px-4 py-3"
            {...register("name")}
          />
          <FieldError message={errors.name?.message} />
        </div>

        {initial ? (
          <p className="text-[10px] italic text-muted">
            Nota: Alterar o e-mail do administrador deve ser feito via painel de usuários.
          </p>
        ) : (
          <>
            <div>
              <FieldLabel>E-mail do administrador</FieldLabel>
              <Input
                type="email"
                placeholder="admin@empresa.com"
                error={errors.email?.message}
                className="h-auto px-4 py-3"
                {...register("email")}
              />
              <FieldError message={errors.email?.message} />
            </div>
            <div>
              <FieldLabel>Telefone</FieldLabel>
              <Input placeholder="(11) 99999-9999" className="h-auto px-4 py-3" {...register("phone")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Estado</FieldLabel>
                <Input placeholder="SP" className="h-auto px-4 py-3 uppercase" {...register("state")} />
              </div>
              <div>
                <FieldLabel>Cidade</FieldLabel>
                <Input placeholder="São Paulo" className="h-auto px-4 py-3" {...register("city")} />
              </div>
            </div>
            <div>
              <FieldLabel>Senha inicial</FieldLabel>
              <Input
                type="password"
                placeholder="••••••••"
                className="h-auto px-4 py-3"
                {...register("initialPassword")}
              />
            </div>
          </>
        )}
      </form>
    </Dialog>
  );
}
