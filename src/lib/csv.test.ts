import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

type Row = { text: string | null; n?: number };
const csv = (rows: Row[]) => toCsv<Row>(rows, [{ key: "text", label: "Texto" }, { key: "n", label: "N" }]);

describe("toCsv", () => {
  it("usa ponto e virgula e escapa aspas, separador e quebra de linha", () => {
    expect(csv([{ text: 'disse "oi"; foi', n: 1 }])).toBe('Texto;N\n"disse ""oi""; foi";1');
    expect(csv([{ text: "linha1\r\nlinha2" }])).toBe('Texto;N\n"linha1\r\nlinha2";');
  });

  it("neutraliza texto que viraria formula no Excel", () => {
    expect(csv([{ text: '=HYPERLINK("http://x","clique")' }])).toBe(`Texto;N\n"'=HYPERLINK(""http://x"",""clique"")";`);
    expect(csv([{ text: "+5" }, { text: "@SOMA(A1)" }, { text: "-2+3" }])).toBe("Texto;N\n'+5;\n'@SOMA(A1);\n'-2+3;");
  });

  it("nao mexe em numeros negativos nem no traco sozinho", () => {
    expect(csv([{ text: "-", n: -5 }])).toBe("Texto;N\n-;-5");
    expect(csv([{ text: null }])).toBe("Texto;N\n;");
  });
});
