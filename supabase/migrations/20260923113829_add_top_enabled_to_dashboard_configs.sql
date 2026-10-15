-- Ja aplicada em producao (registrada em supabase_migrations). Copia fiel para o repositorio.
alter table public.dashboard_configs add column if not exists top_enabled boolean[] default array[true, true, true];
