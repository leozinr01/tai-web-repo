import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/** Espera as mudancas pararem um pouco antes de recarregar (outro sistema pode gravar varias linhas seguidas). */
const DEBOUNCE_MS = 500;

/**
 * Recarrega as consultas `[queryKey, companyId, ...]` quando o repositorio avisar
 * que algo mudou no banco, inclusive mudancas feitas por outros usuarios.
 * `companyId` undefined ouve todas as empresas (visao do Master); vazio ainda nao tem empresa e nao ouve nada.
 */
export function useLiveInvalidation(
  watch: (companyId: string | undefined, onChange: () => void) => () => void,
  queryKey: string,
  companyId: string | undefined,
) {
  const qc = useQueryClient();

  useEffect(() => {
    if (companyId === "") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = watch(companyId, () => {
      clearTimeout(timer);
      timer = setTimeout(() => void qc.invalidateQueries({ queryKey: [queryKey, companyId] }), DEBOUNCE_MS);
    });
    return () => {
      clearTimeout(timer);
      stop();
    };
  }, [watch, queryKey, companyId, qc]);
}
