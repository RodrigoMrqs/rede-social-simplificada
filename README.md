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

---

## Estrutura do repositório

```
web/        # Aplicação web (Next.js — App Router)
server/     # API REST (Express)
db/         # Schema Drizzle e migrations SQL
```

### Estrutura do frontend (web/)

```
web/
  app/
    layout.tsx                  # Layout raiz com AuthProvider
    page.tsx                    # Redireciona para /feed
    login/page.tsx              # UC-02
    register/page.tsx           # UC-01
    feed/page.tsx               # UC-16, UC-13, UC-14, UC-15
    post/
      new/page.tsx              # UC-11
      [id]/page.tsx             # UC-14
    profile/[username]/page.tsx # UC-04, UC-05, UC-08, UC-09
    search/page.tsx             # UC-18
    notifications/page.tsx      # UC-17
    settings/page.tsx           # UC-06, UC-07
    admin/
      dashboard/page.tsx        # UC-19, UC-22
      moderation/page.tsx       # UC-20, UC-21
  components/                   # Componentes reutilizáveis
  hooks/
    useAuth.ts
  services/
    api.ts
    authService.ts
    postService.ts
    userService.ts
    notificationService.ts
  store/
    AuthContext.tsx
  types/
    index.ts
```

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v18 ou superior
- [npm](https://www.npmjs.com/) v9 ou superior
- Conta no [NeonDB](https://neon.tech/) com um banco criado

---

## Configuração do ambiente

1. Clone o repositório:

```bash
git clone <url-do-repositorio>
cd rede-social-simplificada
```

2. Copie o arquivo de variáveis de ambiente e preencha os valores:

```bash
cp .env.example server/.env
```

Edite `server/.env`:

```env
DATABASE_URL=postgresql://user:password@host-pooler.neon.tech/dbname?sslmode=require
JWT_SECRET=sua_chave_secreta_aqui
JWT_EXPIRES_IN=7d
APP_ENV=development
PORT=3000
```

> Use sempre a URL com o sufixo `-pooler` do Neon para conexões serverless.

3. Crie o arquivo de variáveis do frontend:

```bash
echo NEXT_PUBLIC_API_URL=http://localhost:3000 > web/.env.local
```

---

## Instalação das dependências

Na raiz do projeto (instala `web` e `server` de uma vez via npm workspaces):

```bash
npm install
```

---

## Banco de dados

Execute a migration inicial para criar todas as tabelas:

```bash
psql $DATABASE_URL -f db/migrations/0001_initial_migration.sql
```

Ou cole o conteúdo do arquivo diretamente no SQL Editor do painel do NeonDB.

---

## Rodando o projeto

### Backend (servidor Express)

```bash
npm run server
```

O servidor sobe em `http://localhost:3000`.

### Frontend (Next.js)

```bash
npm run web
```

A aplicação sobe em `http://localhost:3001` (Next.js escolhe a porta automaticamente se 3000 estiver ocupada).