import { describe, expect, it } from "vitest";
import { UserRole } from "@/domain/types/enums";
import { assignableRoles, canManageCompany, canWriteRecords } from "@/domain/permissions";

describe("permissions", () => {
  it("so Master, Admin e Operador lancam registros", () => {
    expect(canWriteRecords(UserRole.MASTER)).toBe(true);
    expect(canWriteRecords(UserRole.ADMIN)).toBe(true);
    expect(canWriteRecords(UserRole.OPERATOR)).toBe(true);
    expect(canWriteRecords(UserRole.VIEWER)).toBe(false);
    expect(canWriteRecords(undefined)).toBe(false);
  });

  it("so Master e Admin gerenciam a empresa", () => {
    expect(canManageCompany(UserRole.MASTER)).toBe(true);
    expect(canManageCompany(UserRole.ADMIN)).toBe(true);
    expect(canManageCompany(UserRole.OPERATOR)).toBe(false);
    expect(canManageCompany(UserRole.VIEWER)).toBe(false);
  });

  it("Admin nao consegue criar Master", () => {
    expect(assignableRoles(UserRole.ADMIN)).not.toContain(UserRole.MASTER);
    expect(assignableRoles(UserRole.MASTER)).toContain(UserRole.MASTER);
    expect(assignableRoles(UserRole.OPERATOR)).toEqual([]);
  });
});
