import { z } from "zod";
import { AppointmentArea } from "@/domain/types/enums";

export const appointmentSchema = z.object({
  sectorId: z.string().min(1, "Selecione o setor."),
  machineId: z.string().min(1, "Selecione a máquina."),
  area: z.nativeEnum(AppointmentArea, {
    errorMap: () => ({ message: "Selecione a área do apontamento." }),
  }),
  affectedSegment: z.string().min(1, "Selecione o seguimento afetado."),
  date: z.string().min(1, "Informe a data de lançamento."),
  time: z.string().min(1, "Informe a hora de lançamento."),
  durationMinutes: z.coerce
    .number({ invalid_type_error: "Informe uma duração válida." })
    .int("A duração deve ser um número inteiro de minutos.")
    .positive("A duração deve ser maior que zero."),
  authorId: z.string().min(1, "Selecione quem está lançando."),
  description: z
    .string()
    .min(3, "Descreva o apontamento com ao menos 3 caracteres.")
    .max(500, "Limite de 500 caracteres."),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;
