/**
 * O que cada perfil pode fazer. Independente de React/navegador.
 * Compartilhavel com o futuro app React Native.
 *
 * - Master/Admin: tudo dentro da empresa (acessos, logo, configuracao de cards e maquinas).
 * - Operador: lanca e edita apontamentos e O.S.
 * - Visitante: so consulta.
 *
 * Isto so esconde acoes na tela; quem garante de verdade sao as policies do banco.
 */
import { UserRole } from "@/domain/types/enums";

const MANAGERS: readonly UserRole[] = [UserRole.MASTER, UserRole.ADMIN];
const WRITERS: readonly UserRole[] = [...MANAGERS, UserRole.OPERATOR];

/** Criar e editar apontamentos e ordens de servico. */
export function canWriteRecords(role: UserRole | undefined): boolean {
  return !!role && WRITERS.includes(role);
}

/** Gerenciar acessos, perfil da empresa, maquinas e configuracao dos cards. */
export function canManageCompany(role: UserRole | undefined): boolean {
  return !!role && MANAGERS.includes(role);
}

/** Perfis que um usuario pode atribuir ao criar um acesso. So Master cria outro Master. */
export function assignableRoles(role: UserRole | undefined): UserRole[] {
  if (role === UserRole.MASTER) return [UserRole.MASTER, UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER];
  if (role === UserRole.ADMIN) return [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER];
  return [];
}
