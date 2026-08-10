# Tai Project — Painel Web Administrativo

Painel web administrativo da plataforma industrial **Tai Project**, construído com
React + Vite + TypeScript (modo `strict`), integrado ao **Supabase** (projeto
"TAI", banco `nmoyvzglbzamguzapoag`) — o mesmo backend já usado pelo app mobile.

O projeto foi desenhado desde o início com uma camada de repositórios baseada em
interfaces (`data/contracts`), o que permitiu trocar as implementações mockadas
por implementações reais em Supabase (`data/repositories/supabase`) sem reescrever
telas, formulários ou regras de negócio. As implementações mockadas com
`localStorage` continuam no projeto (`data/repositories/mock`) como referência,
mas não são mais usadas em runtime.

## Como instalar e executar

Pré-requisitos: Node.js 18+ e npm.

```bash
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_PUBLISHABLE_KEY`
(a chave anônima/publicável do projeto "TAI") antes de rodar `npm run dev` —
sem ela, a aplicação não consegue falar com o Supabase.

Outros scripts disponíveis:

```bash
npm run build      # typecheck (tsc -b) + build de produção (vite build)
npm run preview    # servir o build de produção localmente
npm run lint        # ESLint
npm run typecheck   # apenas checagem de tipos
npm run test         # testes unitários (Vitest)
```

> **Nota sobre este ambiente de geração**: o sandbox usado para criar este
> projeto não tem acesso à internet/registro npm, então `npm install`,
> `lint`, `typecheck`, `test` e `build` não puderam ser executados aqui.
> Rode os comandos acima no seu ambiente local para validar tudo — o código
> foi escrito e revisado manualmente para ser consistente com TypeScript
> `strict`, ESLint e a stack declarada abaixo.

## Autenticação

O login usa **Supabase Auth** real (`signInWithPassword`), com a sessão
validada contra o servidor (`getUser()`) antes de considerar o usuário
autenticado — não é mais um login simulado nem persistido em `localStorage`.
É necessário um usuário real cadastrado no Supabase Auth **e** uma linha
correspondente na tabela `User` (vinculada por `idRef`); login sem cadastro
vinculado é rejeitado.

Usuários com `status` mapeado como `inactive` têm o login bloqueado com uma
mensagem específica. Veja `src/lib/supabase/README.md` para o detalhe do
mapeamento de papéis (`tipo`) e status vindos do schema legado.

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
                     # implementação — mock ou Supabase — deve seguir)
    repositories/
      mock/         # adaptadores mockados legados (localStorage) — não usados em runtime
      supabase/     # adaptadores reais (implementam os contracts usando @supabase/supabase-js)
      index.ts      # ponto único de resolução dos repositórios usados pela app (hoje: Supabase)
    mocks/          # dados simulados (seed) usados pelos adaptadores mock legados
  hooks/            # hooks utilitários (debounce, media query, disclosure, toast)
  lib/               # utilitários puros (cn, csv, storage, labels, simulateNetwork)
  lib/supabase/      # cliente Supabase, mapeadores de linha do banco e lookups auxiliares
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
- Nenhuma chave/credencial real está commitada no repositório — `.env.local`
  (com a URL e a chave publicável/anon do Supabase) está no `.gitignore`;
  apenas `.env.example`, sem valores sensíveis, é versionado.

## Integração com Supabase

Todos os domínios (`auth`, `companies`, `users`, `sectors`, `machines`,
`indicators`, `workOrders`, `appointments`, `reports`) são resolvidos em
`src/data/repositories/index.ts` para implementações reais em
`src/data/repositories/supabase/*.repository.supabase.ts`, que usam o cliente
`@supabase/supabase-js` (`src/lib/supabase/client.ts`) contra o projeto "TAI"
(banco `nmoyvzglbzamguzapoag`, o mesmo já usado pelo app mobile).

Como toda a interface sempre dependeu apenas das interfaces em
`data/contracts/`, a troca das implementações mockadas pelas de Supabase não
exigiu mudar nenhuma tela, hook de query ou formulário.

Pontos importantes:

- As tabelas, colunas e RLS são do **schema legado já existente** — nenhuma
  tabela, coluna, policy ou função nova foi criada pelos adaptadores.
- Existem decisões de mapeamento entre o schema legado e o domínio do painel
  (ex.: papéis de usuário, status de empresa/usuário, status de O.S.) e
  algumas pendências que dependem de decisão (ex.: criação de usuário via
  Edge Function, RLS aberta). Tudo documentado em `src/lib/supabase/README.md`.
- As variáveis de ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
  são obrigatórias para rodar a aplicação (ver `.env.example`).

## Como os mocks (legados) funcionam

As implementações mockadas com `localStorage` continuam no projeto em
`data/repositories/mock/` como referência histórica, mas **não são usadas em
runtime** — `data/repositories/index.ts` resolve tudo para as implementações
Supabase. `data/mocks/seed-*.ts` contém os dados simulados originais usados
antes da integração real.

## O que pode ser compartilhado com o futuro app React Native

Pensados desde o início para não terem dependência de DOM/navegador:

- `src/domain/` inteiro (entities, schemas Zod, enums) — validações e regras
  de negócio idênticas em web e mobile.
- `src/data/contracts/` — as interfaces de repositório.
- `src/data/repositories/supabase/` — as implementações reais dos
  repositórios podem ser publicadas como pacote compartilhado e consumidas
  tanto pelo painel web quanto pelo app React Native.
- `src/lib/utils.ts`, `src/lib/labels.ts` — funções puras sem dependência de
  React DOM (evitar apenas `lib/csv.ts` e `lib/storage.ts`, que usam APIs de
  navegador; no RN seriam trocados por equivalentes nativos).

O que **não** deve ser compartilhado: `components/ui`, `components/layout`,
`features/**/*-page.tsx` e tudo que usa Tailwind/DOM — essas camadas serão
reimplementadas nativamente no React Native, consumindo os mesmos hooks de
`queries.ts` sempre que possível (eles já dependem apenas do TanStack Query e
dos contracts, não de HTML).

## Telas implementadas

1. **Login** (`/login`) — autenticação real via Supabase Auth, com
   mostrar/ocultar senha, validação Zod, mensagem de credenciais inválidas e
   estado de carregamento.
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
