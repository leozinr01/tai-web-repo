import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(2, "Informe o nome da empresa."),
  email: z.string().email("Informe um e-mail valido."),
  phone: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  initialPassword: z.string().optional(),
});
export type CompanyFormValues = z.infer<typeof companySchema>;
