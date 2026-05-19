# Sprint 2 — Divisão de Tarefas

**Entrega:** 19/05/2026
**Objetivo:** Implementação funcional das principais telas com operações CRUD (mínimo 2 telas), back-end com lógica de negócio operante, persistência de dados funcionando, integração com API externa, início da suíte de testes e documentação de casos de teste em andamento.

---

## Pessoa 1 — Backend: Autenticação e Usuários
**Responsável:** Noam Coelho

### Banco de dados
- [x] Executar a migration `0001_initial_migration.sql` no NeonDB
- [x] Validar conexão do servidor com o banco via `DATABASE_URL`

### Rotas a implementar
- [x] `POST /auth/register` — UC-01 (hash de senha com bcrypt, criar sessão)
- [x] `POST /auth/login` — UC-02 (validar credenciais, verificar sanção ativa, gerar JWT)
- [x] `POST /auth/logout` — UC-03 (revogar sessão)
- [x] `GET /users/:userId` — UC-04 (perfil público)
- [x] `PATCH /users/me` — UC-05 (editar perfil)
- [x] `DELETE /users/me` — UC-07 (soft delete + revogar sessões)
- [x] `POST /users/:userId/follow` — UC-08
- [x] `DELETE /users/:userId/follow` — UC-09

---

## Pessoa 2 — Backend: Posts, Feed e API Externa
**Responsável:** Rodrigo Marques

### Rotas a implementar
- [x] `POST /posts` — UC-11 (publicar, validar 280 chars)
- [x] `DELETE /posts/:postId` — UC-12 (soft delete, verificar autoria)
- [x] `POST /posts/:postId/like` — UC-13 (curtir)
- [x] `DELETE /posts/:postId/like` — UC-13 (descurtir)
- [x] `POST /posts/:postId/comments` — UC-14 (comentar)
- [x] `GET /feed` — UC-16 (posts dos seguidos, paginação por cursor)

### Integração com API externa
- [ ] `Integração com API ` - Dummy API
- [ ] `Usuários falsos` - Povoar a plataforma com usuários para post no feed 

---

## Pessoa 3 — Frontend, Testes e Documentação
**Responsável:** Nathalia Gama

### Telas funcionais (mínimo 2 CRUDs)
- [ ] `LoginPage` — formulário funcional conectado ao `authService.login()`
- [ ] `RegisterPage` — formulário funcional conectado ao `authService.register()`
- [ ] `NewPostPage` — formulário funcional conectado ao `postService.createPost()`
- [ ] `FeedPage` — listagem de posts com botão de curtir e deletar post próprio

> Essas 4 telas cobrem os CRUDs de **Usuário** (criar + ler via autenticação) e **Post** (criar + ler + deletar).

### Testes unitários
- [ ] Instalar e configurar **Vitest** no workspace `server`
- [ ] Escrever testes unitários para funções de validação (formato de username, limite de 280 chars, regra ban/suspension)
- [ ] Escrever testes unitários para `authService` e `postService` no frontend (`web`)

### Testes de integração (início)
- [ ] Instalar **Supertest** no `server`
- [ ] Escrever testes de integração para `POST /auth/register`
- [ ] Escrever testes de integração para `POST /auth/login`

### Documentação de casos de teste
- [ ] Criar `docs/casos-de-teste.md`
- [ ] Documentar casos de teste para UC-01, UC-02, UC-03, UC-11 e UC-12 com os campos: identificador, objetivo, pré-condições, dados de entrada, passos de execução, resultado esperado, resultado obtido e status

---

## Dependências entre as pessoas

```
Pessoa 1 finaliza auth  →  Pessoa 3 conecta LoginPage e RegisterPage
Pessoa 2 finaliza feed  →  Pessoa 3 conecta FeedPage e NewPostPage
Pessoas 1 e 2 finalizam rotas  →  Pessoa 3 escreve testes de integração
```

A recomendação é que as Pessoas 1 e 2 priorizem autenticação e posts o quanto antes para desbloquear o trabalho de frontend e testes da Pessoa 3.
