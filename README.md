# Tai Project — Painel Web Administrativo

Painel web administrativo da plataforma industrial **Tai Project**, construído com
React + Vite + TypeScript (modo `strict`).

O projeto foi desenhado desde o início com uma camada de repositórios baseada em
interfaces (`data/contracts`), o que permite trocar as implementações sem
reescrever telas, formulários ou regras de negócio. Hoje toda a aplicação roda
sobre dados **mockados** (`data/repositories/mock`, persistidos em
`localStorage`), sem nenhuma integração com backend externo.

## Como instalar e executar

Pré-requisitos: Node.js 18+ e npm.

```bash
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

Outros scripts disponíveis:

```bash
npm run build      # typecheck (tsc -b) + build de produção (vite build)
npm run preview    # servir o build de produção localmente
npm run lint        # ESLint
npm run typecheck   # apenas checagem de tipos
npm run test         # testes unitários (Vitest)
```

## Autenticação

O login é simulado: valida contra os usuários mockados em
`src/data/mocks/seed-users.ts` e a senha de demonstração definida em
`DEMO_PASSWORD` (mesmo arquivo). A sessão é persistida em `localStorage`.

Usuários com `status` mapeado como `inactive` têm o login bloqueado com uma
mensagem específica.

Somente usuários com perfil **Master** enxergam o item **Painel Master** no
menu e conseguem acessar `/painel-master` — qualquer outro perfil que tente
acessar essa rota diretamente é redirecionado para `/acesso-negado` (403).

## Estrutura do projeto

```text
src/
  app/              # bootstrap da aplicação (App, providers globais)
  components/
    ui/             # componentes de design system (Button, Input, Dialog, Select pesquisável, etc.)
    layout/         # Sidebar, AppShell, ProtectedRoute, RoleGuard, drawer mobile
  features/         # uma pasta por domínio de tela (auth, dashboard, appointments,
                     # work-orders, reports, settings, companies, errors)
    <feature>/
      <feature>-page.tsx      # componente de página (rota)
      queries.ts               # hooks do TanStack Query (leitura/escrita)
      components/              # componentes específicos da feature (formulários, cards)
  domain/
    entities/       # tipos de domínio (Company, User, Machine, Appointment, WorkOrder...)
    schemas/        # validações Zod + tipos inferidos para formulários
    types/          # enums (status de máquina, de O.S., perfis de usuário...)
  data/
    contracts/      # interfaces de repositório (o "contrato" que qualquer
                     # implementação deve seguir)
    repositories/
      mock/         # adaptadores mockados (localStorage) — usados em runtime
      index.ts      # ponto único de resolução dos repositórios usados pela app
    mocks/          # dados simulados (seed) usados pelos adaptadores mock
  hooks/            # hooks utilitários (debounce, media query, disclosure, toast)
  lib/               # utilitários puros (cn, csv, storage, labels, simulateNetwork)
  routes/           # configuração do React Router
  styles/           # CSS global + tokens Tailwind
```

Regras de arquitetura seguidas no código:

- **Componentes nunca importam os arquivos de `data/mocks` diretamente.** Toda
  leitura/escrita passa pelas interfaces em `data/contracts` e é resolvida via
  `data/repositories/index.ts`.
- **Regras de negócio, tipos e validações (`domain/`) não importam nada de
  React** — são módulos puros em TypeScript, prontos para serem extraídos para
  um pacote compartilhado com o futuro app React Native.

## Como os mocks funcionam

As implementações em `data/repositories/mock/` usam `localStorage` como
"banco" — na primeira execução, os dados de `data/mocks/seed-*.ts` são
copiados para `localStorage`; a partir daí, toda leitura/escrita passa a usar
o que está persistido lá, então edições feitas no painel sobrevivem a
navegações e recarregamentos (até que o `localStorage` seja limpo).

## O que pode ser compartilhado com o futuro app React Native

Pensados desde o início para não terem dependência de DOM/navegador:

- `src/domain/` inteiro (entities, schemas Zod, enums) — validações e regras
  de negócio idênticas em web e mobile.
- `src/data/contracts/` — as interfaces de repositório.
- `src/lib/utils.ts`, `src/lib/labels.ts` — funções puras sem dependência de
  React DOM (evitar apenas `lib/csv.ts` e `lib/storage.ts`, que usam APIs de
  navegador; no RN seriam trocados por equivalentes nativos).

O que **não** deve ser compartilhado: `components/ui`, `components/layout`,
`features/**/*-page.tsx` e tudo que usa Tailwind/DOM — essas camadas serão
reimplementadas nativamente no React Native, consumindo os mesmos hooks de
`queries.ts` sempre que possível (eles já dependem apenas do TanStack Query e
dos contracts, não de HTML).

## Telas implementadas

1. **Login** (`/login`) — autenticação simulada, com mostrar/ocultar senha,
   validação Zod, mensagem de credenciais inválidas e estado de carregamento.
2. **Dashboard** (`/dashboard`) — indicadores de OEE/Disponibilidade/
   Produtividade/Qualidade com sparkline, filtros por setor/máquina/status/
   vibração alta/temperatura alta, cards de máquina com horímetro, vibração,
   temperatura, velocidade e produção atual.
3. **Apontamentos** (`/apontamentos`) — listagem paginada, filtros (período,
   setor, máquina dependente do setor, lançador), criação/edição/visualização/
   exclusão com confirmação, modal responsivo.
4. **Ordem de Serviço** (`/ordens-de-servico`) — listagem, busca, filtros,
   criação/edição, detalhes, status (Lançada, Em andamento, Concluída,
   Atrasada, Cancelada), exclusão com confirmação.
5. **Relatórios** (`/relatorios`) — filtros por período/setor/máquina, tabela
   responsiva com OEE/D/P/Q, horímetro, vibração, temperatura e produção, e
   **exportação em CSV** dos dados filtrados.
6. **Configurações** (`/configuracoes`) — perfil da empresa com upload
   simulado de logotipo (preview, validação de formato e tamanho) e
   gerenciamento de usuários (criar, editar, ativar/desativar).
7. **Painel Master** (`/painel-master`, somente perfil Master) — listar,
   buscar, criar, editar, ativar/desativar empresas, com confirmação para
   ações destrutivas.
8. **Acesso negado** (`/acesso-negado`) — página 403 para rotas restritas.
9. **404** (`*`) — página para rotas inexistentes.

## Decisões de design

- Tema escuro industrial (fundo azul-marinho, cards azul-acinzentados, azul
  elétrico como cor primária, verde/laranja/vermelho para sucesso/alerta/erro),
  seguindo a identidade das referências fornecidas.
- Select pesquisável e personalizado (`components/ui/searchable-select.tsx`)
  em todos os filtros e formulários, usando `@radix-ui/react-popover` para
  nunca cortar o dropdown, resolvendo o problema visto nas referências.
- Sidebar recolhível no desktop (estado persistido) e drawer no mobile.
- Tabelas com rolagem horizontal controlada em vez de vazar da página; nenhuma
  funcionalidade fica escondida no mobile.
