import type { User } from "@/domain/entities/user";
import { UserRole, UserStatus } from "@/domain/types/enums";
import { initials } from "@/lib/utils";

function u(
  id: string,
  companyId: string,
  name: string,
  email: string,
  role: UserRole,
  status: UserStatus = UserStatus.ACTIVE,
): User {
  return {
    id,
    companyId,
    name,
    email,
    role,
    status,
    avatarInitials: initials(name),
    createdAt: "2024-03-01T10:00:00.000Z",
  };
}

export const seedUsers: User[] = [
  u("user_master", "company_tai", "Administrador Master", "app@taiproject.com.br", UserRole.MASTER),
  u("user_alexsandro", "company_tai", "Alexsandro Graciano", "alexandro.g@taiproject.com", UserRole.OPERATOR),
  u("user_rafa", "company_tai", "Rafa", "rafael.meni@gmail.com", UserRole.VIEWER),
  u("user_operador", "company_tai", "Operador", "operador@teste.com.br", UserRole.OPERATOR),
  u("user_vendedor", "company_tai", "Vendedor", "vendedor@teste.com.br", UserRole.VIEWER),
  u("user_elder", "company_tai", "Elder Vendedor", "eldervendedor@teste.com", UserRole.VIEWER),
  u("user_walace", "company_tai", "Walace Borges", "engsegtrabalhopmw@gmail.com", UserRole.OPERATOR),
  u("user_alunos", "company_tai", "Alunos", "alunos@smarttai.com.br", UserRole.OPERATOR, UserStatus.INACTIVE),
  u("user_visitante", "company_tai", "Visitante", "visitante@smarttai.com.br", UserRole.VIEWER),
  u("user_rodrigo", "company_tai", "Rodrigo Carvalho", "rodrigo.carvalho@taiproject.com.br", UserRole.OPERATOR),
  u("user_wesley", "company_tai", "Wesley Oliveira", "wesley.oliveira@taiproject.com.br", UserRole.OPERATOR),
  u("user_jose", "company_tai", "Jose Alves", "jose.alves@taiproject.com.br", UserRole.OPERATOR),
  u("user_renata", "company_tai", "Renata Souza", "renata.souza@taiproject.com.br", UserRole.OPERATOR),
  u("user_admin_smh", "company_solidaire_smh", "Admin Solidaire SMH", "admin@solidaire-smh.com.br", UserRole.ADMIN),
];

export const DEMO_PASSWORD = "demo123";
