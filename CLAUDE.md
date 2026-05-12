# CLAUDE.md — Contexto do projeto

## O que é este projeto

Plataforma de microblogging (estilo X/Twitter) simplificada. Usuários publicam posts curtos,
seguem outros usuários e interagem via curtidas, comentários e reposts. Admins têm painel
de moderação e métricas.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React Native + TypeScript |
| Backend | TypeScritp |
| Banco de dados | NeonDB (PostgreSQL serverless) |
| ORM | Drizzle ORM ou Prisma (ainda não decidido) |
| Autenticação | JWT + tabela de sessões no banco |
| Storage de mídia | Fora do MVP — só texto por enquanto |

---

## Atores do sistema

- **Usuário Comum** — cria conta, publica posts, segue pessoas, interage
- **Administrador** — modera posts, suspende/bane usuários, vê métricas. Identificado por tabela separada `admins`, não por campo `role`
- **Visitante** — não autenticado, acesso restrito

---

## Estrutura de pastas

```
app/
  components/       # Componentes reutilizáveis
  screens/
    auth/           # LoginScreen.tsx, RegisterScreen.tsx
    feed/           # FeedScreen.tsx
    post/           # NewPostScreen.tsx, PostDetailScreen.tsx
    profile/        # ProfileScreen.tsx
    search/         # SearchScreen.tsx
    notifications/  # NotificationsScreen.tsx
    settings/       # SettingsScreen.tsx
    admin/          # DashboardScreen.tsx, ModerationScreen.tsx
  navigation/       # React Navigation — stacks e tabs
  hooks/            # Custom hooks (prefixo use*)
  services/         # Chamadas à API / banco
  store/            # Estado global (Zustand ou Context)
  types/            # Tipos TypeScript compartilhados
db/
  migrations/
    0001_initial_migration.sql   # schema completo já rodado
```

---

## Banco de dados — tabelas e responsabilidades

| Tabela | Responsabilidade |
|---|---|
| `users` | Contas. Soft delete via `deleted_at` |
| `admins` | Admins vinculados a um `user_id`. Permissões granulares em `admin_permissions` |
| `admin_permissions` | ENUM: `moderate_posts`, `sanction_users`, `view_metrics`, `manage_admins` |
| `sessions` | Sessões JWT armazenadas para revogação ao banir/suspender |
| `user_sanctions` | Histórico de suspensões (`expires_at` preenchido) e bans (`expires_at` NULL) |
| `follows` | Chave composta `(follower_id, followed_id)`. CHECK impede auto-follow |
| `posts` | Posts e reposts unificados. Repost = `repost_of_id` preenchido. Soft delete duplo: `deleted_at` (autor) e `hidden_at` (admin) |
| `post_likes` | Chave composta `(user_id, post_id)`. Descurtir = DELETE |
| `comments` | Comentários planos (sem aninhamento no MVP). Soft delete via `deleted_at` |
| `notifications` | Polimórfica via `type` ENUM. Colunas opcionais `post_id` e `comment_id` |
| `notification_preferences` | 1:1 com `users`. Criada junto com a conta |
| `moderation_logs` | Auditoria imutável de ações admin (hide, delete, restore) |

### Regras importantes do schema

- Todo soft delete usa `deleted_at TIMESTAMPTZ` (NULL = ativo)
- Reposts são registros em `posts` com `is_repost_simple = TRUE` (sem texto) ou `FALSE` (com comentário)
- `hidden_by` em `posts` referencia `admins(id)`, não `users(id)`
- Ban nunca tem `expires_at`; suspension sempre tem — há CHECK constraint para isso
- Índices de busca textual usam `tsvector` em português (`'portuguese'`)
- Usar sempre endpoint `-pooler` do Neon para conexões serverless

---

## Variáveis de ambiente esperadas

```env
DATABASE_URL=postgresql://user:password@host-pooler.neon.tech/dbname?sslmode=require
JWT_SECRET=...
JWT_EXPIRES_IN=7d
APP_ENV=development
```

---

## Casos de uso implementados (22 no total)

### Autenticação (UC-01 a UC-03)
- UC-01 Cadastro — cria conta + `notification_preferences` juntos
- UC-02 Login — valida credenciais, grava sessão em `sessions`
- UC-03 Logout — revoga sessão (`revoked_at = NOW()`)

### Perfil e Configurações (UC-04 a UC-07)
- UC-04 Visualizar perfil — próprio ou de terceiros, mesma tela
- UC-05 Editar perfil — nome, bio, avatar, capa
- UC-06 Configurações — senha, privacidade, preferências de notificação
- UC-07 Excluir conta — soft delete (`deleted_at`), encerra sessões

### Relacionamento (UC-08 a UC-10)
- UC-08 Seguir — INSERT em `follows`, dispara notificação `follow`
- UC-09 Deixar de seguir — DELETE de `follows`
- UC-10 Listar seguidores/seguindo — paginado

### Posts e Interações (UC-11 a UC-15)
- UC-11 Publicar — máximo 280 caracteres, somente texto no MVP
- UC-12 Excluir post — soft delete pelo autor (`deleted_at`)
- UC-13 Curtir/descurtir — INSERT/DELETE em `post_likes`, notificação `like`
- UC-14 Comentar — INSERT em `comments`, notificação `comment`
- UC-15 Repostar — INSERT em `posts` com `repost_of_id`, notificação `repost`

### Feed e Descoberta (UC-16 a UC-18)
- UC-16 Feed — posts + reposts dos seguidos, ordenados por `created_at DESC`
- UC-17 Notificações — lista por `recipient_id`, badge conta `read_at IS NULL`
- UC-18 Busca — GIN index em `users` (display_name + username) e `posts` (content)

### Administração (UC-19 a UC-22)
- UC-19 Painel admin — rota protegida por `admins` table, não por campo `role`
- UC-20 Moderar post — `hidden_at` / `deleted_at` em `posts` + registro em `moderation_logs`
- UC-21 Suspender/banir — INSERT em `user_sanctions` + revogar sessões ativas do usuário
- UC-22 Métricas — queries de agregação, sem tabela dedicada no MVP

---

## Telas existentes (11 no total)

1. `LoginScreen` — UC-02
2. `RegisterScreen` — UC-01
3. `FeedScreen` — UC-16, UC-13, UC-14, UC-15
4. `NewPostScreen` — UC-11
5. `PostDetailScreen` — UC-14
6. `ProfileScreen` — UC-04, UC-05, UC-08, UC-09 (mesma tela para próprio e terceiros)
7. `SearchScreen` — UC-18
8. `SettingsScreen` — UC-06, UC-07
9. `NotificationsScreen` — UC-17
10. `DashboardScreen` — UC-19, UC-22
11. `ModerationScreen` — UC-20, UC-21

---

## Convenções de código

```
Componentes/Telas  → PascalCase          (FeedScreen.tsx, PostCard.tsx)
Hooks              → camelCase + use*     (useFeed.ts, useAuth.ts)
Serviços           → camelCase + Service  (postService.ts, authService.ts)
Tipos              → PascalCase           (type Post, type User)
Interfaces         → prefixo I            (interface IUserProfile)
Constantes         → UPPER_SNAKE_CASE     (MAX_POST_LENGTH = 280)
```

### Branches Git
```
main          → produção
dev           → desenvolvimento
feature/nome  → novas funcionalidades
fix/nome      → correções
```

### Commits (Conventional Commits)
```
feat: descrição curta
fix: descrição curta
chore: descrição curta
docs: descrição curta
```

---

## O que NÃO está no MVP

- Upload de mídia (imagens/vídeo) — banco só terá `avatar_url` e `cover_url` como URLs externas
- Mensagens diretas (DM)
- Comentários aninhados (threads)
- Notificações em tempo real (push/websocket)
- Sistema de denúncias
- Fan-out de feed em cache (necessário só com escala)
