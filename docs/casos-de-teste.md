# Documentação de Casos de Teste

**Projeto:** Ágora — Plataforma de Microblogging  
**Versão:** Sprint 2  
**Responsável:** Rodrigo Marques Matos da Silva

---

## UC-01 — Cadastro de Usuário

### CT-01 — Cadastro com dados válidos

| Campo | Descrição |
|---|---|
| **Identificador** | CT-01 |
| **Objetivo** | Verificar que um novo usuário é criado com sucesso e uma sessão é iniciada |
| **Pré-condições** | Username e e-mail não cadastrados; servidor rodando |
| **Dados de entrada** | `username: "rodrigo_01"`, `displayName: "Rodrigo"`, `email: "rodrigo@example.com"`, `password: "Senha@123"` |
| **Passos de execução** | 1. Enviar POST /auth/register com os dados acima |
| **Resultado esperado** | HTTP 201 com `{ token: "...", user: { id, username, ... } }` |
| **Resultado obtido** | HTTP 201 — token JWT e objeto de usuário retornados |
| **Status** | ✅ Passou |

---

### CT-02 — Cadastro com username inválido (caractere especial)

| Campo | Descrição |
|---|---|
| **Identificador** | CT-02 |
| **Objetivo** | Verificar que usernames com caracteres inválidos são rejeitados |
| **Pré-condições** | Servidor rodando |
| **Dados de entrada** | `username: "nome@invalido"`, demais campos válidos |
| **Passos de execução** | 1. Enviar POST /auth/register com username inválido |
| **Resultado esperado** | HTTP 422 com mensagem de validação |
| **Resultado obtido** | HTTP 422 — `{ message: "Dados inválidos", errors: [...] }` |
| **Status** | ✅ Passou |

---

### CT-03 — Cadastro com senha curta (menos de 8 caracteres)

| Campo | Descrição |
|---|---|
| **Identificador** | CT-03 |
| **Objetivo** | Verificar que senhas curtas são rejeitadas |
| **Pré-condições** | Servidor rodando |
| **Dados de entrada** | `password: "123"`, demais campos válidos |
| **Passos de execução** | 1. Enviar POST /auth/register com senha inválida |
| **Resultado esperado** | HTTP 422 |
| **Resultado obtido** | HTTP 422 — validação de senha rejeitada |
| **Status** | ✅ Passou |

---

### CT-04 — Cadastro com e-mail inválido

| Campo | Descrição |
|---|---|
| **Identificador** | CT-04 |
| **Objetivo** | Verificar que e-mails mal formatados são rejeitados |
| **Pré-condições** | Servidor rodando |
| **Dados de entrada** | `email: "nao-e-email"`, demais campos válidos |
| **Passos de execução** | 1. Enviar POST /auth/register com e-mail inválido |
| **Resultado esperado** | HTTP 422 |
| **Resultado obtido** | HTTP 422 — e-mail rejeitado pelo Zod |
| **Status** | ✅ Passou |

---

### CT-05 — Cadastro com body vazio

| Campo | Descrição |
|---|---|
| **Identificador** | CT-05 |
| **Objetivo** | Verificar comportamento com payload ausente |
| **Pré-condições** | Servidor rodando |
| **Dados de entrada** | `{}` |
| **Passos de execução** | 1. Enviar POST /auth/register sem corpo |
| **Resultado esperado** | HTTP 422 |
| **Resultado obtido** | HTTP 422 — todos os campos são obrigatórios |
| **Status** | ✅ Passou |

---

### CT-06 — Cadastro com username já existente

| Campo | Descrição |
|---|---|
| **Identificador** | CT-06 |
| **Objetivo** | Verificar que username duplicado gera conflito |
| **Pré-condições** | Usuário com `username: "rodrigo_01"` já cadastrado |
| **Dados de entrada** | `username: "rodrigo_01"`, demais campos diferentes |
| **Passos de execução** | 1. Enviar POST /auth/register com username existente |
| **Resultado esperado** | HTTP 409 com `{ message: "Nome de usuário indisponível" }` |
| **Resultado obtido** | HTTP 409 — conflito detectado |
| **Status** | ✅ Passou |

---

## UC-02 — Login

### CT-07 — Login com credenciais corretas

| Campo | Descrição |
|---|---|
| **Identificador** | CT-07 |
| **Objetivo** | Verificar autenticação com dados válidos |
| **Pré-condições** | Usuário cadastrado e ativo |
| **Dados de entrada** | `username: "rodrigo_01"`, `password: "Senha@123"` |
| **Passos de execução** | 1. Enviar POST /auth/login com os dados |
| **Resultado esperado** | HTTP 200 com `{ token, user }` |
| **Resultado obtido** | HTTP 200 — sessão criada com JWT |
| **Status** | ✅ Passou |

---

### CT-08 — Login com senha incorreta

| Campo | Descrição |
|---|---|
| **Identificador** | CT-08 |
| **Objetivo** | Verificar que senha errada é rejeitada sem expor informações |
| **Pré-condições** | Usuário cadastrado |
| **Dados de entrada** | `username: "rodrigo_01"`, `password: "senha-errada"` |
| **Passos de execução** | 1. Enviar POST /auth/login com senha errada |
| **Resultado esperado** | HTTP 401 com `{ message: "Credenciais inválidas" }` |
| **Resultado obtido** | HTTP 401 — mensagem genérica (sem revelar se usuário existe) |
| **Status** | ✅ Passou |

---

### CT-09 — Login com usuário inexistente

| Campo | Descrição |
|---|---|
| **Identificador** | CT-09 |
| **Objetivo** | Verificar que usuário não encontrado retorna erro genérico |
| **Pré-condições** | Username não cadastrado |
| **Dados de entrada** | `username: "naoexiste"`, `password: "Senha@123"` |
| **Passos de execução** | 1. Enviar POST /auth/login |
| **Resultado esperado** | HTTP 401 com `{ message: "Credenciais inválidas" }` |
| **Resultado obtido** | HTTP 401 — mesmo erro de senha errada (sem enumeração de usuários) |
| **Status** | ✅ Passou |

---

### CT-10 — Login com body vazio

| Campo | Descrição |
|---|---|
| **Identificador** | CT-10 |
| **Objetivo** | Verificar comportamento com payload ausente |
| **Pré-condições** | Servidor rodando |
| **Dados de entrada** | `{}` |
| **Passos de execução** | 1. Enviar POST /auth/login sem corpo |
| **Resultado esperado** | HTTP 401 |
| **Resultado obtido** | HTTP 401 |
| **Status** | ✅ Passou |

---

## UC-03 — Logout

### CT-17 — Logout com token válido

| Campo | Descrição |
|---|---|
| **Identificador** | CT-17 |
| **Objetivo** | Verificar que sessão é revogada ao fazer logout |
| **Pré-condições** | Usuário autenticado com token ativo |
| **Dados de entrada** | Header `Authorization: Bearer <token>` |
| **Passos de execução** | 1. Enviar POST /auth/logout com o token |
| **Resultado esperado** | HTTP 200 com `{ message: "Logout realizado" }`; sessão marcada como revogada |
| **Resultado obtido** | HTTP 200 — `revokedAt` preenchido no banco |
| **Status** | ✅ Passou |

---

## UC-11 — Publicar Post

### CT-18 — Publicar post com conteúdo válido

| Campo | Descrição |
|---|---|
| **Identificador** | CT-18 |
| **Objetivo** | Verificar criação de post com conteúdo dentro do limite |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `content: "Olá mundo!"`, token válido |
| **Passos de execução** | 1. Enviar POST /posts com o conteúdo e o token |
| **Resultado esperado** | HTTP 201 com objeto do post criado |
| **Resultado obtido** | HTTP 201 — post persistido no banco |
| **Status** | ✅ Passou |

---

### CT-19 — Publicar post com conteúdo acima de 280 caracteres

| Campo | Descrição |
|---|---|
| **Identificador** | CT-19 |
| **Objetivo** | Verificar que conteúdo excedendo 280 chars é rejeitado |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `content: "a".repeat(281)`, token válido |
| **Passos de execução** | 1. Enviar POST /posts com conteúdo longo |
| **Resultado esperado** | HTTP 400 com mensagem de validação |
| **Resultado obtido** | HTTP 400 — `{ message: "Conteúdo inválido" }` |
| **Status** | ✅ Passou |

---

### CT-20 — Publicar post sem autenticação

| Campo | Descrição |
|---|---|
| **Identificador** | CT-20 |
| **Objetivo** | Verificar que rota exige autenticação |
| **Pré-condições** | Nenhum token fornecido |
| **Dados de entrada** | `content: "Olá!"` — sem Authorization header |
| **Passos de execução** | 1. Enviar POST /posts sem token |
| **Resultado esperado** | HTTP 401 |
| **Resultado obtido** | HTTP 401 — `{ message: "Não autorizado" }` |
| **Status** | ✅ Passou |

---

## UC-12 — Excluir Post

### CT-21 — Deletar post próprio

| Campo | Descrição |
|---|---|
| **Identificador** | CT-21 |
| **Objetivo** | Verificar soft delete de post pelo autor |
| **Pré-condições** | Usuário autenticado; post existe e pertence ao usuário |
| **Dados de entrada** | `postId` válido, token do autor |
| **Passos de execução** | 1. Enviar DELETE /posts/:postId com token do autor |
| **Resultado esperado** | HTTP 204; `deleted_at` preenchido no banco |
| **Resultado obtido** | HTTP 204 — post marcado como deletado |
| **Status** | ✅ Passou |

---

### CT-22 — Tentar deletar post de outro usuário

| Campo | Descrição |
|---|---|
| **Identificador** | CT-22 |
| **Objetivo** | Verificar que somente o autor pode deletar o post |
| **Pré-condições** | Usuário autenticado; post pertence a outro usuário |
| **Dados de entrada** | `postId` de post alheio, token de usuário diferente |
| **Passos de execução** | 1. Enviar DELETE /posts/:postId com token de outro usuário |
| **Resultado esperado** | HTTP 403 com `{ message: "Sem permissão" }` |
| **Resultado obtido** | HTTP 403 — deleção negada |
| **Status** | ✅ Passou |

---

### CT-23 — Tentar deletar post inexistente

| Campo | Descrição |
|---|---|
| **Identificador** | CT-23 |
| **Objetivo** | Verificar comportamento para postId inexistente |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `postId` de UUID inexistente no banco |
| **Passos de execução** | 1. Enviar DELETE /posts/:postId com ID inválido |
| **Resultado esperado** | HTTP 404 com `{ message: "Post não encontrado" }` |
| **Resultado obtido** | HTTP 404 |
| **Status** | ✅ Passou |

---

## UC-13 — Curtir / Descurtir Post

### CT-24 — Curtir post com token válido

| Campo | Descrição |
|---|---|
| **Identificador** | CT-24 |
| **Objetivo** | Verificar que `postService.likePost` envia POST /posts/:id/like corretamente |
| **Pré-condições** | Usuário autenticado; post existe |
| **Dados de entrada** | `token` válido, `postId` existente |
| **Passos de execução** | 1. Chamar `postService.likePost(token, postId)` |
| **Resultado esperado** | Fetch chamado com `POST /posts/:id/like`; resolve sem erro |
| **Resultado obtido** | Fetch chamado corretamente; sem rejeição |
| **Status** | ✅ Passou |

---

### CT-25 — Curtir post já curtido retorna conflito

| Campo | Descrição |
|---|---|
| **Identificador** | CT-25 |
| **Objetivo** | Verificar que `likePost` lança erro quando post já foi curtido |
| **Pré-condições** | Post já curtido pelo mesmo usuário |
| **Dados de entrada** | `token` e `postId` de post já curtido |
| **Passos de execução** | 1. Chamar `postService.likePost(token, postId)` |
| **Resultado esperado** | Rejeita com mensagem "Post já curtido" |
| **Resultado obtido** | Lança `Error("Post já curtido")` |
| **Status** | ✅ Passou |

---

### CT-26 — Descurtir post com token válido

| Campo | Descrição |
|---|---|
| **Identificador** | CT-26 |
| **Objetivo** | Verificar que `postService.unlikePost` envia DELETE /posts/:id/like corretamente |
| **Pré-condições** | Usuário autenticado; post curtido pelo usuário |
| **Dados de entrada** | `token` válido, `postId` existente |
| **Passos de execução** | 1. Chamar `postService.unlikePost(token, postId)` |
| **Resultado esperado** | Fetch chamado com `DELETE /posts/:id/like`; resolve sem erro |
| **Resultado obtido** | Fetch chamado corretamente |
| **Status** | ✅ Passou |

---

## UC-16 — Feed

### CT-27 — Obter feed autenticado

| Campo | Descrição |
|---|---|
| **Identificador** | CT-27 |
| **Objetivo** | Verificar que `postService.getFeed` chama GET /feed e retorna posts |
| **Pré-condições** | Usuário autenticado; existem posts de seguidos |
| **Dados de entrada** | `token` válido, sem cursor |
| **Passos de execução** | 1. Chamar `postService.getFeed(token)` |
| **Resultado esperado** | Retorna `{ items: [...], nextCursor }` |
| **Resultado obtido** | Array de posts retornado; nextCursor presente |
| **Status** | ✅ Passou |

---

### CT-28 — Feed com cursor de paginação

| Campo | Descrição |
|---|---|
| **Identificador** | CT-28 |
| **Objetivo** | Verificar que cursor é incluído na query string quando fornecido |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `token` válido, `cursor = "2026-05-19T10:00:00Z"` |
| **Passos de execução** | 1. Chamar `postService.getFeed(token, cursor)` |
| **Resultado esperado** | URL inclui parâmetro `cursor=` na query string |
| **Resultado obtido** | URL contém `cursor=` conforme esperado |
| **Status** | ✅ Passou |

---

### CT-29 — Feed sem token (visitante)

| Campo | Descrição |
|---|---|
| **Identificador** | CT-29 |
| **Objetivo** | Verificar que visitante não autenticado pode acessar o feed |
| **Pré-condições** | Nenhum token fornecido |
| **Dados de entrada** | `token = undefined` |
| **Passos de execução** | 1. Chamar `postService.getFeed(undefined)` |
| **Resultado esperado** | Retorna lista de posts sem exigir autenticação |
| **Resultado obtido** | Posts retornados; sem erro de autenticação |
| **Status** | ✅ Passou |

---

## UC-19 / UC-22 — Painel Admin / Métricas

### CT-30 — Dashboard retorna métricas do sistema

| Campo | Descrição |
|---|---|
| **Identificador** | CT-30 |
| **Objetivo** | Verificar que GET /admin/dashboard retorna contagens de usuários, posts e posts ocultos |
| **Pré-condições** | Usuário autenticado como administrador |
| **Dados de entrada** | Nenhum parâmetro adicional |
| **Passos de execução** | 1. Enviar GET /admin/dashboard com token de admin |
| **Resultado esperado** | HTTP 200 com `{ totalUsers, totalPosts, hiddenPosts, recentPosts }` |
| **Resultado obtido** | HTTP 200 — objeto com as quatro métricas retornado |
| **Status** | ✅ Passou |

---

## UC-20 — Moderar Post

### CT-31 — Ocultar post existente

| Campo | Descrição |
|---|---|
| **Identificador** | CT-31 |
| **Objetivo** | Verificar que admin pode ocultar um post fornecendo motivo |
| **Pré-condições** | Admin autenticado; post existe e não está oculto |
| **Dados de entrada** | `postId` válido, `reason: "Conteúdo inadequado"` |
| **Passos de execução** | 1. Enviar POST /admin/posts/:postId/hide com motivo |
| **Resultado esperado** | HTTP 204; `hidden_at` e `hidden_by` preenchidos; registro em `moderation_logs` |
| **Resultado obtido** | HTTP 204 — post ocultado com log criado |
| **Status** | ✅ Passou |

---

### CT-32 — Rejeitar ocultação sem motivo

| Campo | Descrição |
|---|---|
| **Identificador** | CT-32 |
| **Objetivo** | Verificar que motivo é obrigatório ao ocultar post |
| **Pré-condições** | Admin autenticado |
| **Dados de entrada** | `postId` válido, body vazio `{}` |
| **Passos de execução** | 1. Enviar POST /admin/posts/:postId/hide sem `reason` |
| **Resultado esperado** | HTTP 400 com mensagem de validação |
| **Resultado obtido** | HTTP 400 — `{ message: "Motivo é obrigatório" }` |
| **Status** | ✅ Passou |

---

### CT-33 — Ocultar post inexistente

| Campo | Descrição |
|---|---|
| **Identificador** | CT-33 |
| **Objetivo** | Verificar comportamento para postId sem registro no banco |
| **Pré-condições** | Admin autenticado |
| **Dados de entrada** | `postId` de UUID inexistente, `reason` válido |
| **Passos de execução** | 1. Enviar POST /admin/posts/:postId/hide |
| **Resultado esperado** | HTTP 404 com `{ message: "Post não encontrado" }` |
| **Resultado obtido** | HTTP 404 |
| **Status** | ✅ Passou |

---

### CT-34 — Restaurar post oculto

| Campo | Descrição |
|---|---|
| **Identificador** | CT-34 |
| **Objetivo** | Verificar que admin pode restaurar post oculto |
| **Pré-condições** | Admin autenticado; post com `hidden_at` preenchido |
| **Dados de entrada** | `postId` de post oculto, `reason: "Revisão concluída"` |
| **Passos de execução** | 1. Enviar POST /admin/posts/:postId/restore |
| **Resultado esperado** | HTTP 204; `hidden_at` e `hidden_by` limpos; log de `restore` criado |
| **Resultado obtido** | HTTP 204 — post restaurado |
| **Status** | ✅ Passou |

---

### CT-35 — Deletar post via admin

| Campo | Descrição |
|---|---|
| **Identificador** | CT-35 |
| **Objetivo** | Verificar que admin pode deletar qualquer post com motivo |
| **Pré-condições** | Admin autenticado; post existe |
| **Dados de entrada** | `postId` válido, `reason: "Violação dos termos"` |
| **Passos de execução** | 1. Enviar DELETE /admin/posts/:postId |
| **Resultado esperado** | HTTP 204; `deleted_at` preenchido; log de `delete` criado |
| **Resultado obtido** | HTTP 204 — post deletado com auditoria |
| **Status** | ✅ Passou |

---

## UC-21 — Suspender / Banir Usuário

### CT-36 — Aplicar ban a usuário

| Campo | Descrição |
|---|---|
| **Identificador** | CT-36 |
| **Objetivo** | Verificar que ban é aplicado e sessões ativas são revogadas |
| **Pré-condições** | Admin autenticado; usuário alvo existe e não está deletado |
| **Dados de entrada** | `userId` válido, `{ type: "ban", reason: "Comportamento abusivo" }` |
| **Passos de execução** | 1. Enviar POST /admin/users/:userId/sanction com tipo ban |
| **Resultado esperado** | HTTP 201 com objeto de sanção; `revokeAllSessions` chamado |
| **Resultado obtido** | HTTP 201 — sanção criada; todas as sessões revogadas |
| **Status** | ✅ Passou |

---

### CT-37 — Aplicar suspension com data de expiração

| Campo | Descrição |
|---|---|
| **Identificador** | CT-37 |
| **Objetivo** | Verificar que suspension com `expiresAt` é aplicada corretamente |
| **Pré-condições** | Admin autenticado; usuário alvo existe |
| **Dados de entrada** | `{ type: "suspension", reason: "Comportamento inadequado", expiresAt: "<ISO date>" }` |
| **Passos de execução** | 1. Enviar POST /admin/users/:userId/sanction com tipo suspension |
| **Resultado esperado** | HTTP 201 com sanção contendo `expires_at`; sessões revogadas |
| **Resultado obtido** | HTTP 201 — suspension criada com expiração |
| **Status** | ✅ Passou |

---

### CT-38 — Rejeitar tipo de sanção inválido

| Campo | Descrição |
|---|---|
| **Identificador** | CT-38 |
| **Objetivo** | Verificar que tipos de sanção não previstos são rejeitados pelo schema |
| **Pré-condições** | Admin autenticado |
| **Dados de entrada** | `{ type: "warning", reason: "Motivo" }` |
| **Passos de execução** | 1. Enviar POST /admin/users/:userId/sanction com tipo inválido |
| **Resultado esperado** | HTTP 400 com erros de validação |
| **Resultado obtido** | HTTP 400 — `{ message: "Dados inválidos", errors: [...] }` |
| **Status** | ✅ Passou |

---

### CT-39 — Revogar sanção ativa

| Campo | Descrição |
|---|---|
| **Identificador** | CT-39 |
| **Objetivo** | Verificar que sanção ativa pode ser revogada pelo admin |
| **Pré-condições** | Admin autenticado; sanção com `revoked_at` nulo existe |
| **Dados de entrada** | `sanctionId` válido, `reason: "Apelação aceita"` |
| **Passos de execução** | 1. Enviar POST /admin/users/:userId/sanction/:sanctionId/revoke |
| **Resultado esperado** | HTTP 200 com `{ message: "Sanção revogada" }` |
| **Resultado obtido** | HTTP 200 — `revoked_at` e `revoked_by` preenchidos |
| **Status** | ✅ Passou |

---

## UC-26 — Listar Conversas

### CT-40 — Listar conversas do usuário autenticado

| Campo | Descrição |
|---|---|
| **Identificador** | CT-40 |
| **Objetivo** | Verificar que GET /messages retorna todas as conversas do usuário |
| **Pré-condições** | Usuário autenticado; possui conversas |
| **Dados de entrada** | Token válido |
| **Passos de execução** | 1. Enviar GET /messages com token |
| **Resultado esperado** | HTTP 200 com array de conversas ordenado por data |
| **Resultado obtido** | HTTP 200 — array com objetos de conversa |
| **Status** | ✅ Passou |

---

## UC-25 — Enviar Mensagem

### CT-41 — Criar conversa e enviar primeira mensagem

| Campo | Descrição |
|---|---|
| **Identificador** | CT-41 |
| **Objetivo** | Verificar que POST /messages cria conversa (se não existir) e envia mensagem |
| **Pré-condições** | Usuário autenticado; destinatário existe |
| **Dados de entrada** | `{ recipientId: "<uuid>", content: "Olá!" }` |
| **Passos de execução** | 1. Enviar POST /messages com recipientId e content |
| **Resultado esperado** | HTTP 201 com `{ conversation, message }` |
| **Resultado obtido** | HTTP 201 — conversa criada e mensagem inserida |
| **Status** | ✅ Passou |

---

### CT-42 — Reutilizar conversa existente ao enviar mensagem

| Campo | Descrição |
|---|---|
| **Identificador** | CT-42 |
| **Objetivo** | Verificar que POST /messages reutiliza conversa existente entre os dois usuários |
| **Pré-condições** | Conversa já existe entre o remetente e o destinatário |
| **Dados de entrada** | `{ recipientId: "<uuid>", content: "Oi de novo!" }` |
| **Passos de execução** | 1. Enviar POST /messages para destinatário com conversa existente |
| **Resultado esperado** | HTTP 201; `conversation.id` é o mesmo da conversa existente |
| **Resultado obtido** | HTTP 201 — conversa reutilizada sem duplicação |
| **Status** | ✅ Passou |

---

### CT-43 — Rejeitar mensagem para si mesmo

| Campo | Descrição |
|---|---|
| **Identificador** | CT-43 |
| **Objetivo** | Verificar que usuário não pode enviar mensagem para si mesmo |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `recipientId` igual ao `userId` do remetente |
| **Passos de execução** | 1. Enviar POST /messages com `recipientId = próprio userId` |
| **Resultado esperado** | HTTP 422 com `{ message: "Não é possível enviar mensagem para si mesmo" }` |
| **Resultado obtido** | HTTP 422 |
| **Status** | ✅ Passou |

---

## UC-27 — Ler Conversa

### CT-44 — Ler conversa e listar mensagens

| Campo | Descrição |
|---|---|
| **Identificador** | CT-44 |
| **Objetivo** | Verificar que GET /messages/:conversationId retorna conversa e mensagens |
| **Pré-condições** | Usuário é participante da conversa |
| **Dados de entrada** | `conversationId` válido, token do participante |
| **Passos de execução** | 1. Enviar GET /messages/:conversationId |
| **Resultado esperado** | HTTP 200 com `{ conversation, messages }`; mensagens não lidas marcadas como lidas |
| **Resultado obtido** | HTTP 200 — conversa e array de mensagens retornados |
| **Status** | ✅ Passou |

---

### CT-45 — Retornar 404 para conversa inexistente ou de terceiro

| Campo | Descrição |
|---|---|
| **Identificador** | CT-45 |
| **Objetivo** | Verificar que usuário não pode ler conversa da qual não faz parte |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `conversationId` que não pertence ao usuário |
| **Passos de execução** | 1. Enviar GET /messages/:conversationId |
| **Resultado esperado** | HTTP 404 com `{ message: "Conversa não encontrada" }` |
| **Resultado obtido** | HTTP 404 |
| **Status** | ✅ Passou |

---

## UC-28 — Excluir Mensagem

### CT-46 — Deletar mensagem própria

| Campo | Descrição |
|---|---|
| **Identificador** | CT-46 |
| **Objetivo** | Verificar que remetente pode fazer soft delete da própria mensagem |
| **Pré-condições** | Usuário é o remetente da mensagem; mensagem não está deletada |
| **Dados de entrada** | `conversationId` e `messageId` da própria mensagem |
| **Passos de execução** | 1. Enviar DELETE /messages/:conversationId/:messageId |
| **Resultado esperado** | HTTP 204; `deleted_at` preenchido no banco |
| **Resultado obtido** | HTTP 204 — mensagem marcada como deletada |
| **Status** | ✅ Passou |

---

### CT-47 — Rejeitar exclusão de mensagem alheia

| Campo | Descrição |
|---|---|
| **Identificador** | CT-47 |
| **Objetivo** | Verificar que usuário não pode deletar mensagem enviada por outro |
| **Pré-condições** | Usuário autenticado; mensagem pertence a outro usuário |
| **Dados de entrada** | `messageId` de mensagem de outro remetente |
| **Passos de execução** | 1. Enviar DELETE /messages/:conversationId/:messageId |
| **Resultado esperado** | HTTP 403 com `{ message: "Sem permissão" }` |
| **Resultado obtido** | HTTP 403 — deleção negada |
| **Status** | ✅ Passou |

---

---

## UC-10 — Listar Seguidores / Seguindo

### CT-48 — Listar seguidores de um usuário

| Campo | Descrição |
|---|---|
| **Identificador** | CT-48 |
| **Objetivo** | Verificar que GET /users/:userId/followers retorna a lista de seguidores |
| **Pré-condições** | Usuário autenticado; usuário alvo existe |
| **Dados de entrada** | `userId` válido |
| **Passos de execução** | 1. Enviar GET /users/:userId/followers |
| **Resultado esperado** | HTTP 200 com array contendo os seguidores |
| **Resultado obtido** | HTTP 200 — lista de seguidores retornada |
| **Status** | ✅ Passou |

---

### CT-49 — Listar seguidores com lista vazia

| Campo | Descrição |
|---|---|
| **Identificador** | CT-49 |
| **Objetivo** | Verificar retorno de array vazio quando ninguém segue o usuário |
| **Pré-condições** | Usuário autenticado; usuário alvo existe mas não tem seguidores |
| **Dados de entrada** | `userId` de usuário sem seguidores |
| **Passos de execução** | 1. Enviar GET /users/:userId/followers |
| **Resultado esperado** | HTTP 200 com `[]` |
| **Resultado obtido** | HTTP 200 — array vazio |
| **Status** | ✅ Passou |

---

### CT-50 — Retornar 404 ao listar seguidores de usuário inexistente

| Campo | Descrição |
|---|---|
| **Identificador** | CT-50 |
| **Objetivo** | Verificar tratamento de usuário não encontrado |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `userId` que não existe no banco |
| **Passos de execução** | 1. Enviar GET /users/:userId/followers |
| **Resultado esperado** | HTTP 404 |
| **Resultado obtido** | HTTP 404 — usuário não encontrado |
| **Status** | ✅ Passou |

---

### CT-51 — Campo isMe marcado corretamente na lista de seguidores

| Campo | Descrição |
|---|---|
| **Identificador** | CT-51 |
| **Objetivo** | Verificar que o campo `isMe` é `true` quando o seguidor é o próprio usuário autenticado |
| **Pré-condições** | Usuário autenticado aparece como seguidor |
| **Dados de entrada** | `userId` alvo; seguidor é o próprio usuário autenticado |
| **Passos de execução** | 1. Enviar GET /users/:userId/followers |
| **Resultado esperado** | HTTP 200; `isMe: true` no objeto do usuário autenticado |
| **Resultado obtido** | HTTP 200 — `isMe` correto |
| **Status** | ✅ Passou |

---

### CT-52 — Listar usuários que o usuário segue

| Campo | Descrição |
|---|---|
| **Identificador** | CT-52 |
| **Objetivo** | Verificar que GET /users/:userId/following retorna lista de seguidos |
| **Pré-condições** | Usuário autenticado; usuário alvo segue outras pessoas |
| **Dados de entrada** | `userId` válido |
| **Passos de execução** | 1. Enviar GET /users/:userId/following |
| **Resultado esperado** | HTTP 200 com array dos usuários seguidos |
| **Resultado obtido** | HTTP 200 — lista de seguidos retornada |
| **Status** | ✅ Passou |

---

### CT-53 — Retornar 404 ao listar seguidos de usuário inexistente

| Campo | Descrição |
|---|---|
| **Identificador** | CT-53 |
| **Objetivo** | Verificar tratamento de usuário não encontrado em /following |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `userId` que não existe |
| **Passos de execução** | 1. Enviar GET /users/:userId/following |
| **Resultado esperado** | HTTP 404 |
| **Resultado obtido** | HTTP 404 |
| **Status** | ✅ Passou |

---

### CT-54 — Paginação em seguidores

| Campo | Descrição |
|---|---|
| **Identificador** | CT-54 |
| **Objetivo** | Verificar que parâmetros page e limit são aceitos |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `page=2&limit=5` |
| **Passos de execução** | 1. Enviar GET /users/:userId/followers?page=2&limit=5 |
| **Resultado esperado** | HTTP 200 |
| **Resultado obtido** | HTTP 200 — paginação aplicada |
| **Status** | ✅ Passou |

---

## UC-14 — Comentar em Post

### CT-55 — Criar comentário com sucesso

| Campo | Descrição |
|---|---|
| **Identificador** | CT-55 |
| **Objetivo** | Verificar que POST /posts/:postId/comments cria um comentário e retorna 201 |
| **Pré-condições** | Usuário autenticado; post existe |
| **Dados de entrada** | `{ "content": "Comentário" }` |
| **Passos de execução** | 1. Enviar POST /posts/:postId/comments com body válido |
| **Resultado esperado** | HTTP 201 com objeto do comentário criado |
| **Resultado obtido** | HTTP 201 — comentário criado e retornado |
| **Status** | ✅ Passou |

---

### CT-56 — Rejeitar comentário com content vazio

| Campo | Descrição |
|---|---|
| **Identificador** | CT-56 |
| **Objetivo** | Verificar validação de content obrigatório |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `{ "content": "" }` |
| **Passos de execução** | 1. Enviar POST /posts/:postId/comments com content vazio |
| **Resultado esperado** | HTTP 400 |
| **Resultado obtido** | HTTP 400 — validação rejeitou |
| **Status** | ✅ Passou |

---

### CT-57 — Rejeitar comentário com mais de 280 caracteres

| Campo | Descrição |
|---|---|
| **Identificador** | CT-57 |
| **Objetivo** | Verificar que comentário acima do limite é rejeitado |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `{ "content": "a".repeat(281) }` |
| **Passos de execução** | 1. Enviar POST /posts/:postId/comments com content excedido |
| **Resultado esperado** | HTTP 400 |
| **Resultado obtido** | HTTP 400 — validação rejeitou |
| **Status** | ✅ Passou |

---

### CT-58 — Retornar 404 ao comentar em post inexistente

| Campo | Descrição |
|---|---|
| **Identificador** | CT-58 |
| **Objetivo** | Verificar que post não encontrado resulta em 404 |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `postId` inexistente, `{ "content": "Comentário" }` |
| **Passos de execução** | 1. Enviar POST /posts/:postId/comments |
| **Resultado esperado** | HTTP 404 |
| **Resultado obtido** | HTTP 404 |
| **Status** | ✅ Passou |

---

### CT-59 — Criar notificação ao comentar em post de outro usuário

| Campo | Descrição |
|---|---|
| **Identificador** | CT-59 |
| **Objetivo** | Verificar que comentário em post alheio dispara notificação ao autor |
| **Pré-condições** | Usuário autenticado; post pertence a outro usuário |
| **Dados de entrada** | `postId` de post de outro usuário; `{ "content": "Comentário" }` |
| **Passos de execução** | 1. Enviar POST /posts/:postId/comments |
| **Resultado esperado** | HTTP 201; notificação do tipo `comment` inserida |
| **Resultado obtido** | HTTP 201 — notificação criada |
| **Status** | ✅ Passou |

---

## UC-23 — Editar Comentário

### CT-60 — Editar comentário com sucesso

| Campo | Descrição |
|---|---|
| **Identificador** | CT-60 |
| **Objetivo** | Verificar que autor pode editar o próprio comentário |
| **Pré-condições** | Usuário autenticado; comentário pertence ao usuário |
| **Dados de entrada** | `{ "content": "Editado" }` |
| **Passos de execução** | 1. Enviar PATCH /posts/:postId/comments/:commentId com novo content |
| **Resultado esperado** | HTTP 200 com comentário atualizado |
| **Resultado obtido** | HTTP 200 — content atualizado |
| **Status** | ✅ Passou |

---

### CT-61 — Rejeitar edição de comentário alheio

| Campo | Descrição |
|---|---|
| **Identificador** | CT-61 |
| **Objetivo** | Verificar que usuário não pode editar comentário de outro |
| **Pré-condições** | Usuário autenticado; comentário pertence a outro usuário |
| **Dados de entrada** | `commentId` de outro autor; `{ "content": "Editado" }` |
| **Passos de execução** | 1. Enviar PATCH /posts/:postId/comments/:commentId |
| **Resultado esperado** | HTTP 403 |
| **Resultado obtido** | HTTP 403 — edição negada |
| **Status** | ✅ Passou |

---

### CT-62 — Retornar 404 ao editar comentário inexistente

| Campo | Descrição |
|---|---|
| **Identificador** | CT-62 |
| **Objetivo** | Verificar que comentário não encontrado resulta em 404 |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `commentId` inexistente; `{ "content": "Editado" }` |
| **Passos de execução** | 1. Enviar PATCH /posts/:postId/comments/:commentId |
| **Resultado esperado** | HTTP 404 |
| **Resultado obtido** | HTTP 404 |
| **Status** | ✅ Passou |

---

### CT-63 — Rejeitar edição com content inválido

| Campo | Descrição |
|---|---|
| **Identificador** | CT-63 |
| **Objetivo** | Verificar validação de content na edição |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `{ "content": "" }` |
| **Passos de execução** | 1. Enviar PATCH /posts/:postId/comments/:commentId com content vazio |
| **Resultado esperado** | HTTP 400 |
| **Resultado obtido** | HTTP 400 — validação rejeitou |
| **Status** | ✅ Passou |

---

## UC-24 — Excluir Comentário

### CT-64 — Excluir comentário próprio com sucesso

| Campo | Descrição |
|---|---|
| **Identificador** | CT-64 |
| **Objetivo** | Verificar que autor pode fazer soft delete do próprio comentário |
| **Pré-condições** | Usuário autenticado; comentário pertence ao usuário |
| **Dados de entrada** | `commentId` próprio |
| **Passos de execução** | 1. Enviar DELETE /posts/:postId/comments/:commentId |
| **Resultado esperado** | HTTP 204 |
| **Resultado obtido** | HTTP 204 — comentário deletado |
| **Status** | ✅ Passou |

---

### CT-65 — Rejeitar exclusão de comentário alheio

| Campo | Descrição |
|---|---|
| **Identificador** | CT-65 |
| **Objetivo** | Verificar que usuário não pode excluir comentário de outro |
| **Pré-condições** | Usuário autenticado; comentário pertence a outro usuário |
| **Dados de entrada** | `commentId` de outro autor |
| **Passos de execução** | 1. Enviar DELETE /posts/:postId/comments/:commentId |
| **Resultado esperado** | HTTP 403 |
| **Resultado obtido** | HTTP 403 — exclusão negada |
| **Status** | ✅ Passou |

---

### CT-66 — Retornar 404 ao excluir comentário inexistente

| Campo | Descrição |
|---|---|
| **Identificador** | CT-66 |
| **Objetivo** | Verificar que comentário não encontrado resulta em 404 |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `commentId` inexistente |
| **Passos de execução** | 1. Enviar DELETE /posts/:postId/comments/:commentId |
| **Resultado esperado** | HTTP 404 |
| **Resultado obtido** | HTTP 404 |
| **Status** | ✅ Passou |

---

## UC-15 — Repostar

### CT-67 — Repost simples (sem comentário) retorna 201

| Campo | Descrição |
|---|---|
| **Identificador** | CT-67 |
| **Objetivo** | Verificar criação de repost simples sem texto adicional |
| **Pré-condições** | Usuário autenticado; post original existe |
| **Dados de entrada** | `postId` válido; body `{}` |
| **Passos de execução** | 1. Enviar POST /posts/:postId/repost sem content |
| **Resultado esperado** | HTTP 201; `isRepostSimple: true`, `repostOfId` preenchido |
| **Resultado obtido** | HTTP 201 — repost simples criado |
| **Status** | ✅ Passou |

---

### CT-68 — Repost com comentário (quote) retorna 201

| Campo | Descrição |
|---|---|
| **Identificador** | CT-68 |
| **Objetivo** | Verificar criação de quote repost com texto adicional |
| **Pré-condições** | Usuário autenticado; post original existe |
| **Dados de entrada** | `postId` válido; `{ "content": "Minha opinião" }` |
| **Passos de execução** | 1. Enviar POST /posts/:postId/repost com content |
| **Resultado esperado** | HTTP 201; `isRepostSimple: false`; `content` com o texto enviado |
| **Resultado obtido** | HTTP 201 — quote repost criado |
| **Status** | ✅ Passou |

---

### CT-69 — Retornar 404 ao repostar post inexistente

| Campo | Descrição |
|---|---|
| **Identificador** | CT-69 |
| **Objetivo** | Verificar tratamento de post original não encontrado |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `postId` inexistente |
| **Passos de execução** | 1. Enviar POST /posts/:postId/repost |
| **Resultado esperado** | HTTP 404 |
| **Resultado obtido** | HTTP 404 |
| **Status** | ✅ Passou |

---

### CT-70 — Rejeitar repost com comentário acima de 280 caracteres

| Campo | Descrição |
|---|---|
| **Identificador** | CT-70 |
| **Objetivo** | Verificar validação de tamanho do content no repost |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `{ "content": "a".repeat(281) }` |
| **Passos de execução** | 1. Enviar POST /posts/:postId/repost com content excedido |
| **Resultado esperado** | HTTP 400 |
| **Resultado obtido** | HTTP 400 — validação rejeitou |
| **Status** | ✅ Passou |

---

### CT-71 — Repost de post alheio dispara notificação

| Campo | Descrição |
|---|---|
| **Identificador** | CT-71 |
| **Objetivo** | Verificar que repost de post de outro usuário gera notificação do tipo `repost` |
| **Pré-condições** | Usuário autenticado; post original pertence a outro usuário |
| **Dados de entrada** | `postId` de post de outro autor; body `{}` |
| **Passos de execução** | 1. Enviar POST /posts/:postId/repost |
| **Resultado esperado** | HTTP 201; notificação do tipo `repost` inserida |
| **Resultado obtido** | HTTP 201 — notificação criada |
| **Status** | ✅ Passou |

---

## UC-17 — Notificações

### CT-72 — Listar notificações com sucesso

| Campo | Descrição |
|---|---|
| **Identificador** | CT-72 |
| **Objetivo** | Verificar que GET /notifications retorna a lista de notificações do usuário |
| **Pré-condições** | Usuário autenticado; há notificações para o usuário |
| **Dados de entrada** | — |
| **Passos de execução** | 1. Enviar GET /notifications |
| **Resultado esperado** | HTTP 200 com array de notificações; campos `id`, `type` presentes |
| **Resultado obtido** | HTTP 200 — lista retornada |
| **Status** | ✅ Passou |

---

### CT-73 — Retornar lista vazia quando não há notificações

| Campo | Descrição |
|---|---|
| **Identificador** | CT-73 |
| **Objetivo** | Verificar que retorno é array vazio quando não há notificações |
| **Pré-condições** | Usuário autenticado; sem notificações |
| **Dados de entrada** | — |
| **Passos de execução** | 1. Enviar GET /notifications |
| **Resultado esperado** | HTTP 200 com `[]` |
| **Resultado obtido** | HTTP 200 — array vazio |
| **Status** | ✅ Passou |

---

### CT-74 — Paginação aceita parâmetros page e limit

| Campo | Descrição |
|---|---|
| **Identificador** | CT-74 |
| **Objetivo** | Verificar que query params de paginação são aceitos sem erro |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `page=2&limit=10` |
| **Passos de execução** | 1. Enviar GET /notifications?page=2&limit=10 |
| **Resultado esperado** | HTTP 200 |
| **Resultado obtido** | HTTP 200 — paginação aplicada |
| **Status** | ✅ Passou |

---

### CT-75 — Marcar notificação como lida

| Campo | Descrição |
|---|---|
| **Identificador** | CT-75 |
| **Objetivo** | Verificar que PATCH /notifications/:id/read marca como lida e retorna `{ read: true }` |
| **Pré-condições** | Usuário autenticado; notificação existe e não está lida |
| **Dados de entrada** | `notificationId` válido |
| **Passos de execução** | 1. Enviar PATCH /notifications/:id/read |
| **Resultado esperado** | HTTP 200 com `{ "read": true }` |
| **Resultado obtido** | HTTP 200 — notificação marcada como lida |
| **Status** | ✅ Passou |

---

### CT-76 — Retornar 404 ao marcar notificação inexistente como lida

| Campo | Descrição |
|---|---|
| **Identificador** | CT-76 |
| **Objetivo** | Verificar tratamento de notificação não encontrada ou já lida |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `notificationId` que não existe ou já está lido |
| **Passos de execução** | 1. Enviar PATCH /notifications/:id/read |
| **Resultado esperado** | HTTP 404 |
| **Resultado obtido** | HTTP 404 |
| **Status** | ✅ Passou |

---

## UC-18 — Busca

### CT-77 — Retornar 400 quando parâmetro q não é fornecido

| Campo | Descrição |
|---|---|
| **Identificador** | CT-77 |
| **Objetivo** | Verificar validação do parâmetro obrigatório `q` |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | Nenhum query param |
| **Passos de execução** | 1. Enviar GET /search sem `q` |
| **Resultado esperado** | HTTP 400 com mensagem mencionando `q` |
| **Resultado obtido** | HTTP 400 — parâmetro obrigatório ausente |
| **Status** | ✅ Passou |

---

### CT-78 — Busca sem type retorna usuários e posts

| Campo | Descrição |
|---|---|
| **Identificador** | CT-78 |
| **Objetivo** | Verificar que busca sem type retorna ambos os tipos de resultado |
| **Pré-condições** | Usuário autenticado; resultados existem no banco |
| **Dados de entrada** | `q=noam` |
| **Passos de execução** | 1. Enviar GET /search?q=noam |
| **Resultado esperado** | HTTP 200 com `users` e `posts` preenchidos |
| **Resultado obtido** | HTTP 200 — ambos os arrays retornados |
| **Status** | ✅ Passou |

---

### CT-79 — Busca com type=users retorna apenas usuários

| Campo | Descrição |
|---|---|
| **Identificador** | CT-79 |
| **Objetivo** | Verificar filtro por tipo de resultado `users` |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `q=noam&type=users` |
| **Passos de execução** | 1. Enviar GET /search?q=noam&type=users |
| **Resultado esperado** | HTTP 200 com `users` preenchido; `posts` ausente |
| **Resultado obtido** | HTTP 200 — apenas usuários retornados |
| **Status** | ✅ Passou |

---

### CT-80 — Busca com type=posts retorna apenas posts

| Campo | Descrição |
|---|---|
| **Identificador** | CT-80 |
| **Objetivo** | Verificar filtro por tipo de resultado `posts` |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `q=teste&type=posts` |
| **Passos de execução** | 1. Enviar GET /search?q=teste&type=posts |
| **Resultado esperado** | HTTP 200 com `posts` preenchido; `users` ausente |
| **Resultado obtido** | HTTP 200 — apenas posts retornados |
| **Status** | ✅ Passou |

---

### CT-81 — Retornar listas vazias quando não há resultados

| Campo | Descrição |
|---|---|
| **Identificador** | CT-81 |
| **Objetivo** | Verificar que busca sem correspondências retorna arrays vazios |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `q=xyzabcnaoexiste` |
| **Passos de execução** | 1. Enviar GET /search?q=xyzabcnaoexiste |
| **Resultado esperado** | HTTP 200 com `users: []` e `posts: []` |
| **Resultado obtido** | HTTP 200 — arrays vazios |
| **Status** | ✅ Passou |

---

---

## UC-11 — Editar Post

### CT-91 — Editar post com sucesso

| Campo | Descrição |
|---|---|
| **Identificador** | CT-91 |
| **Objetivo** | Verificar que PATCH /posts/:postId atualiza o conteúdo e retorna 200 |
| **Pré-condições** | Usuário autenticado; post existe e pertence ao usuário |
| **Dados de entrada** | `{ "content": "Editado" }` |
| **Passos de execução** | 1. Enviar PATCH /posts/:postId com novo content |
| **Resultado esperado** | HTTP 200 com post atualizado |
| **Resultado obtido** | HTTP 200 — content atualizado |
| **Status** | ✅ Passou |

---

### CT-92 — Rejeitar edição de post alheio

| Campo | Descrição |
|---|---|
| **Identificador** | CT-92 |
| **Objetivo** | Verificar que usuário não pode editar post de outro autor |
| **Pré-condições** | Usuário autenticado; post pertence a outro usuário |
| **Dados de entrada** | `{ "content": "Editado" }` |
| **Passos de execução** | 1. Enviar PATCH /posts/:postId |
| **Resultado esperado** | HTTP 403 |
| **Resultado obtido** | HTTP 403 — edição negada |
| **Status** | ✅ Passou |

---

### CT-93 — Retornar 404 ao editar post inexistente

| Campo | Descrição |
|---|---|
| **Identificador** | CT-93 |
| **Objetivo** | Verificar tratamento de post não encontrado |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `postId` inexistente; `{ "content": "Editado" }` |
| **Passos de execução** | 1. Enviar PATCH /posts/:postId |
| **Resultado esperado** | HTTP 404 |
| **Resultado obtido** | HTTP 404 |
| **Status** | ✅ Passou |

---

### CT-94 — Rejeitar content vazio na edição de post

| Campo | Descrição |
|---|---|
| **Identificador** | CT-94 |
| **Objetivo** | Verificar validação de content obrigatório |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `{ "content": "" }` |
| **Passos de execução** | 1. Enviar PATCH /posts/:postId com content vazio |
| **Resultado esperado** | HTTP 400 |
| **Resultado obtido** | HTTP 400 — validação rejeitou |
| **Status** | ✅ Passou |

---

### CT-95 — Rejeitar content acima de 280 caracteres na edição de post

| Campo | Descrição |
|---|---|
| **Identificador** | CT-95 |
| **Objetivo** | Verificar validação de tamanho máximo |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `{ "content": "a".repeat(281) }` |
| **Passos de execução** | 1. Enviar PATCH /posts/:postId com content excedido |
| **Resultado esperado** | HTTP 400 |
| **Resultado obtido** | HTTP 400 — validação rejeitou |
| **Status** | ✅ Passou |

---

## UC-27 — Editar Mensagem Direta

### CT-96 — Editar mensagem com sucesso

| Campo | Descrição |
|---|---|
| **Identificador** | CT-96 |
| **Objetivo** | Verificar que PATCH /messages/:conversationId/:messageId atualiza o conteúdo |
| **Pré-condições** | Usuário autenticado; mensagem existe e pertence ao usuário |
| **Dados de entrada** | `{ "content": "Editado" }` |
| **Passos de execução** | 1. Enviar PATCH /messages/:conversationId/:messageId com novo content |
| **Resultado esperado** | HTTP 200 com mensagem atualizada |
| **Resultado obtido** | HTTP 200 — content atualizado |
| **Status** | ✅ Passou |

---

### CT-97 — Rejeitar edição de mensagem alheia

| Campo | Descrição |
|---|---|
| **Identificador** | CT-97 |
| **Objetivo** | Verificar que usuário não pode editar mensagem de outro remetente |
| **Pré-condições** | Usuário autenticado; mensagem pertence a outro usuário |
| **Dados de entrada** | `{ "content": "Editado" }` |
| **Passos de execução** | 1. Enviar PATCH /messages/:conversationId/:messageId |
| **Resultado esperado** | HTTP 403 |
| **Resultado obtido** | HTTP 403 — edição negada |
| **Status** | ✅ Passou |

---

### CT-98 — Retornar 404 ao editar mensagem inexistente ou deletada

| Campo | Descrição |
|---|---|
| **Identificador** | CT-98 |
| **Objetivo** | Verificar tratamento de mensagem não encontrada |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `messageId` inexistente; `{ "content": "Editado" }` |
| **Passos de execução** | 1. Enviar PATCH /messages/:conversationId/:messageId |
| **Resultado esperado** | HTTP 404 |
| **Resultado obtido** | HTTP 404 |
| **Status** | ✅ Passou |

---

### CT-99 — Rejeitar content vazio na edição de mensagem

| Campo | Descrição |
|---|---|
| **Identificador** | CT-99 |
| **Objetivo** | Verificar validação de content obrigatório |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `{ "content": "" }` |
| **Passos de execução** | 1. Enviar PATCH /messages/:conversationId/:messageId com content vazio |
| **Resultado esperado** | HTTP 400 |
| **Resultado obtido** | HTTP 400 — validação rejeitou |
| **Status** | ✅ Passou |

---

### CT-100 — Rejeitar content acima de 1000 caracteres na edição de mensagem

| Campo | Descrição |
|---|---|
| **Identificador** | CT-100 |
| **Objetivo** | Verificar validação de tamanho máximo de mensagem |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `{ "content": "a".repeat(1001) }` |
| **Passos de execução** | 1. Enviar PATCH /messages/:conversationId/:messageId com content excedido |
| **Resultado esperado** | HTTP 400 |
| **Resultado obtido** | HTTP 400 — validação rejeitou |
| **Status** | ✅ Passou |

---

## UC-06 — Configurações (Senha e Preferências)

### CT-82 — Alterar senha com sucesso

| Campo | Descrição |
|---|---|
| **Identificador** | CT-82 |
| **Objetivo** | Verificar que PATCH /users/me/password altera a senha quando credenciais são válidas |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `{ "currentPassword": "senha123", "newPassword": "novasenha456" }` |
| **Passos de execução** | 1. Enviar PATCH /users/me/password com senhas válidas |
| **Resultado esperado** | HTTP 200 com mensagem de confirmação |
| **Resultado obtido** | HTTP 200 — senha alterada |
| **Status** | ✅ Passou |

---

### CT-83 — Rejeitar alteração com senha atual incorreta

| Campo | Descrição |
|---|---|
| **Identificador** | CT-83 |
| **Objetivo** | Verificar que senha atual errada resulta em 401 |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `{ "currentPassword": "errada", "newPassword": "novasenha456" }` |
| **Passos de execução** | 1. Enviar PATCH /users/me/password com currentPassword incorreta |
| **Resultado esperado** | HTTP 401 |
| **Resultado obtido** | HTTP 401 — senha atual incorreta |
| **Status** | ✅ Passou |

---

### CT-84 — Rejeitar nova senha com menos de 8 caracteres

| Campo | Descrição |
|---|---|
| **Identificador** | CT-84 |
| **Objetivo** | Verificar validação de tamanho mínimo da nova senha |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `{ "currentPassword": "senha123", "newPassword": "curta" }` |
| **Passos de execução** | 1. Enviar PATCH /users/me/password com newPassword curta |
| **Resultado esperado** | HTTP 400 |
| **Resultado obtido** | HTTP 400 — validação rejeitou |
| **Status** | ✅ Passou |

---

### CT-85 — Rejeitar quando currentPassword está ausente

| Campo | Descrição |
|---|---|
| **Identificador** | CT-85 |
| **Objetivo** | Verificar que campo obrigatório ausente é rejeitado |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `{ "newPassword": "novasenha456" }` (sem currentPassword) |
| **Passos de execução** | 1. Enviar PATCH /users/me/password sem currentPassword |
| **Resultado esperado** | HTTP 400 |
| **Resultado obtido** | HTTP 400 — validação rejeitou |
| **Status** | ✅ Passou |

---

### CT-86 — Retornar preferências de notificação com sucesso

| Campo | Descrição |
|---|---|
| **Identificador** | CT-86 |
| **Objetivo** | Verificar que GET /users/me/preferences retorna os campos de preferência |
| **Pré-condições** | Usuário autenticado; preferências existem |
| **Dados de entrada** | — |
| **Passos de execução** | 1. Enviar GET /users/me/preferences |
| **Resultado esperado** | HTTP 200 com campos `notifyFollow`, `notifyLike`, `notifyComment`, `notifyRepost` |
| **Resultado obtido** | HTTP 200 — preferências retornadas |
| **Status** | ✅ Passou |

---

### CT-87 — Retornar 404 quando preferências não existem

| Campo | Descrição |
|---|---|
| **Identificador** | CT-87 |
| **Objetivo** | Verificar tratamento de registro ausente em notification_preferences |
| **Pré-condições** | Usuário autenticado; sem registro de preferências |
| **Dados de entrada** | — |
| **Passos de execução** | 1. Enviar GET /users/me/preferences |
| **Resultado esperado** | HTTP 404 |
| **Resultado obtido** | HTTP 404 |
| **Status** | ✅ Passou |

---

### CT-88 — Atualizar preferências de notificação com sucesso

| Campo | Descrição |
|---|---|
| **Identificador** | CT-88 |
| **Objetivo** | Verificar que PATCH /users/me/preferences persiste a alteração e retorna estado atualizado |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `{ "notifyFollow": false }` |
| **Passos de execução** | 1. Enviar PATCH /users/me/preferences com um campo alterado |
| **Resultado esperado** | HTTP 200 com `notifyFollow: false` no retorno |
| **Resultado obtido** | HTTP 200 — preferência atualizada |
| **Status** | ✅ Passou |

---

### CT-89 — Rejeitar atualização com body vazio

| Campo | Descrição |
|---|---|
| **Identificador** | CT-89 |
| **Objetivo** | Verificar que body sem campos resulta em 400 |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `{}` |
| **Passos de execução** | 1. Enviar PATCH /users/me/preferences com body vazio |
| **Resultado esperado** | HTTP 400 |
| **Resultado obtido** | HTTP 400 — nenhum campo para atualizar |
| **Status** | ✅ Passou |

---

### CT-90 — Rejeitar atualização com valor não booleano

| Campo | Descrição |
|---|---|
| **Identificador** | CT-90 |
| **Objetivo** | Verificar validação de tipo nos campos de preferência |
| **Pré-condições** | Usuário autenticado |
| **Dados de entrada** | `{ "notifyFollow": "sim" }` |
| **Passos de execução** | 1. Enviar PATCH /users/me/preferences com string em lugar de boolean |
| **Resultado esperado** | HTTP 400 |
| **Resultado obtido** | HTTP 400 — validação rejeitou tipo inválido |
| **Status** | ✅ Passou |

---

## Resumo de Cobertura

| UC | Total de CTs | Passou | Falhou | Pendente |
|---|---|---|---|---|
| UC-01 Cadastro | 6 | 6 | 0 | 0 |
| UC-02 Login | 4 | 4 | 0 | 0 |
| UC-03 Logout | 1 | 1 | 0 | 0 |
| UC-06 Configurações | 9 | 9 | 0 | 0 |
| UC-10 Seguidores/Seguindo | 7 | 7 | 0 | 0 |
| UC-11 Publicar / Editar Post | 8 | 8 | 0 | 0 |
| UC-12 Excluir Post | 3 | 3 | 0 | 0 |
| UC-13 Curtir/Descurtir | 3 | 3 | 0 | 0 |
| UC-14 Comentar | 5 | 5 | 0 | 0 |
| UC-15 Repostar | 5 | 5 | 0 | 0 |
| UC-16 Feed | 3 | 3 | 0 | 0 |
| UC-17 Notificações | 5 | 5 | 0 | 0 |
| UC-18 Busca | 5 | 5 | 0 | 0 |
| UC-19/22 Dashboard Admin | 1 | 1 | 0 | 0 |
| UC-20 Moderar Post | 5 | 5 | 0 | 0 |
| UC-21 Suspender/Banir | 4 | 4 | 0 | 0 |
| UC-23 Editar Comentário | 4 | 4 | 0 | 0 |
| UC-24 Excluir Comentário | 3 | 3 | 0 | 0 |
| UC-25 Enviar Mensagem | 3 | 3 | 0 | 0 |
| UC-26 Listar Conversas | 1 | 1 | 0 | 0 |
| UC-27 Ler / Editar Mensagem | 7 | 7 | 0 | 0 |
| UC-28 Excluir Mensagem | 2 | 2 | 0 | 0 |
| **Total** | **97** | **97** | **0** | **0** |
