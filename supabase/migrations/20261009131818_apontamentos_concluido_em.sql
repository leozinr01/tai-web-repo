-- Ja aplicada em producao (registrada em supabase_migrations). Copia fiel para o repositorio.
alter table public."Apontamentos" add column if not exists concluido_em timestamptz;
comment on column public."Apontamentos".concluido_em is 'Quando o apontamento foi marcado como concluido; null = em aberto.';
