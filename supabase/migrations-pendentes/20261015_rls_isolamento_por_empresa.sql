-- =============================================================================
-- RLS: isolamento por empresa e escrita por papel nas tabelas usadas pelo tai-web
-- =============================================================================
-- STATUS: PENDENTE. NAO APLICAR EM PRODUCAO SEM PASSAR PELO ROTEIRO DO LEIA-ME.md.
-- Testado num branch do Supabase em 2026-10-15: 30/30 checagens de API e telas OK (ver LEIA-ME, secao 0).
--
-- Conferido contra o banco em 2026-10-15 (so leitura): tipos das colunas, policies
-- atuais, constraints, triggers, jobs do pg_cron, valores de "Status"/"tipo" e logs.
--
-- O que este arquivo faz, em ordem:
--   0. Guarda uma copia de TODAS as policies atuais dessas tabelas (para o rollback).
--   1. Cria funcoes auxiliares (empresa e papel do usuario logado, so se ativo).
--   2. Faz o trigger de OEE geral rodar como dono (sem isso, editar maquina pelo app quebra).
--   3. Habilita RLS em cada tabela (sem FORCE: o dono da tabela continua passando).
--   4. Remove as policies abertas e as policies antigas com condicao destas tabelas.
--   5. Cria as novas policies, so para "authenticated".
--   Rollback comentado no final.
--
-- Papeis ("User".tipo): 'Master' | 'Admin' | 'Operator'; qualquer outro ('Cliente',
-- 'Vendedor'...) = visitante, so leitura (igual a tipoToRole() no app).
-- Quem NAO e afetado: role postgres (maquinas via Supavisor e jobs do pg_cron, todos
-- donos das tabelas) e service_role (Edge Function create-auth-user).
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0. Copia das policies atuais (base do rollback)
-- -----------------------------------------------------------------------------
create schema if not exists tai_private;
revoke all on schema tai_private from public, anon;

create table if not exists tai_private.rls_policies_backup (
  tablename  name   not null,
  policyname name   not null,
  permissive text   not null,
  roles      name[] not null,
  cmd        text   not null,
  qual       text,
  with_check text,
  saved_at   timestamptz not null default now(),
  primary key (tablename, policyname)
);
revoke all on tai_private.rls_policies_backup from public, anon, authenticated;
-- RLS ligado e nenhuma policy: ninguem alem do dono le ou grava (o Supabase avisa se ficar sem RLS).
alter table tai_private.rls_policies_backup enable row level security;

-- So grava na primeira execucao: rodar de novo nao sobrescreve o estado original.
insert into tai_private.rls_policies_backup (tablename, policyname, permissive, roles, cmd, qual, with_check)
select p.tablename, p.policyname, p.permissive, p.roles, p.cmd, p.qual, p.with_check
from pg_policies p
where p.schemaname = 'public'
  and p.tablename in ('Empresas', 'User', 'Sala', 'Maquinas', 'variables', 'dashboard_configs',
                      'Apontamentos', 'Ordem de serviço', 'Relatório', 'OEE geral')
on conflict (tablename, policyname) do nothing;

-- -----------------------------------------------------------------------------
-- 1. Funcoes auxiliares
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER: leem "User" sem passar pelas policies de "User" (evita recursao).
-- Devolvem NULL quando o usuario nao tem cadastro ou esta inativo; com NULL todas
-- as comparacoes abaixo falham, entao usuario inativo nao le nem grava nada.
--
-- Regra de "ativo" = a mesma do app (helpers.ts: statusToDomain): inativo so quando
-- Status for 'inativo', 'inactive' ou 'desativado'. NAO da para exigir Status = 'ativo':
-- em 15/10/2026, 17 dos 20 usuarios tinham Status vazio (''), inclusive todos os Admins.

create or replace function tai_private.is_active_status(status text)
returns boolean
language sql immutable
set search_path = ''
as $$ select coalesce(lower(trim(status)), '') not in ('inativo', 'inactive', 'desativado') $$;

create or replace function tai_private.user_company()
returns uuid
language sql stable security definer
set search_path = ''
as $$
  select u."idEmpresa"
  from public."User" u
  where u."idRef" = (select auth.uid())
    and tai_private.is_active_status(u."Status")
$$;

create or replace function tai_private.user_role()
returns text
language sql stable security definer
set search_path = ''
as $$
  select u.tipo
  from public."User" u
  where u."idRef" = (select auth.uid())
    and tai_private.is_active_status(u."Status")
$$;

create or replace function tai_private.is_master()
returns boolean language sql stable set search_path = ''
as $$ select coalesce(tai_private.user_role() = 'Master', false) $$;

-- Master e Admin: gerenciam a empresa (acessos, logo, maquinas, cards).
create or replace function tai_private.is_manager()
returns boolean language sql stable set search_path = ''
as $$ select coalesce(tai_private.user_role() in ('Master', 'Admin'), false) $$;

-- Master, Admin e Operador: lancam apontamentos e O.S.
create or replace function tai_private.is_writer()
returns boolean language sql stable set search_path = ''
as $$ select coalesce(tai_private.user_role() in ('Master', 'Admin', 'Operator'), false) $$;

grant usage on schema tai_private to authenticated;
revoke execute on all functions in schema tai_private from public, anon;
grant execute on all functions in schema tai_private to authenticated;

-- Nas policies, as funcoes vao dentro de "(select ...)": o Postgres calcula uma vez
-- por consulta em vez de uma vez por linha ("Relatório" tem ~18 mil linhas).

-- -----------------------------------------------------------------------------
-- 2. Trigger de OEE geral roda como dono
-- -----------------------------------------------------------------------------
-- Todo UPDATE em "Maquinas" dispara tg_atualiza_oee -> atualizar_oee_geral() ->
-- calcular_oee_geral(), que apaga e reinsere "OEE geral" de TODAS as empresas.
-- Hoje a funcao e SECURITY INVOKER: roda como o usuario do app. Com as policies
-- novas (sem escrita em "OEE geral" para authenticated) o INSERT seria barrado e o
-- UPDATE inteiro da maquina falharia (editar maquina, registrar perda no dashboard).
-- SECURITY DEFINER (dono = postgres) mantem exatamente o comportamento atual.
-- pg_temp por ultimo: calcular_oee_geral() cria uma tabela temporaria.
alter function public.atualizar_oee_geral() security definer;
alter function public.atualizar_oee_geral() set search_path = public, pg_temp;
-- (Funcao de trigger: nao pode ser chamada via /rpc, entao os grants de EXECUTE ficam como estao.)

-- -----------------------------------------------------------------------------
-- 3. RLS ligado em todas as tabelas (sem FORCE)
-- -----------------------------------------------------------------------------
-- NAO usar FORCE ROW LEVEL SECURITY: maquinas e jobs gravam como postgres (dono das
-- tabelas) e o FORCE passaria a bloquea-los.
alter table public."Empresas"         enable row level security;
alter table public."User"             enable row level security;
alter table public."Sala"             enable row level security;
alter table public."Maquinas"         enable row level security;
alter table public.variables          enable row level security;
alter table public.dashboard_configs  enable row level security;
alter table public."Apontamentos"     enable row level security;
alter table public."Ordem de serviço" enable row level security;
alter table public."Relatório"        enable row level security;
alter table public."OEE geral"        enable row level security;

-- -----------------------------------------------------------------------------
-- 4. Remove as policies atuais destas tabelas
-- -----------------------------------------------------------------------------
-- Estado visto em 15/10/2026:
--   abertas (true): Apontamentos "Apontamento ", Empresas "all", Maquinas "Geral",
--     "OEE geral" "all", "Ordem de serviço" "geral", "Relatório" "Relatório", Sala "Geral",
--     User "Geral", dashboard_configs "allow all", variables "authenticated full access".
--   com condicao, tambem removidas (substituidas pelas tai_* abaixo):
--     dashboard_configs "Admin write access" (Admin da empresa OU nomeUser = 'Master',
--       sem checar Status), dashboard_configs "Empresa read access" (qualquer usuario da
--       empresa, sem checar Status), variables "master full access" (uid fixo do Master).
--   Policies permissivas valem em OR: deixar qualquer uma delas reabriria acesso.
do $$
declare
  r record;
begin
  for r in
    select p.policyname, p.tablename
    from pg_policies p
    where p.schemaname = 'public'
      and p.tablename in ('Empresas', 'User', 'Sala', 'Maquinas', 'variables', 'dashboard_configs',
                          'Apontamentos', 'Ordem de serviço', 'Relatório', 'OEE geral')
      and p.policyname not like 'tai\_%'
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
    raise notice 'Removida policy: %.%', r.tablename, r.policyname;
  end loop;
end
$$;

-- -----------------------------------------------------------------------------
-- 5. Novas policies (todas com prefixo tai_, todas para authenticated)
-- -----------------------------------------------------------------------------
-- Colunas de empresa ("idEmpresa", "idRef", id_empresa) e "User"."idRef" sao uuid.

-- ---------- Empresas ----------
drop policy if exists tai_empresas_select on public."Empresas";
create policy tai_empresas_select on public."Empresas"
  for select to authenticated
  using ((select tai_private.is_master()) or "idEmpresa" = (select tai_private.user_company()));

drop policy if exists tai_empresas_insert on public."Empresas";
create policy tai_empresas_insert on public."Empresas"
  for insert to authenticated
  with check ((select tai_private.is_master()));

-- Admin troca o logo da propria empresa; Master edita qualquer uma.
drop policy if exists tai_empresas_update on public."Empresas";
create policy tai_empresas_update on public."Empresas"
  for update to authenticated
  using ((select tai_private.is_master()) or ((select tai_private.is_manager()) and "idEmpresa" = (select tai_private.user_company())))
  with check ((select tai_private.is_master()) or ((select tai_private.is_manager()) and "idEmpresa" = (select tai_private.user_company())));

drop policy if exists tai_empresas_delete on public."Empresas";
create policy tai_empresas_delete on public."Empresas"
  for delete to authenticated
  using ((select tai_private.is_master()));

-- ---------- User ----------
-- A propria linha e sempre legivel (mesmo inativa) para o login mostrar "usuario desativado".
drop policy if exists tai_user_select on public."User";
create policy tai_user_select on public."User"
  for select to authenticated
  using (
    "idRef" = (select auth.uid())
    or (select tai_private.is_master())
    or "idEmpresa" = (select tai_private.user_company())
  );

-- Admin so cria/edita/remove acessos da propria empresa e nunca mexe em Master
-- (nem promove alguem a Master): espelha assignableRoles() em domain/permissions.ts.
drop policy if exists tai_user_insert on public."User";
create policy tai_user_insert on public."User"
  for insert to authenticated
  with check (
    (select tai_private.is_master())
    or ((select tai_private.is_manager()) and "idEmpresa" = (select tai_private.user_company()) and coalesce(tipo, '') <> 'Master')
  );

drop policy if exists tai_user_update on public."User";
create policy tai_user_update on public."User"
  for update to authenticated
  using (
    (select tai_private.is_master())
    or ((select tai_private.is_manager()) and "idEmpresa" = (select tai_private.user_company()) and coalesce(tipo, '') <> 'Master')
  )
  with check (
    (select tai_private.is_master())
    or ((select tai_private.is_manager()) and "idEmpresa" = (select tai_private.user_company()) and coalesce(tipo, '') <> 'Master')
  );

drop policy if exists tai_user_delete on public."User";
create policy tai_user_delete on public."User"
  for delete to authenticated
  using (
    (select tai_private.is_master())
    or ((select tai_private.is_manager()) and "idEmpresa" = (select tai_private.user_company()) and coalesce(tipo, '') <> 'Master')
  );

-- ---------- Sala (setores) ----------
-- No app, setores so sao criados/renomeados/excluidos no Painel Master.
-- (Sala.sala e UNIQUE global; renomear propaga para Maquinas.IDsala via ON UPDATE CASCADE
-- e excluir apaga as maquinas do setor via ON DELETE CASCADE. Acoes de FK nao passam por RLS.)
drop policy if exists tai_sala_select on public."Sala";
create policy tai_sala_select on public."Sala"
  for select to authenticated
  using ((select tai_private.is_master()) or "idRef" = (select tai_private.user_company()));

drop policy if exists tai_sala_insert on public."Sala";
create policy tai_sala_insert on public."Sala"
  for insert to authenticated
  with check ((select tai_private.is_master()));

drop policy if exists tai_sala_update on public."Sala";
create policy tai_sala_update on public."Sala"
  for update to authenticated
  using ((select tai_private.is_master()))
  with check ((select tai_private.is_master()));

drop policy if exists tai_sala_delete on public."Sala";
create policy tai_sala_delete on public."Sala"
  for delete to authenticated
  using ((select tai_private.is_master()));

-- ---------- Maquinas ----------
-- Criar/excluir: so Painel Master. Atualizar: Admin (nome, setor, config de producao)
-- e TAMBEM Operador, porque o registro de perda no drilldown do dashboard grava as
-- colunas de OEE (machine.repository.supabase.ts: registerMachineLoss). Os triggers
-- trg_atualizar_* de Maquinas fazem UPDATE na propria linha como o usuario do app,
-- e tambem passam por esta policy.
-- RLS nao restringe coluna: o Operador consegue alterar qualquer coluna da maquina
-- da propria empresa. Ver "Proximos passos" no LEIA-ME (RPC para registrar perda).
drop policy if exists tai_maquinas_select on public."Maquinas";
create policy tai_maquinas_select on public."Maquinas"
  for select to authenticated
  using ((select tai_private.is_master()) or "idRef" = (select tai_private.user_company()));

drop policy if exists tai_maquinas_insert on public."Maquinas";
create policy tai_maquinas_insert on public."Maquinas"
  for insert to authenticated
  with check ((select tai_private.is_master()));

drop policy if exists tai_maquinas_update on public."Maquinas";
create policy tai_maquinas_update on public."Maquinas"
  for update to authenticated
  using ((select tai_private.is_master()) or ((select tai_private.is_writer()) and "idRef" = (select tai_private.user_company())))
  with check ((select tai_private.is_master()) or ((select tai_private.is_writer()) and "idRef" = (select tai_private.user_company())));

drop policy if exists tai_maquinas_delete on public."Maquinas";
create policy tai_maquinas_delete on public."Maquinas"
  for delete to authenticated
  using ((select tai_private.is_master()));

-- ---------- variables (variaveis complementares das maquinas) ----------
-- Nao tem coluna de empresa: herda da maquina (maquina_id -> Maquinas.id).
drop policy if exists tai_variables_select on public.variables;
create policy tai_variables_select on public.variables
  for select to authenticated
  using (
    (select tai_private.is_master())
    or exists (
      select 1 from public."Maquinas" m
      where m.id = variables.maquina_id and m."idRef" = (select tai_private.user_company())
    )
  );

drop policy if exists tai_variables_insert on public.variables;
create policy tai_variables_insert on public.variables
  for insert to authenticated
  with check (
    (select tai_private.is_master())
    or ((select tai_private.is_manager()) and exists (
      select 1 from public."Maquinas" m
      where m.id = variables.maquina_id and m."idRef" = (select tai_private.user_company())
    ))
  );

drop policy if exists tai_variables_update on public.variables;
create policy tai_variables_update on public.variables
  for update to authenticated
  using (
    (select tai_private.is_master())
    or ((select tai_private.is_manager()) and exists (
      select 1 from public."Maquinas" m
      where m.id = variables.maquina_id and m."idRef" = (select tai_private.user_company())
    ))
  )
  with check (
    (select tai_private.is_master())
    or ((select tai_private.is_manager()) and exists (
      select 1 from public."Maquinas" m
      where m.id = variables.maquina_id and m."idRef" = (select tai_private.user_company())
    ))
  );

drop policy if exists tai_variables_delete on public.variables;
create policy tai_variables_delete on public.variables
  for delete to authenticated
  using (
    (select tai_private.is_master())
    or ((select tai_private.is_manager()) and exists (
      select 1 from public."Maquinas" m
      where m.id = variables.maquina_id and m."idRef" = (select tai_private.user_company())
    ))
  );

-- ---------- dashboard_configs (configuracao dos cards) ----------
drop policy if exists tai_dashboard_configs_select on public.dashboard_configs;
create policy tai_dashboard_configs_select on public.dashboard_configs
  for select to authenticated
  using ((select tai_private.is_master()) or id_empresa = (select tai_private.user_company()));

drop policy if exists tai_dashboard_configs_insert on public.dashboard_configs;
create policy tai_dashboard_configs_insert on public.dashboard_configs
  for insert to authenticated
  with check ((select tai_private.is_master()) or ((select tai_private.is_manager()) and id_empresa = (select tai_private.user_company())));

drop policy if exists tai_dashboard_configs_update on public.dashboard_configs;
create policy tai_dashboard_configs_update on public.dashboard_configs
  for update to authenticated
  using ((select tai_private.is_master()) or ((select tai_private.is_manager()) and id_empresa = (select tai_private.user_company())))
  with check ((select tai_private.is_master()) or ((select tai_private.is_manager()) and id_empresa = (select tai_private.user_company())));
-- Sem DELETE: o app nunca apaga config de card (a FK apaga junto com a maquina/empresa).

-- ---------- Apontamentos ----------
drop policy if exists tai_apontamentos_select on public."Apontamentos";
create policy tai_apontamentos_select on public."Apontamentos"
  for select to authenticated
  using ((select tai_private.is_master()) or "idRef" = (select tai_private.user_company()));

drop policy if exists tai_apontamentos_insert on public."Apontamentos";
create policy tai_apontamentos_insert on public."Apontamentos"
  for insert to authenticated
  with check ((select tai_private.is_master()) or ((select tai_private.is_writer()) and "idRef" = (select tai_private.user_company())));

drop policy if exists tai_apontamentos_update on public."Apontamentos";
create policy tai_apontamentos_update on public."Apontamentos"
  for update to authenticated
  using ((select tai_private.is_master()) or ((select tai_private.is_writer()) and "idRef" = (select tai_private.user_company())))
  with check ((select tai_private.is_master()) or ((select tai_private.is_writer()) and "idRef" = (select tai_private.user_company())));

-- O tai-web hoje nao exclui apontamentos (useDeleteAppointment nao e usado).
-- Mantido para Master/Admin por cautela com o sistema legado. CONFERIR se o legado exclui.
drop policy if exists tai_apontamentos_delete on public."Apontamentos";
create policy tai_apontamentos_delete on public."Apontamentos"
  for delete to authenticated
  using ((select tai_private.is_master()) or ((select tai_private.is_manager()) and "idRef" = (select tai_private.user_company())));

-- ---------- Ordem de serviço ----------
drop policy if exists tai_ordem_servico_select on public."Ordem de serviço";
create policy tai_ordem_servico_select on public."Ordem de serviço"
  for select to authenticated
  using ((select tai_private.is_master()) or "idRef" = (select tai_private.user_company()));

drop policy if exists tai_ordem_servico_insert on public."Ordem de serviço";
create policy tai_ordem_servico_insert on public."Ordem de serviço"
  for insert to authenticated
  with check ((select tai_private.is_master()) or ((select tai_private.is_writer()) and "idRef" = (select tai_private.user_company())));

drop policy if exists tai_ordem_servico_update on public."Ordem de serviço";
create policy tai_ordem_servico_update on public."Ordem de serviço"
  for update to authenticated
  using ((select tai_private.is_master()) or ((select tai_private.is_writer()) and "idRef" = (select tai_private.user_company())))
  with check ((select tai_private.is_master()) or ((select tai_private.is_writer()) and "idRef" = (select tai_private.user_company())));

-- Mesmo caso dos apontamentos: o tai-web nao exclui O.S. CONFERIR se o legado exclui.
drop policy if exists tai_ordem_servico_delete on public."Ordem de serviço";
create policy tai_ordem_servico_delete on public."Ordem de serviço"
  for delete to authenticated
  using ((select tai_private.is_master()) or ((select tai_private.is_manager()) and "idRef" = (select tai_private.user_company())));

-- ---------- Relatório e OEE geral (so leitura pelo app) ----------
-- Gravados pelos jobs do pg_cron (copiar_dados_maquinas_para_relatorio, limpeza) e pelo
-- trigger de OEE geral (passo 2), todos como postgres: nao passam por RLS.
drop policy if exists tai_relatorio_select on public."Relatório";
create policy tai_relatorio_select on public."Relatório"
  for select to authenticated
  using ((select tai_private.is_master()) or "idRef" = (select tai_private.user_company()));

drop policy if exists tai_oee_geral_select on public."OEE geral";
create policy tai_oee_geral_select on public."OEE geral"
  for select to authenticated
  using ((select tai_private.is_master()) or "idRef" = (select tai_private.user_company()));

commit;


-- =============================================================================
-- ROLLBACK (comentado). Volta ao estado anterior a esta migracao:
-- remove as policies tai_*, recria exatamente as policies salvas no passo 0,
-- devolve atualizar_oee_geral() a SECURITY INVOKER e apaga as funcoes auxiliares.
-- O RLS continua ligado (ja estava antes em todas essas tabelas).
-- Para usar: descomentar o bloco inteiro e rodar como uma unica transacao.
-- =============================================================================
-- begin;
--
-- do $$
-- declare
--   r record;
--   roles_sql text;
-- begin
--   -- 1. Remove as policies criadas por esta migracao.
--   for r in
--     select p.policyname, p.tablename
--     from pg_policies p
--     where p.schemaname = 'public' and p.policyname like 'tai\_%'
--   loop
--     execute format('drop policy %I on public.%I', r.policyname, r.tablename);
--   end loop;
--
--   -- 2. Recria as policies originais a partir da copia (as que ainda nao existirem).
--   for r in
--     select b.*
--     from tai_private.rls_policies_backup b
--     where not exists (
--       select 1 from pg_policies p
--       where p.schemaname = 'public' and p.tablename = b.tablename and p.policyname = b.policyname
--     )
--   loop
--     -- PUBLIC e palavra-chave: nao pode ir entre aspas.
--     select string_agg(case when role_name = 'public' then 'public' else quote_ident(role_name) end, ', ')
--       into roles_sql
--     from unnest(r.roles) as role_name;
--
--     execute format(
--       'create policy %I on public.%I as %s for %s to %s%s%s',
--       r.policyname, r.tablename, r.permissive, r.cmd, roles_sql,
--       case when r.qual is not null then ' using (' || r.qual || ')' else '' end,
--       case when r.with_check is not null then ' with check (' || r.with_check || ')' else '' end
--     );
--   end loop;
-- end
-- $$;
--
-- -- 3. Trigger de OEE geral volta a rodar como o usuario (estado original).
-- alter function public.atualizar_oee_geral() security invoker;
-- alter function public.atualizar_oee_geral() reset search_path;
--
-- -- 4. Funcoes auxiliares.
-- drop function if exists tai_private.is_writer();
-- drop function if exists tai_private.is_manager();
-- drop function if exists tai_private.is_master();
-- drop function if exists tai_private.user_role();
-- drop function if exists tai_private.user_company();
-- drop function if exists tai_private.is_active_status(text);
--
-- -- Mantenha a copia ate confirmar que o rollback deu certo; depois:
-- -- drop table tai_private.rls_policies_backup;
-- -- drop schema tai_private;
--
-- commit;
