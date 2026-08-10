# Tai Project — Painel Web Administrativo

Painel web administrativo da plataforma industrial **Tai Project**, construído com
React + Vite + TypeScript (modo `strict`), usando **dados 100% simulados** e
persistência local (`localStorage`) — sem qualquer integração com Supabase,
banco de dados ou API externa nesta etapa.

O projeto foi desenhado desde o início para que a troca dos dados simulados por
dados reais (Supabase) seja incremental e não exija reescrever telas, formulários
ou regras de negócio.

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

> **Nota sobre este ambiente de geração**: o sandbox usado para criar este
> projeto não tem acesso à internet/registro npm, então `npm install`,
> `lint`, `typecheck`, `test` e `build` não puderam ser executados aqui.
> Rode os comandos acima no seu ambiente local para validar tudo — o código
> foi escrito e revisado manualmente para ser consistente com TypeScript
> `strict`, ESLint e a stack declarada abaixo.

## Usuários de demonstração

O login é **simulado**: qualquer um dos e-mails abaixo com a senha `demo123`
autentica na aplicação. A sessão é persistida em `localStorage` (chave
`tai:session`) com expiração de 8 horas, e pode ser encerrada pelo botão
"Sair da conta".

| Perfil     | E-mail                          | Senha     | Acesso                                   |
|------------|----------------------------------|-----------|-------------------------------------------|
| Master     | `app@taiproject.com.br`          | `demo123` | Todas as telas + Painel Master             |
| Operador   | `operador@teste.com.br`          | `demo123` | Dashboard, Apontamentos, O.S., Relatórios, Configurações |
| Visitante  | `visitante@smarttai.com.br`      | `demo123` | Mesmo conjunto de telas, perfil somente leitura na prática de negócio |

Usuários com o campo `status = inactive` (ex.: `alunos@smarttai.com.br`) têm o
login bloqueado com uma mensagem específica, para validar esse fluxo.

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
      mock/         # adaptadores mockados (implementam os contracts usando localStorage)
      index.ts      # ponto único de resolução dos repositórios usados pela app
    mocks/          # dados simulados (seed) realistas para todas as entidades
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
- Nenhuma chave, segredo ou credencial real está presente no projeto.

## Como os mocks funcionam

- `data/mocks/seed-*.ts` contém os dados iniciais (empresas, usuários, setores,
  máquinas, apontamentos, ordens de serviço), inspirados nas telas de
  referência fornecidas.
- `data/repositories/mock/mock-db.ts` garante que, na primeira execução, esses
  dados sejam copiados para o `localStorage` (chaves com prefixo `tai:`). A
  partir daí, todas as operações de criar/editar/excluir feitas na interface
  persistem ali — os arquivos de seed **nunca são reescritos**.
- Cada adaptador em `data/repositories/mock/*.repository.mock.ts` implementa
  uma interface de `data/contracts/`, simulando latência de rede (`simulateNetwork`
  em `lib/utils.ts`) para validar estados de carregamento, sucesso, lista vazia
  e erro na interface.
- Para reiniciar os dados simulados do zero, basta limpar o `localStorage` do
  navegador (ou usar o modo anônimo).

## Como substituir os repositórios mockados por Supabase no futuro

1. Criar, para cada interface em `src/data/contracts/*.repository.ts`, uma
   implementação equivalente que use o cliente `@supabase/supabase-js`
   (ex.: `SupabaseAppointmentRepository implements AppointmentRepository`).
2. Trocar as instâncias em `src/data/repositories/index.ts` pelas novas
   implementações Supabase — nenhuma tela, hook de query ou formulário
   precisa mudar, pois todos dependem apenas das interfaces.
3. Adicionar as variáveis de ambiente do Supabase (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_PUBLISHABLE_KEY`) e o SDK como dependência nesse momento —
   propositalmente **não foram adicionados agora**, conforme solicitado.
4. Os enums e schemas Zod em `domain/` já refletem o vocabulário de negócio
   esperado (status de máquina, de O.S., perfis de usuário) e podem ser
   reaproveitados nas policies/validações do backend.

## O que pode ser compartilhado com o futuro app React Native

Pensados desde o início para não terem dependência de DOM/navegador:

- `src/domain/` inteiro (entities, schemas Zod, enums) — validações e regras
  de negócio idênticas em web e mobile.
- `src/data/contracts/` — as interfaces de repositório.
- `src/data/repositories/mock/` (ou, no futuro, as implementações Supabase) —
  podem ser publicadas como pacote compartilhado e consumidas tanto pelo
  painel web quanto pelo app React Native.
- `src/lib/utils.ts`, `src/lib/labels.ts` — funções puras sem dependência de
  React DOM (evitar apenas `lib/csv.ts` e `lib/storage.ts`, que usam APIs de
  navegador; no RN seriam trocados por equivalentes nativos).

O que **não** deve ser compartilhado: `components/ui`, `components/layout`,
`features/**/*-page.tsx` e tudo que usa Tailwind/DOM — essas camadas serão
reimplementadas nativamente no React Native, consumindo os mesmos hooks de
`queries.ts` sempre que possível (eles já dependem apenas do TanStack Query e
dos contracts, não de HTML).

## Telas implementadas

1. **Login** (`/login`) — simulado, com mostrar/ocultar senha, validação Zod,
   mensagem de credenciais inválidas, estado de carregamento e atalhos para
   preencher as contas de demonstração.
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
