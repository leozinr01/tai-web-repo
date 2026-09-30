import { describe, expect, it } from "vitest";
import { durationBetween, formatDuration, parseDuration, timeToMinutes } from "@/domain/appointment-time";

describe("durationBetween", () => {
  it("calcula a parada no mesmo dia", () => {
    expect(durationBetween("08:00", "08:15")).toBe(15);
    expect(durationBetween("08:50", "10:05")).toBe(75);
  });

  it("parada que passa da meia-noite", () => {
    expect(durationBetween("22:00", "02:00")).toBe(240);
    expect(durationBetween("23:59", "00:00")).toBe(1);
  });

  it("inicio igual ao fim da zero, nao 24 horas", () => {
    expect(durationBetween("08:00", "08:00")).toBe(0);
  });
});

describe("formatDuration / parseDuration", () => {
  it("vai e volta sem perder minutos", () => {
    for (const minutes of [0, 5, 60, 75, 1439, 1500]) {
      expect(parseDuration(formatDuration(minutes))).toBe(minutes);
    }
  });

  it("formata com dois digitos e aceita mais de 24h", () => {
    expect(formatDuration(5)).toBe("00:05");
    expect(formatDuration(1500)).toBe("25:00");
  });

  it("timeToMinutes", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("23:59")).toBe(1439);
  });
});
