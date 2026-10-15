-- =============================================================================
-- Esquema inicial do banco "TAI" (schema public), retratado de producao em 2026-10-15
-- =============================================================================
-- NAO RODAR EM PRODUCAO: producao ja tem tudo isto. Este arquivo existe para que um
-- banco novo (branch do Supabase, ambiente local) nasca igual a producao.
--
-- As tabelas foram criadas pelo painel do Supabase, sem migration. Este arquivo
-- reconstitui o estado de 15/10/2026 a partir dos catalogos do Postgres (somente leitura):
-- extensoes, funcoes, tabelas, constraints, comentarios, triggers, RLS e policies,
-- grants, publicacao do Realtime e jobs do pg_cron. O corpo das 21 funcoes foi conferido
-- por md5 contra pg_get_functiondef() de producao (ignorando espacos no fim das linhas).
--
-- A data (20260901) e anterior as 3 migrations ja registradas em producao, que vem
-- em seguida e sao idempotentes: num banco novo rodam sem erro depois desta.
--
-- Fora deste arquivo, de proposito:
--   * dados (nenhuma linha de nenhuma tabela);
--   * o webhook de alert_events (Make), que no fim do arquivo fica comentado e SEM a
--     URL/credenciais reais: num branch ele dispararia alertas reais de WhatsApp;
--   * objetos dos schemas gerenciados pelo Supabase (auth, storage, realtime...).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Extensoes (as padrao do Supabase ja vem instaladas; estas garantem as extras)
-- -----------------------------------------------------------------------------
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists hypopg with schema extensions;
create extension if not exists index_advisor with schema extensions;


-- -----------------------------------------------------------------------------
-- Funcoes (identicas a producao, inclusive as que nao sao usadas por nenhum
-- trigger ou job: atualizar_oee_disponibilidade_linha e atualizar_oee_trigger)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.atualizar_oee_disponibilidade()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE "Maquinas"
    SET "OEE_disponibilidade" = ROUND(
        (
            -- Converter "OEE_Config_horas_Prod_prog" de "hh:mmhs" para minutos
            (
                (CAST(SPLIT_PART(REGEXP_REPLACE("OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(REGEXP_REPLACE("OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 2) AS numeric)
            ) - (
                -- Converter os tempos de falhas, setup e ociosidade de "hh:mm" para minutos
                (CAST(SPLIT_PART("OEE_disp_quebra_falhas", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_disp_quebra_falhas", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_disp_setup", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_disp_setup", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_disp_ociosidade", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_disp_ociosidade", ':', 2) AS numeric)
            )
        ) /
        (
            -- Tempo programado em minutos
            (CAST(SPLIT_PART(REGEXP_REPLACE("OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 1) AS numeric) * 60) +
            CAST(SPLIT_PART(REGEXP_REPLACE("OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 2) AS numeric)
        )
    , 4); -- Arredondamento para 4 casas decimais
END;
$function$
;

CREATE OR REPLACE FUNCTION public.atualizar_oee_disponibilidade_linha()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE "Maquinas"
    SET "OEE_disponibilidade" = ROUND(
        (
            (
                (CAST(SPLIT_PART(REGEXP_REPLACE("OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(REGEXP_REPLACE("OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 2) AS numeric)
            ) - (
                (CAST(SPLIT_PART(NEW."OEE_disp_quebra_falhas", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_disp_quebra_falhas", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_disp_setup", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_disp_setup", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_disp_ociosidade", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_disp_ociosidade", ':', 2) AS numeric)
            )
        ) /
        (
            (CAST(SPLIT_PART(REGEXP_REPLACE("OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 1) AS numeric) * 60) +
            CAST(SPLIT_PART(REGEXP_REPLACE("OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 2) AS numeric)
        )
    , 4)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.atualizar_oee_disponibilidade_row()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE "Maquinas"
    SET "OEE_disponibilidade" = ROUND(
        (
            (
                -- Tempo programado em minutos
                (CAST(SPLIT_PART(REGEXP_REPLACE(NEW."OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(REGEXP_REPLACE(NEW."OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 2) AS numeric)
            ) - (
                -- Somatória das perdas de disponibilidade em minutos
                (CAST(SPLIT_PART(NEW."OEE_disp_quebra_falhas", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_disp_quebra_falhas", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_disp_setup", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_disp_setup", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_disp_ociosidade", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_disp_ociosidade", ':', 2) AS numeric)
            )
        ) / (
            -- Tempo programado novamente para divisor
            (CAST(SPLIT_PART(REGEXP_REPLACE(NEW."OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 1) AS numeric) * 60) +
            CAST(SPLIT_PART(REGEXP_REPLACE(NEW."OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 2) AS numeric)
        )
    , 4)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.atualizar_oee_geral()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Sempre que "OEE" for alterado, chamamos a função de cálculo do OEE geral
    PERFORM calcular_oee_geral();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.atualizar_oee_produtividade()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE "Maquinas"
    SET "OEE_produtividade" = ROUND(
        (
            (
                -- Tempo programado convertido para minutos
                (CAST(SPLIT_PART(REGEXP_REPLACE("OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(REGEXP_REPLACE("OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 2) AS numeric)
            ) - (
                -- Perdas por disponibilidade (quebra, setup e ociosidade)
                (CAST(SPLIT_PART("OEE_disp_quebra_falhas", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_disp_quebra_falhas", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_disp_setup", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_disp_setup", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_disp_ociosidade", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_disp_ociosidade", ':', 2) AS numeric)
            ) - (
                -- Perdas por produtividade (pequenas falhas, queda de velocidade, defeito matéria-prima)
                (CAST(SPLIT_PART("OEE_produt_peq_falhas", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_produt_peq_falhas", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_produt_qued_veloc", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_produt_qued_veloc", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_produt_def_mat_prima", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_produt_def_mat_prima", ':', 2) AS numeric)
            )
        ) /
        (
            -- Tempo disponível após perdas de disponibilidade
            (
                (CAST(SPLIT_PART(REGEXP_REPLACE("OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(REGEXP_REPLACE("OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 2) AS numeric)
            ) - (
                (CAST(SPLIT_PART("OEE_disp_quebra_falhas", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_disp_quebra_falhas", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_disp_setup", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_disp_setup", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_disp_ociosidade", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_disp_ociosidade", ':', 2) AS numeric)
            )
        )
    , 4); -- Arredondando para 4 casas decimais
END;
$function$
;

CREATE OR REPLACE FUNCTION public.atualizar_oee_produtividade_row()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE "Maquinas"
    SET "OEE_produtividade" = ROUND(
        (
            (
                -- Tempo disponível após perdas de disponibilidade
                (
                    (CAST(SPLIT_PART(REGEXP_REPLACE(NEW."OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 1) AS numeric) * 60) +
                    CAST(SPLIT_PART(REGEXP_REPLACE(NEW."OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 2) AS numeric)
                ) - (
                    -- Perdas de disponibilidade
                    (CAST(SPLIT_PART(NEW."OEE_disp_quebra_falhas", ':', 1) AS numeric) * 60) +
                    CAST(SPLIT_PART(NEW."OEE_disp_quebra_falhas", ':', 2) AS numeric) +
                    (CAST(SPLIT_PART(NEW."OEE_disp_setup", ':', 1) AS numeric) * 60) +
                    CAST(SPLIT_PART(NEW."OEE_disp_setup", ':', 2) AS numeric) +
                    (CAST(SPLIT_PART(NEW."OEE_disp_ociosidade", ':', 1) AS numeric) * 60) +
                    CAST(SPLIT_PART(NEW."OEE_disp_ociosidade", ':', 2) AS numeric)
                )
            ) - (
                -- Perdas de produtividade em minutos
                (CAST(SPLIT_PART(NEW."OEE_produt_peq_falhas", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_produt_peq_falhas", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_produt_qued_veloc", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_produt_qued_veloc", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_produt_def_mat_prima", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_produt_def_mat_prima", ':', 2) AS numeric)
            )
        ) / (
            -- Tempo disponível após perdas de disponibilidade (divisor)
            (
                (CAST(SPLIT_PART(REGEXP_REPLACE(NEW."OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(REGEXP_REPLACE(NEW."OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 2) AS numeric)
            ) - (
                (CAST(SPLIT_PART(NEW."OEE_disp_quebra_falhas", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_disp_quebra_falhas", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_disp_setup", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_disp_setup", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_disp_ociosidade", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_disp_ociosidade", ':', 2) AS numeric)
            )
        )
    , 4)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.atualizar_oee_qualidade()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE "Maquinas"
    SET "OEE_qualidade" = ROUND(
        (
            (
                -- Tempo programado convertido para minutos
                (CAST(SPLIT_PART(REGEXP_REPLACE("OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(REGEXP_REPLACE("OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 2) AS numeric)
            ) - (
                -- Perdas por disponibilidade (quebra, setup e ociosidade)
                (CAST(SPLIT_PART("OEE_disp_quebra_falhas", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_disp_quebra_falhas", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_disp_setup", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_disp_setup", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_disp_ociosidade", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_disp_ociosidade", ':', 2) AS numeric)
            ) - (
                -- Perdas por produtividade (pequenas falhas, queda de velocidade, defeito matéria-prima)
                (CAST(SPLIT_PART("OEE_produt_peq_falhas", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_produt_peq_falhas", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_produt_qued_veloc", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_produt_qued_veloc", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_produt_def_mat_prima", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_produt_def_mat_prima", ':', 2) AS numeric)
            ) - (
                -- Perdas por qualidade (não conformidade, refugo, retrabalho)
                (CAST(SPLIT_PART("OEE_qualidad_prod_nao_conform", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_qualidad_prod_nao_conform", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_qualidad_refugo", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_qualidad_refugo", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_qualidad_retrabalho", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_qualidad_retrabalho", ':', 2) AS numeric)
            )
        ) /
        (
            (
                -- Tempo disponível após perdas de disponibilidade
                (CAST(SPLIT_PART(REGEXP_REPLACE("OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(REGEXP_REPLACE("OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 2) AS numeric)
            ) - (
                (CAST(SPLIT_PART("OEE_disp_quebra_falhas", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_disp_quebra_falhas", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_disp_setup", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_disp_setup", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_disp_ociosidade", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_disp_ociosidade", ':', 2) AS numeric)
            ) - (
                -- Removendo também as perdas de produtividade
                (CAST(SPLIT_PART("OEE_produt_peq_falhas", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_produt_peq_falhas", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_produt_qued_veloc", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_produt_qued_veloc", ':', 2) AS numeric) +
                (CAST(SPLIT_PART("OEE_produt_def_mat_prima", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART("OEE_produt_def_mat_prima", ':', 2) AS numeric)
            )
        )
    , 4); -- Arredondando para 4 casas decimais
END;
$function$
;

CREATE OR REPLACE FUNCTION public.atualizar_oee_qualidade_row()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE "Maquinas"
    SET "OEE_qualidade" = ROUND(
        (
            (
                -- Tempo disponível após perdas de disponibilidade
                (CAST(SPLIT_PART(REGEXP_REPLACE(NEW."OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(REGEXP_REPLACE(NEW."OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 2) AS numeric)
            ) - (
                -- Perdas de disponibilidade em minutos
                (CAST(SPLIT_PART(NEW."OEE_disp_quebra_falhas", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_disp_quebra_falhas", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_disp_setup", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_disp_setup", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_disp_ociosidade", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_disp_ociosidade", ':', 2) AS numeric)
            ) - (
                -- Perdas de produtividade em minutos
                (CAST(SPLIT_PART(NEW."OEE_produt_peq_falhas", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_produt_peq_falhas", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_produt_qued_veloc", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_produt_qued_veloc", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_produt_def_mat_prima", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_produt_def_mat_prima", ':', 2) AS numeric)
            ) - (
                -- Perdas de qualidade em minutos
                (CAST(SPLIT_PART(NEW."OEE_qualidad_prod_nao_conform", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_qualidad_prod_nao_conform", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_qualidad_refugo", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_qualidad_refugo", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_qualidad_retrabalho", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_qualidad_retrabalho", ':', 2) AS numeric)
            )
        ) / (
            -- Divisor: tempo disponível após perdas de disponibilidade e produtividade
            (
                (CAST(SPLIT_PART(REGEXP_REPLACE(NEW."OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(REGEXP_REPLACE(NEW."OEE_Config_horas_Prod_prog", '[^0-9:]', '', 'g'), ':', 2) AS numeric)
            ) - (
                -- Perdas de disponibilidade
                (CAST(SPLIT_PART(NEW."OEE_disp_quebra_falhas", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_disp_quebra_falhas", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_disp_setup", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_disp_setup", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_disp_ociosidade", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_disp_ociosidade", ':', 2) AS numeric)
            ) - (
                -- Perdas de produtividade
                (CAST(SPLIT_PART(NEW."OEE_produt_peq_falhas", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_produt_peq_falhas", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_produt_qued_veloc", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_produt_qued_veloc", ':', 2) AS numeric) +
                (CAST(SPLIT_PART(NEW."OEE_produt_def_mat_prima", ':', 1) AS numeric) * 60) +
                CAST(SPLIT_PART(NEW."OEE_produt_def_mat_prima", ':', 2) AS numeric)
            )
        )
    , 4)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.atualizar_oee_row()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE "Maquinas"
    SET "OEE" = ROUND(
                    (COALESCE(NEW."OEE_qualidade", 1) *
                     COALESCE(NEW."OEE_produtividade", 1) *
                     COALESCE(NEW."OEE_disponibilidade", 1))::numeric
                , 4)
    WHERE id = NEW.id;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.atualizar_oee_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.OEE := calcular_oee(NEW.OEE_qualidade, NEW.OEE_produtividade, NEW.OEE_disponibilidade);
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.atualizar_status_ordem_servico()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Verifica se a "data execucao" é anterior à data atual
    -- Se o status não for 'Realizado' e a "data execucao" for anterior à data atual, o status será 'Atrasado'
    IF NEW."status" != 'Realizado' AND TO_DATE(NEW."data execucao", 'DD/MM/YYYY') < CURRENT_DATE THEN
        NEW."status" := 'Atrasado';

    -- Se a "data execucao" for maior que a data atual, o status será 'Lançado'
    ELSIF TO_DATE(NEW."data execucao", 'DD/MM/YYYY') > CURRENT_DATE THEN
        NEW."status" := 'Lançado';

    END IF;

    -- Retorna a nova linha (NEW), que será persistida no banco
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.atualizar_status_por_data_execucao()
 RETURNS void
 LANGUAGE plpgsql
AS $function$BEGIN
    UPDATE "Ordem de serviço"
    SET "status" = CASE
        WHEN "status" = 'Realizado' THEN "status"
        WHEN TO_DATE("data execucao", 'DD/MM/YYYY') < CURRENT_DATE THEN 'Atrasado'
        WHEN TO_DATE("data execucao", 'DD/MM/YYYY') > CURRENT_DATE THEN 'Lançado'
        ELSE "status"
    END
    WHERE "status" != 'Realizado';
END;$function$
;

CREATE OR REPLACE FUNCTION public.atualizar_tempo_produtivo_row()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE "Maquinas"
    SET "Tempo_produtivo" = (
        FLOOR(EXTRACT(EPOCH FROM ('00:00'::interval + REPLACE(NEW."OEE_Config_horas_Prod_prog", 'hs', '')::interval)) / 60) -
        (
            FLOOR(EXTRACT(EPOCH FROM ('00:00'::interval + REPLACE(NEW."OEE_disp_quebra_falhas", 'hs', '')::interval)) / 60) +
            FLOOR(EXTRACT(EPOCH FROM ('00:00'::interval + REPLACE(NEW."OEE_disp_setup", 'hs', '')::interval)) / 60) +
            FLOOR(EXTRACT(EPOCH FROM ('00:00'::interval + REPLACE(NEW."OEE_disp_ociosidade", 'hs', '')::interval)) / 60)
        ) -
        (
            FLOOR(EXTRACT(EPOCH FROM ('00:00'::interval + REPLACE(NEW."OEE_produt_peq_falhas", 'hs', '')::interval)) / 60) +
            FLOOR(EXTRACT(EPOCH FROM ('00:00'::interval + REPLACE(NEW."OEE_produt_qued_veloc", 'hs', '')::interval)) / 60) +
            FLOOR(EXTRACT(EPOCH FROM ('00:00'::interval + REPLACE(NEW."OEE_produt_def_mat_prima", 'hs', '')::interval)) / 60)
        )
    )
    WHERE id = NEW.id;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.atualizar_valores_maquinas()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Atualiza as colunas "vibracaoMax", "temperaturaMax", "OEE", "OEE_disponibilidade", "OEE_produtividade"
    -- e "OEE_qualidade" para 1
    UPDATE "Maquinas"
    SET
        "vibracaoMax" = 1,
        "temperaturaMax" = 1,
        "OEE" = 1,
        "OEE_disponibilidade" = 1,
        "OEE_produtividade" = 1,
        "OEE_qualidade" = 1;

    -- Atualiza as colunas de "OEE_disp_quebra_falhas", "OEE_disp_setup", "OEE_disp_ociosidade",
    -- "OEE_produt_peq_falhas", "OEE_produt_qued_veloc", "OEE_produt_def_mat_prima",
    -- "OEE_qualidad_prod_nao_conform", "OEE_qualidad_refugo" e "OEE_qualidad_retrabalho" para '00:00'
    UPDATE "Maquinas"
    SET
        "OEE_disp_quebra_falhas" = '00:00',
        "OEE_disp_setup" = '00:00',
        "OEE_disp_ociosidade" = '00:00',
        "OEE_produt_peq_falhas" = '00:00',
        "OEE_produt_qued_veloc" = '00:00',
        "OEE_produt_def_mat_prima" = '00:00',
        "OEE_qualidad_prod_nao_conform" = '00:00',
        "OEE_qualidad_refugo" = '00:00',
        "OEE_qualidad_retrabalho" = '00:00';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.atualizar_variaveis_maquinas()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Atualiza somente as máquinas do filtro solicitado
  UPDATE "Maquinas"
  SET
    -- Vibração aleatória entre 0.300 e 0.950
    "Vibração" = ROUND((RANDOM() * (0.950 - 0.300) + 0.300)::numeric, 3),

    -- Temperatura progressiva entre 20.0 e 25.5
    "Temperatura" = CASE
      WHEN "Temperatura" >= 25.5 THEN 20.0
      ELSE ROUND("Temperatura" + 0.05, 1)
    END
  WHERE "maquina" IN ('Secadora Refr.', 'Secadora Absor.');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calcular_oee()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    UPDATE "Maquinas"
    SET "OEE" = ROUND(
                    (COALESCE("OEE_qualidade", 1) *
                    COALESCE("OEE_produtividade", 1) *
                    COALESCE("OEE_disponibilidade", 1))::numeric, 4
                );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calcular_oee_geral()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    ref_id RECORD;
BEGIN
    -- Criar uma tabela temporária para armazenar os idRef recalculados
    CREATE TEMP TABLE temp_idRef AS
    SELECT DISTINCT "idRef" FROM "Maquinas";

    -- Remover o último registro de cada "idRef" atualizado na tabela "OEE geral"
    DELETE FROM "OEE geral"
    WHERE ("idRef", "Tempo_produtivo") IN (
        SELECT "idRef", MAX("Tempo_produtivo")
        FROM "OEE geral"
        WHERE "idRef" IN (SELECT "idRef" FROM temp_idRef)
        GROUP BY "idRef"
    );

    -- Inserir os novos cálculos para os idRef atualizados
    INSERT INTO "OEE geral" ("idRef", "OEE", "Disponibilidade", "Produtividade", "Qualidade", "Tempo_produtivo")
    SELECT
        "idRef",
        COALESCE(SUM("OEE_individual" * "Tempo_produtivo") / NULLIF(SUM("Tempo_produtivo"), 0), 0) AS "OEE",
        COALESCE(SUM("OEE_disponibilidade" * "Tempo_produtivo") / NULLIF(SUM("Tempo_produtivo"), 0), 0) AS "Disponibilidade",
        COALESCE(SUM("OEE_produtividade" * "Tempo_produtivo") / NULLIF(SUM("Tempo_produtivo"), 0), 0) AS "Produtividade",
        COALESCE(SUM("OEE_qualidade" * "Tempo_produtivo") / NULLIF(SUM("Tempo_produtivo"), 0), 0) AS "Qualidade",
        COALESCE(SUM("Tempo_produtivo"), 0) AS "Tempo_produtivo"
    FROM (
        SELECT
            "idRef",
            "OEE_disponibilidade",
            "OEE_produtividade",
            "OEE_qualidade",
            "OEE_disponibilidade" * "OEE_produtividade" * "OEE_qualidade" AS "OEE_individual",
            "Tempo_produtivo"::NUMERIC AS "Tempo_produtivo"  -- Convertendo caso necessário
        FROM "Maquinas"
    ) subquery
    WHERE "idRef" IN (SELECT "idRef" FROM temp_idRef)
    GROUP BY "idRef";

    -- Limpar a tabela temporária
    DROP TABLE temp_idRef;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calcular_tempo_produtivo()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE "Maquinas"
  SET "Tempo_produtivo" = (
    -- Converter "OEE_Config_horas_Prod_prog" de TEXT para INTERVAL, removendo o sufixo "hs"
    FLOOR(EXTRACT(EPOCH FROM ('00:00'::interval + REPLACE("OEE_Config_horas_Prod_prog", 'hs', '')::interval)) / 60) -

    (
      -- Soma das falhas de disponibilidade convertidas para minutos, removendo "hs" se necessário
      FLOOR(EXTRACT(EPOCH FROM ('00:00'::interval + REPLACE("OEE_disp_quebra_falhas", 'hs', '')::interval)) / 60) +
      FLOOR(EXTRACT(EPOCH FROM ('00:00'::interval + REPLACE("OEE_disp_setup", 'hs', '')::interval)) / 60) +
      FLOOR(EXTRACT(EPOCH FROM ('00:00'::interval + REPLACE("OEE_disp_ociosidade", 'hs', '')::interval)) / 60)
    ) -

    (
      -- Soma das falhas de produtividade convertidas para minutos, removendo "hs" se necessário
      FLOOR(EXTRACT(EPOCH FROM ('00:00'::interval + REPLACE("OEE_produt_peq_falhas", 'hs', '')::interval)) / 60) +
      FLOOR(EXTRACT(EPOCH FROM ('00:00'::interval + REPLACE("OEE_produt_qued_veloc", 'hs', '')::interval)) / 60) +
      FLOOR(EXTRACT(EPOCH FROM ('00:00'::interval + REPLACE("OEE_produt_def_mat_prima", 'hs', '')::interval)) / 60)
    )
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_thresholds()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  v RECORD;
  c RECORD;
  _seconds_out numeric;
  _seconds_back numeric;
  _should_alert boolean;
BEGIN
  FOR v IN
    SELECT
      var.id, var.name, var.number_value, var.grandeza,
      var.min_val, var.max_val, var.timeout_min, var.level,
      var.last_alert_at, var.out_of_range_since, var.alert_count,
      var.back_in_range_since,
      m.maquina, m."IDsala",
      e.nome AS empresa_nome, e."idEmpresa" AS empresa_id
    FROM variables var
    LEFT JOIN "Maquinas" m ON m.id = var.maquina_id
    LEFT JOIN "Empresas" e ON e."idEmpresa" = m."idRef"
    WHERE (var.min_val IS NOT NULL OR var.max_val IS NOT NULL)
    AND var.level IN ('amarela', 'vermelha')
  LOOP

    IF (v.min_val IS NULL OR v.number_value >= v.min_val)
    AND (v.max_val IS NULL OR v.number_value <= v.max_val) THEN

      IF v.back_in_range_since IS NULL AND v.out_of_range_since IS NOT NULL THEN
        UPDATE variables SET back_in_range_since = now() WHERE id = v.id;
        CONTINUE;
      END IF;

      IF v.back_in_range_since IS NOT NULL THEN
        _seconds_back := extract(epoch from (now() - v.back_in_range_since));
        IF _seconds_back >= (v.timeout_min * 60) THEN
          UPDATE variables
          SET out_of_range_since = null,
              back_in_range_since = null,
              alert_count = 0,
              last_alert_at = null
          WHERE id = v.id;
        END IF;
      END IF;

      CONTINUE;
    END IF;

    IF v.back_in_range_since IS NOT NULL THEN
      UPDATE variables SET back_in_range_since = null WHERE id = v.id;
    END IF;

    IF v.out_of_range_since IS NULL THEN
      UPDATE variables SET out_of_range_since = now() WHERE id = v.id;
      CONTINUE;
    END IF;

    _seconds_out := extract(epoch from (now() - v.out_of_range_since));
    IF _seconds_out < (v.timeout_min * 60) THEN
      CONTINUE;
    END IF;

    _should_alert := false;

    IF v.alert_count = 0 THEN
      _should_alert := true;
    ELSIF v.level = 'vermelha' THEN
      IF v.alert_count IN (1, 2) THEN
        IF extract(epoch from (now() - v.last_alert_at)) >= 600 THEN
          _should_alert := true;
        END IF;
      ELSIF v.alert_count = 3 THEN
        IF extract(epoch from (now() - v.last_alert_at)) >= 3600 THEN
          _should_alert := true;
        END IF;
      END IF;
    END IF;

    IF _should_alert THEN

      FOR c IN
        SELECT telefone, envio
        FROM alert_contacts
        WHERE empresa_id = v.empresa_id::text
      LOOP
        INSERT INTO alert_events (
          variable_id, triggered_at, empresa_nome, empresa_telefone,
          setor, maquina, variable_name, value_at_trigger,
          grandeza, min_val, max_val, timeout_min,
          level, hora_evento, dia_evento, status, envio
        ) VALUES (
          v.id, now(), v.empresa_nome, c.telefone,
          v."IDsala", v.maquina, v.name, v.number_value,
          v.grandeza, v.min_val, v.max_val, v.timeout_min,
          v.level,
          to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI'),
          to_char(now() AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY'),
          'pendente',
          CASE
            WHEN v.level = 'vermelha' AND c.envio = 'zap&call' THEN 'zap&call'
            ELSE 'zap'
          END
        );
      END LOOP;

      UPDATE variables
      SET last_alert_at = now(),
          alert_count = v.alert_count + 1
      WHERE id = v.id;

    END IF;

  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.copiar_dados_maquinas_para_relatorio()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    maq RECORD;
    vars JSONB;
    status_val TEXT;
BEGIN
    FOR maq IN
        SELECT m.*
        FROM "Maquinas" m
        INNER JOIN "Empresas" e ON e."idEmpresa" = m."idRef"
        WHERE e."assinatura" = 'ativa'
    LOOP

        IF maq.emergencia = true AND maq.producao = false AND maq.parado = false THEN
            status_val := 'Emergência';
        ELSIF maq.parado = true AND maq.producao = false AND maq.emergencia = false THEN
            status_val := 'Parado';
        ELSIF maq.producao = true AND maq.parado = false AND maq.emergencia = false THEN
            status_val := 'Produção';
        ELSE
            status_val := 'Indefinido';
        END IF;

        SELECT jsonb_object_agg(
            v.name || COALESCE(' (' || v.grandeza || ')', ''),
            CASE
                WHEN v.type = 'int' THEN ROUND(v.number_value, 0)::bigint::text
                ELSE ROUND(v.number_value, 2)::text
            END
        )
        INTO vars
        FROM variables v
        WHERE v.maquina_id = maq.id;

        INSERT INTO "Relatório" (
            "idRef",
            "IDsala",
            "maquina",
            "maquina_id",
            "OEE",
            "OEE_disponibilidade",
            "OEE_produtividade",
            "OEE_qualidade",
            "status_maquina",
            "date",
            "hora",
            "variables"
        ) VALUES (
            maq."idRef",
            maq."IDsala",
            maq."maquina",
            maq."id",
            maq."OEE",
            maq."OEE_disponibilidade",
            maq."OEE_produtividade",
            maq."OEE_qualidade",
            status_val,
            CURRENT_DATE,
            TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo', 'HH24:MI'),
            vars
        );

    END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.soma_tempo_parada()
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    total_minutos integer := 0;
    horas integer;
    minutos integer;
    rec record;
BEGIN
    FOR rec IN SELECT tempo_parada FROM "Apontamentos" LOOP
        BEGIN
            total_minutos := total_minutos +
                extract(hour from to_timestamp(rec.tempo_parada, 'HH:MM')) * 60 +
                extract(minute from to_timestamp(rec.tempo_parada, 'HH:MM'));
        EXCEPTION
            WHEN invalid_text_representation THEN
                RAISE NOTICE 'Valor inválido: %', rec.tempo_parada;
            -- Ou você pode ajustar o comportamento para esses casos, como ignorar ou lançar um erro específico
        END;
    END LOOP;

    horas := total_minutos / 60;
    minutos := total_minutos % 60;

    RETURN json_build_object('resultado', to_char(horas, 'FM00') || ':' || to_char(minutos, 'FM00'));
END;
$function$
;


-- -----------------------------------------------------------------------------
-- Tabelas
-- -----------------------------------------------------------------------------
create table public."Empresas" (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone default now() not null,
  "idEmpresa" uuid default gen_random_uuid(),
  nome text,
  cnpj text,
  estado text,
  cidade text,
  "CEP" text,
  endereco text,
  responsavel text,
  telefone text,
  logo_url text,
  assinatura text
);

create table public."User" (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone default now() not null,
  email text default ''::text,
  "idRef" uuid default auth.uid(),
  "nomeE" text default ''::text,
  telefone text default ''::text,
  estado text default ''::text,
  cidade text default ''::text,
  "Status" text default ''::text,
  key text,
  tipo text,
  "idEmpresa" uuid,
  "nomeUser" text
);

create table public."Sala" (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone default now() not null,
  sala text not null,
  "idRef" uuid not null,
  maq_producao bigint,
  maq_parada bigint,
  maq_emergencia bigint
);

create table public."Maquinas" (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone default now() not null,
  "IDsala" text not null,
  maquina text default ''::text,
  producao boolean,
  parado boolean,
  emergencia boolean,
  horimetro bigint,
  "idRef" uuid,
  "Temperatura" double precision default '0'::double precision,
  "Vibração" double precision default '0'::double precision,
  "perdaProducao" real default '0'::real,
  "unidProducao" text,
  "unidPerda" text,
  "vibracaoMax" double precision default '1'::double precision,
  "temperaturaMax" double precision default '1'::double precision,
  "vibracaoAlta" boolean default false,
  "temperaturaAlta" boolean default false,
  "idRefOEE" uuid default gen_random_uuid(),
  "OEE" double precision default '1'::double precision,
  "OEE_disponibilidade" double precision default '1'::double precision,
  "OEE_produtividade" double precision default '1'::double precision,
  "OEE_qualidade" double precision default '1'::double precision,
  "OEE_disp_quebra_falhas" text default '00:00'::text,
  "OEE_disp_setup" text default '00:00'::text,
  "OEE_disp_ociosidade" text default '00:00'::text,
  "OEE_produt_peq_falhas" text default '00:00'::text,
  "OEE_produt_qued_veloc" text default '00:00'::text,
  "OEE_produt_def_mat_prima" text default '00:00'::text,
  "OEE_qualidad_prod_nao_conform" text default '00:00'::text,
  "OEE_qualidad_refugo" text default '00:00'::text,
  "OEE_qualidad_retrabalho" text default '00:00'::text,
  "OEE_Config_horas_Prod_prog" text default '08:00'::text,
  "OEE_Config_Unid_Med" text default 'Metro (m)'::text,
  "OEE_Config_Qnt_Produzida" bigint default '5000'::bigint,
  "OEE_Config_Tempo_Produz_seg" real default '21'::real,
  "VelocidadeAtual" double precision default '10'::double precision,
  "VelocidadeMax" double precision default '100'::double precision,
  "ProdAtual" bigint default '10'::bigint,
  turno text default ''::text,
  "Tempo_produtivo" integer
);

create table public.variables (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone default now() not null,
  maquina_id bigint,
  name text,
  number_value numeric,
  bool_value boolean,
  type text,
  grandeza text,
  min_val numeric,
  max_val numeric,
  timeout_min integer default 1,
  level text default 'amarela'::text,
  last_alert_at timestamp with time zone,
  out_of_range_since timestamp with time zone,
  alert_count integer default 0,
  back_in_range_since timestamp with time zone
);

create table public.dashboard_configs (
  id uuid default gen_random_uuid() not null,
  id_empresa uuid,
  maquina_id bigint,
  selection text[] default '{horimetro,vibracao,temperatura}'::text[],
  bottom_selection text[] default '{velocidadeAtual,producaoAtual}'::text[],
  bottom_enabled boolean[] default '{t,t}'::boolean[],
  oee_graph_variable text default 'vibracao'::text,
  oee_enabled boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  top_enabled boolean[] default ARRAY[true, true, true]
);

create table public."Apontamentos" (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone default now() not null,
  "idMaquina" text,
  data_lancamento text,
  hora_lancamento text,
  "lançador" text,
  apontamento text,
  inicio_parada text,
  fim_parada text,
  "idRef" uuid,
  tempo_parada text,
  "OEE" text,
  "seguimento_OEE" text,
  "Setor" text,
  concluido_em timestamp with time zone
);

create table public."Ordem de serviço" (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone default now() not null,
  "idRef" uuid,
  "idMaquina" text not null,
  "numOrdem" bigint,
  data date,
  servico text,
  ferramentas text,
  artefatos text,
  periodicidade text,
  status text,
  "Executor" text,
  "data execucao" text,
  setor text,
  proxima_execucao text
);

create table public."Relatório" (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone default (now() AT TIME ZONE 'utc'::text),
  "idRef" uuid,
  "OEE_disponibilidade" double precision,
  "OEE_produtividade" double precision,
  "OEE_qualidade" double precision,
  "OEE" double precision,
  "IDsala" text,
  maquina text,
  status_maquina text,
  date date,
  hora text,
  maquina_id bigint,
  variables jsonb
);

create table public."OEE geral" (
  id bigint generated by default as identity not null,
  created_at timestamp with time zone default now() not null,
  "idRef" uuid default gen_random_uuid(),
  "OEE" double precision,
  "Disponibilidade" double precision,
  "Produtividade" double precision,
  "Qualidade" double precision,
  "Tempo_produtivo" integer
);

create table public.alert_contacts (
  id uuid default gen_random_uuid() not null,
  empresa_id text not null,
  nome text,
  telefone text not null,
  envio text default 'zap'::text not null,
  created_at timestamp with time zone default now()
);

create table public.alert_events (
  id uuid default gen_random_uuid() not null,
  variable_id bigint,
  triggered_at timestamp with time zone default now() not null,
  empresa_nome text,
  empresa_telefone text,
  setor text,
  maquina text,
  variable_name text,
  value_at_trigger numeric,
  grandeza text,
  min_val numeric,
  max_val numeric,
  timeout_min integer,
  level text,
  hora_evento text,
  dia_evento text,
  status text default 'pendente'::text not null,
  sent_at timestamp with time zone,
  envio text
);


-- -----------------------------------------------------------------------------
-- Chaves primarias, unicas e checks (mesmos nomes de producao)
-- -----------------------------------------------------------------------------
alter table public."Empresas" add constraint "Empresas_pkey" primary key (id);
alter table public."Empresas" add constraint "Empresas_idEmpresa_key" unique ("idEmpresa");

alter table public."User" add constraint "User_pkey" primary key (id);
alter table public."User" add constraint "User_idRef_key" unique ("idRef");

alter table public."Sala" add constraint "Sala_pkey" primary key (id);
alter table public."Sala" add constraint "Sala_sala_key" unique (sala);

alter table public."Maquinas" add constraint "Maquinas_pkey" primary key (id);
alter table public."Maquinas" add constraint "Maquinas_idRefOEE_key" unique ("idRefOEE");

alter table public.variables add constraint variables_pkey primary key (id);
alter table public.variables add constraint chk_level
  check ((level = ANY (ARRAY['amarela'::text, 'vermelha'::text, 'branca'::text])));

alter table public.dashboard_configs add constraint dashboard_configs_pkey primary key (id);
alter table public.dashboard_configs add constraint dashboard_configs_id_empresa_maquina_id_key unique (id_empresa, maquina_id);
alter table public.dashboard_configs add constraint dashboard_configs_unique unique (maquina_id, id_empresa);

alter table public."Apontamentos" add constraint "Apontamentos_pkey" primary key (id);

alter table public."Ordem de serviço" add constraint "Ordem de serviço_pkey" primary key (id);
alter table public."Ordem de serviço" add constraint "Ordem de serviço_id_key" unique (id);

alter table public."Relatório" add constraint "Relatório_pkey" primary key (id);

alter table public."OEE geral" add constraint "OEE geral_pkey" primary key (id);

alter table public.alert_contacts add constraint alert_contacts_pkey primary key (id);
alter table public.alert_contacts add constraint alert_contacts_envio_check
  check ((envio = ANY (ARRAY['zap'::text, 'zap&call'::text])));

alter table public.alert_events add constraint alert_events_pkey primary key (id);
alter table public.alert_events add constraint alert_events_level_check
  check ((level = ANY (ARRAY['amarela'::text, 'vermelha'::text])));
alter table public.alert_events add constraint alert_events_status_check
  check ((status = ANY (ARRAY['pendente'::text, 'enviado'::text, 'falhou'::text])));


-- -----------------------------------------------------------------------------
-- Chaves estrangeiras
-- -----------------------------------------------------------------------------
alter table public."User" add constraint "User_idEmpresa_fkey"
  foreign key ("idEmpresa") references public."Empresas"("idEmpresa");
alter table public."User" add constraint "public_User_idRef_fkey"
  foreign key ("idRef") references auth.users(id) on update cascade on delete cascade;

alter table public."Sala" add constraint "Sala_idRef_fkey"
  foreign key ("idRef") references public."Empresas"("idEmpresa");

alter table public."Maquinas" add constraint "Maquinas_idRef_fkey"
  foreign key ("idRef") references public."Empresas"("idEmpresa");
alter table public."Maquinas" add constraint "Maquinas_IDsala_fkey"
  foreign key ("IDsala") references public."Sala"(sala) on update cascade on delete cascade;

alter table public.variables add constraint variables_maquina_id_fkey
  foreign key (maquina_id) references public."Maquinas"(id);

alter table public.dashboard_configs add constraint dashboard_configs_id_empresa_fkey
  foreign key (id_empresa) references public."Empresas"("idEmpresa") on delete cascade;
alter table public.dashboard_configs add constraint dashboard_configs_maquina_id_fkey
  foreign key (maquina_id) references public."Maquinas"(id) on delete cascade;

alter table public."Apontamentos" add constraint "Apontamentos_idRef_fkey"
  foreign key ("idRef") references public."Empresas"("idEmpresa");

alter table public."Ordem de serviço" add constraint "Ordem de serviço_idRef_fkey"
  foreign key ("idRef") references public."Empresas"("idEmpresa");

alter table public."Relatório" add constraint "Relatório_idRef_fkey"
  foreign key ("idRef") references public."Empresas"("idEmpresa");

alter table public."OEE geral" add constraint "OEE geral_idRef_fkey"
  foreign key ("idRef") references public."Empresas"("idEmpresa");

alter table public.alert_events add constraint alert_events_variable_id_fkey
  foreign key (variable_id) references public.variables(id) on delete cascade;


-- -----------------------------------------------------------------------------
-- Comentarios
-- -----------------------------------------------------------------------------
comment on table public."Relatório" is 'This is a duplicate of Relatório';
comment on column public."Apontamentos".concluido_em is 'Quando o apontamento foi marcado como concluido; null = em aberto.';


-- -----------------------------------------------------------------------------
-- Triggers de Maquinas (todos SECURITY INVOKER, como em producao)
-- -----------------------------------------------------------------------------
CREATE TRIGGER tg_atualiza_oee AFTER UPDATE OF "OEE" ON public."Maquinas" FOR EACH ROW EXECUTE FUNCTION atualizar_oee_geral();
CREATE TRIGGER trg_atualizar_tempo_produtivo AFTER UPDATE OF "OEE_Config_horas_Prod_prog", "OEE_disp_quebra_falhas", "OEE_disp_setup", "OEE_disp_ociosidade", "OEE_produt_peq_falhas", "OEE_produt_qued_veloc", "OEE_produt_def_mat_prima" ON public."Maquinas" FOR EACH ROW EXECUTE FUNCTION atualizar_tempo_produtivo_row();
CREATE TRIGGER trg_atualizar_oee AFTER UPDATE OF "OEE_disponibilidade", "OEE_produtividade", "OEE_qualidade" ON public."Maquinas" FOR EACH ROW EXECUTE FUNCTION atualizar_oee_row();
CREATE TRIGGER trg_atualizar_oee_qualidade AFTER UPDATE OF "OEE_qualidad_prod_nao_conform", "OEE_qualidad_refugo", "OEE_qualidad_retrabalho", "OEE_Config_horas_Prod_prog" ON public."Maquinas" FOR EACH ROW EXECUTE FUNCTION atualizar_oee_qualidade_row();
CREATE TRIGGER trg_atualizar_oee_produtividade AFTER UPDATE OF "OEE_produt_peq_falhas", "OEE_produt_qued_veloc", "OEE_produt_def_mat_prima", "OEE_Config_horas_Prod_prog" ON public."Maquinas" FOR EACH ROW EXECUTE FUNCTION atualizar_oee_produtividade_row();
CREATE TRIGGER trg_atualizar_oee_disponibilidade AFTER UPDATE OF "OEE_disp_quebra_falhas", "OEE_disp_setup", "OEE_disp_ociosidade", "OEE_Config_horas_Prod_prog" ON public."Maquinas" FOR EACH ROW EXECUTE FUNCTION atualizar_oee_disponibilidade_row();


-- -----------------------------------------------------------------------------
-- RLS e policies (estado de producao em 15/10/2026: quase tudo aberto).
-- A correcao esta em supabase/migrations-pendentes/ e NAO faz parte deste arquivo.
-- -----------------------------------------------------------------------------
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
alter table public.alert_contacts     enable row level security;
alter table public.alert_events       enable row level security;

create policy "all" on public."Empresas" as permissive for all to public using (true) with check (true);
create policy "Geral" on public."User" as permissive for all to public using (true);
create policy "Geral" on public."Sala" as permissive for all to public using (true);
create policy "Geral" on public."Maquinas" as permissive for all to public using (true);
create policy "Apontamento " on public."Apontamentos" as permissive for all to public using (true);
create policy "geral" on public."Ordem de serviço" as permissive for all to public using (true);
create policy "Relatório" on public."Relatório" as permissive for all to public using (true) with check (true);
create policy "all" on public."OEE geral" as permissive for all to public using (true) with check (true);
create policy "allow all" on public.alert_contacts as permissive for all to public using (true) with check (true);
create policy "allow all" on public.alert_events as permissive for all to public using (true) with check (true);

create policy "Admin write access" on public.dashboard_configs as permissive for all to public
  using ((auth.uid() IN ( SELECT "User"."idRef"
   FROM "User"
  WHERE (("User"."idEmpresa" = dashboard_configs.id_empresa) AND (("User".tipo = 'Admin'::text) OR ("User"."nomeUser" = 'Master'::text))))));
create policy "Empresa read access" on public.dashboard_configs as permissive for select to public
  using ((auth.uid() IN ( SELECT "User"."idRef"
   FROM "User"
  WHERE ("User"."idEmpresa" = dashboard_configs.id_empresa))));
create policy "allow all" on public.dashboard_configs as permissive for all to public using (true) with check (true);

create policy "authenticated full access" on public.variables as permissive for all to authenticated using (true) with check (true);
-- uid fixo do usuario Master de producao (num banco novo esse usuario nao existe e a policy fica inerte).
create policy "master full access" on public.variables as permissive for all to authenticated
  using ((auth.uid() = 'd7244bae-d3fb-49be-ac47-09781b6bb681'::uuid))
  with check ((auth.uid() = 'd7244bae-d3fb-49be-ac47-09781b6bb681'::uuid));


-- -----------------------------------------------------------------------------
-- Grants (o padrao do Supabase ja concede; explicitado para nao depender disso).
-- Em producao a anon NAO tem grant em variables.
-- -----------------------------------------------------------------------------
grant select, insert, update, delete, truncate, references, trigger on
  public."Empresas", public."User", public."Sala", public."Maquinas", public.dashboard_configs,
  public."Apontamentos", public."Ordem de serviço", public."Relatório", public."OEE geral",
  public.alert_contacts, public.alert_events
  to anon, authenticated, service_role;
grant select, insert, update, delete, truncate, references, trigger on public.variables to authenticated, service_role;
revoke all on public.variables from anon;


-- -----------------------------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------------------------
alter publication supabase_realtime add table
  public."Apontamentos", public."Empresas", public."Maquinas", public."OEE geral",
  public."Ordem de serviço", public."Relatório", public."Sala", public."User",
  public.dashboard_configs, public.variables;


-- -----------------------------------------------------------------------------
-- Jobs do pg_cron (rodam como postgres, como em producao)
-- -----------------------------------------------------------------------------
select cron.schedule('Limpeza Relatório', '0 3 1 * *', $$DELETE FROM "Relatório" WHERE "date" < CURRENT_DATE - INTERVAL '1 year';$$);
select cron.schedule('Ordem De Serviço', '0 0 * * *', $$SELECT public.atualizar_status_por_data_execucao()$$);
select cron.schedule('Transfere Dados', '0 * * * *', $$SELECT public.copiar_dados_maquinas_para_relatorio();$$);
select cron.schedule('checar-variaveis', '* * * * *', $$ SELECT check_thresholds() $$);
select cron.schedule('delete_old_cron_logs_daily', '1 0 * * *', $$
    DELETE FROM cron.job_run_details
    WHERE start_time < NOW() - INTERVAL '7 days';
$$);
select cron.schedule('novo_job', '1 0 * * *', $$SELECT atualizar_valores_maquinas();$$);


-- -----------------------------------------------------------------------------
-- Webhook de alertas (Database Webhook do Supabase -> Make). DESATIVADO DE PROPOSITO.
-- Em producao: AFTER INSERT em alert_events chama supabase_functions.http_request
-- com 5 argumentos (URL, metodo, headers, params, timeout). Os valores reais nao
-- estao aqui. So recriar num ambiente que DEVA enviar alertas, pelo painel do
-- Supabase (Database > Webhooks), nunca num branch de teste com contatos reais.
-- -----------------------------------------------------------------------------
-- CREATE TRIGGER "alert_events_Make" AFTER INSERT ON public.alert_events
--   FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('<url>', 'POST', '<headers>', '{}', '<timeout_ms>');
