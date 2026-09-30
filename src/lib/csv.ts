/** Caracteres que fazem o Excel/Sheets tratar a celula como formula. */
const FORMULA_START = /^[=+\-@\t\r]/;

export function toCsv<T>(rows: T[], headers: { key: keyof T; label: string }[]): string {
  const escape = (value: unknown): string => {
    let str = value === null || value === undefined ? "" : String(value);
    // Texto digitado pelo usuario comecando com "=" etc. viraria formula ao abrir no Excel
    // (ex.: =HYPERLINK(...)). O apostrofo faz a planilha mostrar como texto. Numeros ficam como estao.
    if (typeof value === "string" && str.length > 1 && FORMULA_START.test(str)) {
      str = `'${str}`;
    }
    if (/[",;\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const headerLine = headers.map((h) => escape(h.label)).join(";");
  const lines = rows.map((row) => headers.map((h) => escape(row[h.key])).join(";"));
  return [headerLine, ...lines].join("\n");
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
