-- Ja aplicada em producao (registrada em supabase_migrations). Copia fiel para o repositorio.
alter table public."Maquinas" alter column "OEE_Config_horas_Prod_prog" set default '08:00';
update public."Maquinas" set "OEE_Config_horas_Prod_prog" = '08:00' where "OEE_Config_horas_Prod_prog" = '''08:00''::text';
