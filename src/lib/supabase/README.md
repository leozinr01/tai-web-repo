# Integração Supabase (projeto "TAI")

O `tai-web` agora fala com o banco real (`nmoyvzglbzamguzapoag`), o mesmo já
usado pelo app mobile. Não foi criada nenhuma tabela, coluna, policy ou
função nova — os adaptadores só leem/escrevem no schema legado que já existia.

## O que já está ligado ao Supabase

- **auth** — login via Supabase Auth (`signInWithPassword`), sessão validada
  com `getUser()` antes de considerar o usuário autenticado.
- **companies** — `Empresas` (list/getById/create/update/remove/updateLogo).
- **users** — `User` (list/update/setStatus). `create` ainda não está
  implementado — ver "Pendências" abaixo.
- **sectors** — `Sala`.
- **machines** — `Maquinas`.
- **indicators** — média atual das `Maquinas` da empresa + histórico dos
  últimos 7 dias com dados reais vindos de `Relatório`.

`appointments`, `workOrders` e `reports` continuam mockados por enquanto
(próxima etapa).

## Decisões de mapeamento (schema legado → domínio)

- `Company.status`: `Empresas` não tem coluna de status hoje — todo mundo
  aparece como `active`. Se quiser ativar/desativar empresa, precisa de uma
  coluna nova (mudança de schema, não fiz sem combinar antes).
- `Company.email`: `Empresas` não tem coluna de e-mail (`responsavel` é o
  *nome* de um contato, não e-mail). Hoje esse campo fica vazio ao ler e é
  ignorado ao criar/editar. Precisa decidir: criar uma coluna, ou remover
  esse campo do formulário do painel.
- `User.role` (`tipo` no banco): os valores reais encontrados são `Master`,
  `Admin`, `Operator`, `Cliente` e `Vendedor` — mais do que os 4 papéis do
  enum atual (`master/admin/operator/viewer`). Mapeei `Cliente` e `Vendedor`
  para `viewer` como aproximação. Se `Vendedor` precisar de permissões
  próprias no painel, o enum `UserRole` precisa crescer.
- `User.status`: a coluna `Status` está vazia (`''`) em 17 dos 18 usuários
  atuais. Tratei "vazio" como `active` (só fica `inactive` se o valor for
  literalmente `"inativo"|"inactive"`), porque tratar vazio como inativo
  bloquearia quase todo mundo.
- `WorkOrder.status`: mapeado a partir dos textos reais (`Lançado`,
  `Atrasado`, `Concluído`, `Realizado` → completed).

## Pendências que exigem uma decisão sua

1. **Criar usuário (`UserRepository.create`)** lança erro explicando que
   falta uma Edge Function com service role para criar a conta em
   `auth.users` — a chave anônima do frontend não tem permissão pra isso.
   Não criei a function porque seria uma alteração no projeto.
2. **RLS/grants abertos** (`USING (true)` + grants completos para `anon`
   em quase todas as tabelas) — combinamos não mexer por enquanto. O painel
   web herda essa mesma exposição que o app mobile já tem hoje.
3. **Company.email / Company.status** — decidir se cria coluna nova ou
   ajusta o formulário do painel.

## Variáveis de ambiente

`.env.local` já vem preenchido com a URL e a chave publicável (anon) do
projeto "TAI" para rodar localmente. `.env.example` é o template sem a
chave, para versionar no repositório.
