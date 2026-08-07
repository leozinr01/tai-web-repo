import { z } from "zod";
import { UserRole } from "@/domain/types/enums";

export const companyProfileSchema = z.object({
  name: z.string().min(2, "Informe o nome da empresa."),
  logoUrl: z
    .string()
    .url("Informe uma URL valida.")
    .optional()
    .or(z.literal("")),
});
export type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>;

export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
export const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

export const userAccessSchema = z.object({
  name: z.string().min(2, "Informe o nome."),
  email: z.string().email("Informe um e-mail valido."),
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: "Selecione um perfil." }),
  }),
});
export type UserAccessFormValues = z.infer<typeof userAccessSchema>;
