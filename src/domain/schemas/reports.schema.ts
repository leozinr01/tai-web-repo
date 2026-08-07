import { z } from "zod";

export const reportFilterSchema = z
  .object({
    from: z.string().optional().or(z.literal("")),
    to: z.string().optional().or(z.literal("")),
    sectorId: z.string().optional(),
    machineId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.from || !data.to) return true;
      return data.from <= data.to;
    },
    { message: "A data inicial deve ser menor ou igual a data final.", path: ["to"] },
  );
export type ReportFilterValues = z.infer<typeof reportFilterSchema>;
