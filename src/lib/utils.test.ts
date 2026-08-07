import { describe, expect, it } from "vitest";
import { cn, initials, uid } from "@/lib/utils";

describe("cn", () => {
  it("mescla classes e resolve conflitos do Tailwind", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("initials", () => {
  it("gera iniciais a partir do nome completo", () => {
    expect(initials("Rafael Meni")).toBe("RM");
  });

  it("gera iniciais para nome unico", () => {
    expect(initials("Administrador")).toBe("A");
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
