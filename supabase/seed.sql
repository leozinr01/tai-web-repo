-- =============================================================================
-- Dados de teste para um branch do Supabase (NUNCA para producao)
-- =============================================================================
-- Rodar DEPOIS dos arquivos de supabase/migrations/, num banco vazio.
-- Trava: o script aborta se ja existir alguma empresa (ex.: se for rodado em producao).
--
-- Cria 2 empresas ficticias e, para cada uma, setores, maquinas, variaveis, configs de
-- card, apontamentos, O.S., relatorios (ultimas 72h, de hora em hora) e OEE geral.
-- Usuarios (todos com a senha  Teste@123 ), reproduzindo producao: a maioria com
-- Status vazio ('') e um tipo fora dos papeis do app (Vendedor).
--
--   | e-mail                     | tipo     | Status   | empresa |
--   |----------------------------|----------|----------|---------|
--   | master@teste.tai           | Master   | ativo    | A       |
--   | admin-a@teste.tai          | Admin    | ''       | A       |
--   | operador-a@teste.tai       | Operator | ''       | A       |
--   | vendedor-a@teste.tai       | Vendedor | ''       | A       |
--   | cliente-a@teste.tai        | Cliente  | ''       | A       |
--   | inativo-a@teste.tai        | Operator | inativo  | A       |
--   | admin-b@teste.tai          | Admin    | ''       | B       |
--   | operador-b@teste.tai       | Operator | ativo    | B       |
--
-- Sala.sala e UNIQUE no banco inteiro: duas empresas nao podem ter setor com o mesmo
-- nome, por isso os setores tem sufixo da empresa.
-- Nenhuma variavel tem min/max e nao ha alert_contacts: o job checar-variaveis nao gera
-- alertas (e o webhook do Make nem existe no esquema inicial).
-- =============================================================================

begin;

do $$
begin
  if exists (select 1 from public."Empresas") then
    raise exception 'seed.sql abortado: ja existem empresas neste banco. Este script e so para branch de teste vazio.';
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- Usuarios do Auth (senha Teste@123) e identidades de e-mail
-- -----------------------------------------------------------------------------
with novos(id, email) as (
  values
    ('a0000000-0000-4000-8000-000000000001'::uuid, 'master@teste.tai'),
    ('a0000000-0000-4000-8000-000000000002'::uuid, 'admin-a@teste.tai'),
    ('a0000000-0000-4000-8000-000000000003'::uuid, 'operador-a@teste.tai'),
    ('a0000000-0000-4000-8000-000000000004'::uuid, 'vendedor-a@teste.tai'),
    ('a0000000-0000-4000-8000-000000000005'::uuid, 'cliente-a@teste.tai'),
    ('a0000000-0000-4000-8000-000000000006'::uuid, 'inativo-a@teste.tai'),
    ('b0000000-0000-4000-8000-000000000001'::uuid, 'admin-b@teste.tai'),
    ('b0000000-0000-4000-8000-000000000002'::uuid, 'operador-b@teste.tai')
),
usuarios as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  select
    '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
    extensions.crypt('Teste@123', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(),
    '', '', '', ''
  from novos
  returning id, email
)
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text,
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       'email', now(), now(), now()
from usuarios;

-- -----------------------------------------------------------------------------
-- Empresas (assinatura 'ativa': o job "Transfere Dados" so copia maquinas de empresa ativa)
-- -----------------------------------------------------------------------------
insert into public."Empresas" ("idEmpresa", nome, cnpj, estado, cidade, responsavel, telefone, assinatura) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Empresa Teste A', '00.000.000/0001-01', 'SP', 'São Paulo', 'Responsável A', '(11) 90000-0001', 'ativa'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Empresa Teste B', '00.000.000/0001-02', 'RJ', 'Rio de Janeiro', 'Responsável B', '(21) 90000-0002', 'ativa');

-- -----------------------------------------------------------------------------
-- Cadastro dos usuarios no painel
-- -----------------------------------------------------------------------------
insert into public."User" ("idRef", email, "nomeUser", tipo, "Status", "idEmpresa") values
  ('a0000000-0000-4000-8000-000000000001', 'master@teste.tai',     'Master Teste',     'Master',   'ativo',   'aaaaaaaa-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000002', 'admin-a@teste.tai',    'Admin A',          'Admin',    '',        'aaaaaaaa-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000003', 'operador-a@teste.tai', 'Operador A',       'Operator', '',        'aaaaaaaa-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000004', 'vendedor-a@teste.tai', 'Vendedor A',       'Vendedor', '',        'aaaaaaaa-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000005', 'cliente-a@teste.tai',  'Cliente A',        'Cliente',  '',        'aaaaaaaa-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000006', 'inativo-a@teste.tai',  'Operador Inativo', 'Operator', 'inativo', 'aaaaaaaa-0000-4000-8000-000000000001'),
  ('b0000000-0000-4000-8000-000000000001', 'admin-b@teste.tai',    'Admin B',          'Admin',    '',        'bbbbbbbb-0000-4000-8000-000000000002'),
  ('b0000000-0000-4000-8000-000000000002', 'operador-b@teste.tai', 'Operador B',       'Operator', 'ativo',   'bbbbbbbb-0000-4000-8000-000000000002');

-- -----------------------------------------------------------------------------
-- Setores
-- -----------------------------------------------------------------------------
insert into public."Sala" (sala, "idRef") values
  ('Produção A',  'aaaaaaaa-0000-4000-8000-000000000001'),
  ('Embalagem A', 'aaaaaaaa-0000-4000-8000-000000000001'),
  ('Produção B',  'bbbbbbbb-0000-4000-8000-000000000002'),
  ('Embalagem B', 'bbbbbbbb-0000-4000-8000-000000000002');

-- -----------------------------------------------------------------------------
-- Maquinas (2 por empresa)
-- -----------------------------------------------------------------------------
insert into public."Maquinas" (
  "IDsala", maquina, "idRef", producao, parado, emergencia, horimetro,
  "Temperatura", "Vibração", "VelocidadeAtual", "ProdAtual", "unidProducao",
  "OEE", "OEE_disponibilidade", "OEE_produtividade", "OEE_qualidade",
  "OEE_disp_quebra_falhas", turno, "OEE_Config_horas_Prod_prog", "Tempo_produtivo"
) values
  ('Produção A',  'Extrusora A1',  'aaaaaaaa-0000-4000-8000-000000000001', true,  false, false, 1200, 32.5, 0.42, 12, 850, 'm',  0.8108, 0.9000, 0.9500, 0.9483, '00:48', '08:00', '08:00', 432),
  ('Embalagem A', 'Seladora A2',   'aaaaaaaa-0000-4000-8000-000000000001', false, true,  false,  640, 24.0, 0.18,  0,   0, 'un', 0.6200, 0.7000, 0.9000, 0.9841, '02:24', '08:00', '08:00', 336),
  ('Produção B',  'Extrusora B1',  'bbbbbbbb-0000-4000-8000-000000000002', true,  false, false, 2300, 45.1, 0.61, 15, 990, 'm',  0.7400, 0.8500, 0.9000, 0.9673, '01:12', '08:00', '08:00', 408),
  ('Embalagem B', 'Rotuladora B2', 'bbbbbbbb-0000-4000-8000-000000000002', false, false, true,   410, 28.3, 0.25,  0,   0, 'un', 0.5000, 0.6000, 0.9000, 0.9259, '03:12', '08:00', '08:00', 288);

-- Variaveis complementares (sem min/max: nao disparam alertas)
insert into public.variables (maquina_id, name, type, grandeza, number_value, level)
select m.id, v.name, v.type, v.grandeza, v.valor, 'branca'
from public."Maquinas" m
join (values
  ('Extrusora A1',  'Pressão',  'float', 'bar', 6.2),
  ('Extrusora A1',  'Rotação',  'int',   'rpm', 1450),
  ('Seladora A2',   'Pressão',  'float', 'bar', 4.1),
  ('Extrusora B1',  'Pressão',  'float', 'bar', 7.8),
  ('Rotuladora B2', 'Etiquetas','int',   'un',  3200)
) as v(maquina, name, type, grandeza, valor) on v.maquina = m.maquina;

-- Config dos cards (uma por maquina, da empresa dona)
insert into public.dashboard_configs (id_empresa, maquina_id)
select "idRef", id from public."Maquinas";

-- -----------------------------------------------------------------------------
-- Apontamentos (datas como texto dd/mm/aaaa, como no banco real)
-- -----------------------------------------------------------------------------
insert into public."Apontamentos" ("idMaquina", data_lancamento, hora_lancamento, "lançador", apontamento, "idRef", tempo_parada, "OEE", "seguimento_OEE", "Setor", concluido_em)
values
  ('Extrusora A1',  to_char(current_date - 2, 'DD/MM/YYYY'), '08:30', 'Operador A', 'Troca de matriz',            'aaaaaaaa-0000-4000-8000-000000000001', '00:48', 'Disponibilidade', 'Setup',             'Produção A',  now() - interval '1 day'),
  ('Seladora A2',   to_char(current_date - 1, 'DD/MM/YYYY'), '10:15', 'Operador A', 'Falha no sensor de selagem', 'aaaaaaaa-0000-4000-8000-000000000001', '02:24', 'Disponibilidade', 'Quebras e falhas',  'Embalagem A', null),
  ('Extrusora A1',  to_char(current_date,     'DD/MM/YYYY'), '14:00', 'Admin A',    'Material fora do padrão',    'aaaaaaaa-0000-4000-8000-000000000001', '00:20', 'Qualidade',       'Refugo',            'Produção A',  null),
  ('Extrusora B1',  to_char(current_date - 1, 'DD/MM/YYYY'), '09:00', 'Operador B', 'Queda de velocidade na linha','bbbbbbbb-0000-4000-8000-000000000002', '01:12', 'Produtividade',   'Queda de velocidade','Produção B',  null),
  ('Rotuladora B2', to_char(current_date,     'DD/MM/YYYY'), '07:45', 'Admin B',    'Botão de emergência acionado','bbbbbbbb-0000-4000-8000-000000000002', '03:12', 'Disponibilidade', 'Quebras e falhas',  'Embalagem B', null);

-- -----------------------------------------------------------------------------
-- Ordens de servico
-- -----------------------------------------------------------------------------
insert into public."Ordem de serviço" ("idRef", "idMaquina", "numOrdem", data, servico, periodicidade, status, "Executor", "data execucao", setor, proxima_execucao)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Extrusora A1',  1001, current_date + 3, 'Lubrificação dos rolamentos', 'Semanal', 'Lançado',   'Operador A', to_char(current_date + 3, 'DD/MM/YYYY'), 'Produção A',  to_char(current_date + 3, 'YYYY-MM-DD')),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Seladora A2',   1002, current_date - 2, 'Troca da resistência',        'Mensal',  'Atrasado',  'Operador A', to_char(current_date - 2, 'DD/MM/YYYY'), 'Embalagem A', to_char(current_date - 2, 'YYYY-MM-DD')),
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Extrusora A1',  1003, current_date - 7, 'Inspeção geral',              'Mensal',  'Realizado', 'Admin A',    to_char(current_date - 7, 'DD/MM/YYYY'), 'Produção A',  to_char(current_date - 7, 'YYYY-MM-DD')),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Extrusora B1',  2001, current_date + 1, 'Limpeza do cabeçote',         'Diária',  'Lançado',   'Operador B', to_char(current_date + 1, 'DD/MM/YYYY'), 'Produção B',  to_char(current_date + 1, 'YYYY-MM-DD')),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Rotuladora B2', 2002, current_date - 1, 'Revisão do botão de emergência','Trimestral','Atrasado','Admin B',    to_char(current_date - 1, 'DD/MM/YYYY'), 'Embalagem B', to_char(current_date - 1, 'YYYY-MM-DD'));

-- -----------------------------------------------------------------------------
-- Relatorio: uma linha por maquina por hora nas ultimas 72h (como o job "Transfere Dados")
-- -----------------------------------------------------------------------------
insert into public."Relatório" (created_at, "idRef", "IDsala", maquina, maquina_id, "OEE", "OEE_disponibilidade", "OEE_produtividade", "OEE_qualidade", status_maquina, date, hora, variables)
select
  h.momento,
  m."idRef", m."IDsala", m.maquina, m.id,
  round((m."OEE" + (random() - 0.5) * 0.1)::numeric, 4),
  m."OEE_disponibilidade", m."OEE_produtividade", m."OEE_qualidade",
  case when m.producao then 'Produção' when m.emergencia then 'Emergência' else 'Parado' end,
  (h.momento at time zone 'America/Sao_Paulo')::date,
  to_char(h.momento at time zone 'America/Sao_Paulo', 'HH24:MI'),
  jsonb_build_object(
    'Horímetro (h)',    (m.horimetro - (72 - h.n))::text,
    'Vibração (mm/s)',  round((m."Vibração" + (random() - 0.5) * 0.1)::numeric, 2)::text,
    'Temperatura (°C)', round((m."Temperatura" + (random() - 0.5) * 2)::numeric, 2)::text,
    'Produção (m)',     (m."ProdAtual" * h.n / 72)::text
  )
from public."Maquinas" m
cross join lateral (
  select n, date_trunc('hour', now()) - make_interval(hours => 72 - n) as momento
  from generate_series(1, 72) as n
) h;

-- -----------------------------------------------------------------------------
-- OEE geral: 7 leituras diarias por empresa (o dashboard mostra as ultimas 7)
-- -----------------------------------------------------------------------------
insert into public."OEE geral" (created_at, "idRef", "OEE", "Disponibilidade", "Produtividade", "Qualidade", "Tempo_produtivo")
select now() - make_interval(days => d), e."idEmpresa",
       round((base + (random() - 0.5) * 0.08)::numeric, 4), 0.85, 0.92, 0.96, 400
from public."Empresas" e
cross join generate_series(0, 6) as d
cross join lateral (select case when e.nome like '%A' then 0.72 else 0.62 end as base) b;

commit;
