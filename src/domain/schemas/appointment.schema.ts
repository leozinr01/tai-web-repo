import { z } from "zod";
import { AppointmentArea } from "@/domain/types/enums";

export const appointmentSchema = z.object({
  sectorId: z.string().min(1, "Selecione o setor."),
  machineId: z.string().min(1, "Selecione a maquina."),
  area: z.nativeEnum(AppointmentArea, {
    errorMap: () => ({ message: "Selecione a area do apontamento." }),
  }),
  affectedSegment: z.string().min(1, "Selecione o segmento afetado."),
  date: z.string().min(1, "Informe a data de lancamento."),
  time: z.string().min(1, "Informe a hora de lancamento."),
  durationMinutes: z.coerce
    .number({ invalid_type_error: "Informe uma duracao valida." })
    .int("A duracao deve ser um numero inteiro de minutos.")
    .positive("A duracao deve ser maior que zero."),
  authorId: z.string().min(1, "Selecione quem esta lancando."),
  description: z
    .string()
    .min(3, "Descreva o apontamento com ao menos 3 caracteres.")
    .max(500, "Limite de 500 caracteres."),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;
