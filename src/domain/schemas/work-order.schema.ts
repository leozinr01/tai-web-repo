import { z } from "zod";
import { WorkOrderPeriodicity, WorkOrderStatus } from "@/domain/types/enums";

export const workOrderSchema = z.object({
  sectorId: z.string().min(1, "Selecione o setor."),
  machineId: z.string().min(1, "Selecione a maquina."),
  executorId: z.string().min(1, "Selecione o executor."),
  description: z
    .string()
    .min(3, "Descreva o servico com ao menos 3 caracteres.")
    .max(500, "Limite de 500 caracteres."),
  date: z.string().min(1, "Informe a proxima execucao."),
  periodicity: z.nativeEnum(WorkOrderPeriodicity, {
    errorMap: () => ({ message: "Selecione a periodicidade." }),
  }),
});

export type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

export const workOrderQuickEditSchema = z.object({
  status: z.nativeEnum(WorkOrderStatus, {
    errorMap: () => ({ message: "Selecione o status." }),
  }),
  executorName: z.string().min(2, "Informe o nome do executor."),
  description: z
    .string()
    .min(3, "Descreva o servico com ao menos 3 caracteres.")
    .max(500, "Limite de 500 caracteres."),
});

export type WorkOrderQuickEditValues = z.infer<typeof workOrderQuickEditSchema>;
