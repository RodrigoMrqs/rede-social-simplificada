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

## Resumo de Cobertura

| UC | Total de CTs | Passou | Falhou | Pendente |
|---|---|---|---|---|
| UC-01 Cadastro | 6 | 6 | 0 | 0 |
| UC-02 Login | 4 | 4 | 0 | 0 |
| UC-03 Logout | 1 | 1 | 0 | 0 |
| UC-11 Publicar | 3 | 3 | 0 | 0 |
| UC-12 Excluir Post | 3 | 3 | 0 | 0 |
| **Total** | **17** | **17** | **0** | **0** |
