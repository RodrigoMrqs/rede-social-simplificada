# Ágora

Plataforma de microblogging no estilo X/Twitter. Usuários publicam posts curtos, seguem outras pessoas e interagem via curtidas, comentários e reposts. Administradores contam com painel de moderação e visualização de métricas.

---

## Equipe

- Rodrigo Marques Matos da Silva
- Nathalia Gama da Silva Gomes
- Noam Geraldo Ismael Coelho

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 15 + React 19 + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Banco de dados | NeonDB (PostgreSQL serverless) |
| ORM | Drizzle ORM |
| Autenticação | JWT + tabela de sessões |
| Testes | Vitest + Supertest |

---

## Estrutura do repositório

```
web/        # Aplicação web (Next.js — App Router)
server/     # API REST (Express)
db/         # Schema Drizzle e migrations SQL
docs/       # Casos de uso e casos de teste
```

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- [npm](https://www.npmjs.com/) v9 ou superior
- Conta no [NeonDB](https://neon.tech/) com um banco criado

---

## Configuração do ambiente

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd rede-social-simplificada
```

### 2. Configure o backend

Crie o arquivo `server/.env`:

```env
DATABASE_URL=postgresql://user:password@host-pooler.neon.tech/dbname?sslmode=require
JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRES_IN=7d
APP_ENV=development
PORT=3001
```

> Use sempre a URL com o sufixo `-pooler` do Neon para conexões serverless.

### 3. Configure o frontend

Crie o arquivo `web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Instalação das dependências

Na raiz do projeto (instala `web` e `server` via npm workspaces):

```bash
npm install
```

---

## Banco de dados

Execute as migrations para criar todas as tabelas:

```bash
psql $DATABASE_URL -f db/migrations/0001_initial_migration.sql
psql $DATABASE_URL -f db/migrations/0002_add_direct_messages.sql
```

Ou cole o conteúdo de cada arquivo no SQL Editor do painel do NeonDB.

### Popular o banco com dados de exemplo (opcional)

```bash
cd server
npm run db:seed
```

O seed usa a [FakerAPI](https://fakerapi.it) — não requer cadastro nem chave de API. Insere 10 usuários e 30 posts. Senha de todos os usuários seed: `Seed@12345`.

---

## Rodando o projeto

Abra **dois terminais**.

### Terminal 1 — Backend

```bash
cd server
npm run dev
```

O servidor sobe em `http://localhost:3001`.

### Terminal 2 — Frontend

```bash
cd web
npm run dev
```

A aplicação sobe em `http://localhost:3000`. Acesse pelo navegador.

---

## Testes

### Rodar todos os testes do backend (unitários + integração)

```bash
cd server
npm test
```

### Rodar todos os testes do frontend (unitários de serviços)

```bash
cd web
npm test
```

### Gerar relatório de cobertura

```bash
# backend
cd server && npm run test:coverage

# frontend
cd web && npm run test:coverage
```

---

## Testes E2E

Testes de ponta a ponta (End-to-End) usando **Playwright** para validar fluxos completos da aplicação no navegador real.

### Pré-requisitos

- Backend rodando em `http://localhost:3001`
- Frontend rodando em `http://localhost:3000`
- Banco de dados populado com dados de seed

### Rodar testes E2E

```bash
cd web
npm run test:e2e
```

### Rodar testes E2E no modo UI (com interface visual)

```bash
cd web
npm run test:e2e:ui
```

### Visualizar relatório de testes

```bash
cd web
npm run test:e2e:report
```

### Casos de teste E2E

Os testes cobrem os principais fluxos da plataforma:

#### Autenticação (auth.spec.ts)
- **E2E-01** — Cadastro via formulário redireciona para `/feed`
- **E2E-02** — Login com credenciais válidas redireciona para `/feed`
- **E2E-03** — Login com senha incorreta exibe mensagem de erro
- **E2E-04** — Cadastro com username já existente exibe erro

#### Publicação de Posts (posts.spec.ts)
- **E2E-05** — Publicar post via formulário aparece no feed
- **E2E-06** — Curtir post incrementa contador
- **E2E-07** — Descurtir post decrementa contador

#### Seguir Usuários (follow.spec.ts)
- **E2E-08** — Seguir usuário muda botão para "Seguindo"
- **E2E-09** — Deixar de seguir muda botão de volta para "Seguir"
- **Seguindo** — seguir/deixar de seguir usuários

Os relatórios são gerados em `coverage/` dentro de cada pasta.

---

## Documentação

| Arquivo | Conteúdo |
|---|---|
| `docs/casos-de-uso.md` | 28 casos de uso completos (ator, pré-condições, fluxos, pós-condições) |
| `docs/casos-de-teste.md` | Casos de teste documentados por UC (identificador, objetivo, dados, resultado) |
| `docs/sprint2-tarefas.md` | Divisão de tarefas do Sprint 2 por integrante |
