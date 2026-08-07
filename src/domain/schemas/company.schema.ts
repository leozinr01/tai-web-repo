import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(2, "Informe o nome da empresa."),
  email: z.string().email("Informe um e-mail valido."),
});
export type CompanyFormValues = z.infer<typeof companySchema>;
