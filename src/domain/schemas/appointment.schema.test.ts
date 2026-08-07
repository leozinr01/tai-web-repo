import { describe, expect, it } from "vitest";
import { appointmentSchema } from "@/domain/schemas/appointment.schema";
import { AppointmentArea } from "@/domain/types/enums";

const validPayload = {
  sectorId: "sector_1",
  machineId: "machine_1",
  area: AppointmentArea.MECANICA,
  affectedSegment: "Producao",
  date: "2026-08-01",
  time: "10:00",
  durationMinutes: 15,
  authorId: "user_1",
  description: "Troca de sensor de vibracao",
};

describe("appointmentSchema", () => {
  it("aceita um payload valido", () => {
    const result = appointmentSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("rejeita duracao negativa", () => {
    const result = appointmentSchema.safeParse({ ...validPayload, durationMinutes: -5 });
    expect(result.success).toBe(false);
  });

  it("rejeita descricao vazia", () => {
    const result = appointmentSchema.safeParse({ ...validPayload, description: "" });
    expect(result.success).toBe(false);
  });
});
