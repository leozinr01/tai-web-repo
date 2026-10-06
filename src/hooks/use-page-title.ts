import { useEffect } from "react";

const APP_NAME = "TAI Project";

/** Coloca o nome da tela no titulo da aba ("Relatórios | TAI Project"). */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} | ${APP_NAME}`;
  }, [title]);
}
