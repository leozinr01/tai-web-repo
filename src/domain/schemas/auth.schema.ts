import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Informe o e-mail.")
    .email("Informe um e-mail valido."),
  password: z
    .string()
    .min(1, "Informe a senha.")
    .min(6, "A senha deve ter ao menos 6 caracteres."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
