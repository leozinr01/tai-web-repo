import { describe, expect, it } from "vitest";
import { cn, formatDate, initials, uid } from "@/lib/utils";

describe("formatDate", () => {
  it("formata data ISO no padrao brasileiro", () => {
    expect(formatDate("2026-09-30")).toBe("30/09/2026");
    expect(formatDate("2026-09-30T09:05:00", "HH:mm")).toBe("09:05");
  });

  it("nao quebra com data vazia ou invalida", () => {
    expect(formatDate("")).toBe("-");
    expect(formatDate(null)).toBe("-");
    expect(formatDate("30/09/2026")).toBe("-");
    expect(formatDate("lixo")).toBe("-");
  });
});

describe("cn", () => {
  it("mescla classes e resolve conflitos do Tailwind", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("initials", () => {
  it("gera iniciais a partir das duas primeiras letras do nome", () => {
    expect(initials("Rafael Meni")).toBe("RA");
  });

  it("gera iniciais para nome unico", () => {
    expect(initials("Administrador")).toBe("AD");
  });
});

describe("uid", () => {
  it("gera identificadores unicos com prefixo", () => {
    const a = uid("test");
    const b = uid("test");
    expect(a).not.toBe(b);
    expect(a.startsWith("test_")).toBe(true);
  });
});
