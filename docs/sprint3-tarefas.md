# Sprint 3 — Divisão de Tarefas

**Entrega:** 26/05/2026
**Objetivo:** Entrega do sistema completo e funcional, com todas as telas e casos de uso implementados. Suíte de testes completa nos três níveis (unitários, integração e end-to-end), relatórios de cobertura de código (meta de 70–80%) e relatório de análise estática de qualidade. Apresentação ao vivo com execução das suítes de testes diante da turma.

---

## Pessoa 1 — Backend: Rotas de Usuários e Conteúdo
**Responsável:** Noam Coelho

### Rotas a implementar
- [x] `GET /users/:userId/followers` — UC-10 (listar seguidores, paginado)
- [x] `GET /users/:userId/following` — UC-10 (listar seguindo, paginado)
- [x] `POST /posts/:postId/comments` — UC-14 (comentar em post)
- [x] `PATCH /posts/:postId/comments/:commentId` — UC-23 (editar comentário, somente autor)
- [x] `DELETE /posts/:postId/comments/:commentId` — UC-24 (soft delete de comentário)
- [x] `POST /posts/:postId/repost` — UC-15 (repostar, com ou sem comentário)
- [x] `GET /search` — UC-18 (busca de usuários e posts via tsvector)
- [x] `GET /notifications` — UC-17 (listar notificações do usuário autenticado)
- [x] `PATCH /notifications/:id/read` — UC-17 (marcar como lida)

---

## Pessoa 2 — Backend: Admin, DMs, Testes e Qualidade
**Responsável:** Rodrigo Marques

### Rotas a implementar
- [x] `GET /admin/dashboard` — UC-19, UC-22 (métricas agregadas)
- [x] `POST /admin/posts/:postId/hide` — UC-20 (ocultar post + moderation_log)
- [x] `POST /admin/posts/:postId/restore` — UC-20 (restaurar post oculto + moderation_log)
- [x] `DELETE /admin/posts/:postId` — UC-20 (deletar post via admin)
- [x] `POST /admin/users/:userId/sanction` — UC-21 (suspender/banir + revogar sessões)
- [x] `POST /admin/users/:userId/sanction/:sanctionId/revoke` — UC-21 (revogar sanção)
- [x] `POST /messages` — UC-25 (enviar mensagem, criar conversa se não existir)
- [x] `GET /messages` — UC-26 (listar conversas do usuário autenticado)
- [x] `GET /messages/:conversationId` — UC-27 (ler conversa, marcar mensagens como lidas)
- [x] `POST /messages/:conversationId` — UC-25 (enviar mensagem em conversa existente)
- [x] `DELETE /messages/:conversationId/:messageId` — UC-28 (soft delete de mensagem)

### Testes end-to-end
- [ ] Instalar e configurar **Playwright** no workspace `web`
- [ ] Escrever teste E2E para fluxo de cadastro e login
- [ ] Escrever teste E2E para publicar post e visualizar no feed
- [ ] Escrever teste E2E para curtir e descurtir post
- [ ] Escrever teste E2E para seguir usuário

### Documentação de casos de teste
- [x] Ampliar `docs/casos-de-teste.md` com CTs dos UCs restantes: UC-13 (curtir), UC-16 (feed), UC-19/22 (admin), UC-20 (moderar), UC-21 (sanção), UC-25–28 (mensagens)
- [x] Atualizar tabela de resumo de cobertura no final do documento (41 CTs, 100% passando)

### Análise estática e cobertura
- [ ] Configurar **SonarQube Cloud** ou **Codacy** apontando para o repositório
- [ ] Gerar relatório com métricas: complexidade, duplicação, code smells e vulnerabilidades
- [ ] Gerar relatório de cobertura do backend: `cd server && npm run test:coverage`
- [ ] Gerar relatório de cobertura do frontend: `cd web && npm run test:coverage`
- [ ] Salvar os relatórios para apresentação

---

## Pessoa 3 — Frontend: Todas as Telas
**Responsável:** Nathalia Gama

### Telas a implementar
- [ ] `LoginPage` (`/login`) — formulário funcional conectado ao `authService.login()` (UC-02)
- [ ] `RegisterPage` (`/register`) — formulário funcional conectado ao `authService.register()` (UC-01)
- [ ] `NewPostPage` (`/post/new`) — formulário conectado ao `postService.createPost()` (UC-11)
- [ ] `PostPage` (`/post/[id]`) — exibir post + comentários, formulário de novo comentário (UC-14)
- [ ] `ProfilePage` (`/profile/[username]`) — perfil, botão seguir/deixar de seguir (UC-04, UC-08, UC-09)
- [ ] `SearchPage` (`/search`) — campo de busca conectado a `GET /search` (UC-18)
- [ ] `NotificationsPage` (`/notifications`) — listagem com badge de não lidas (UC-17)
- [ ] `SettingsPage` (`/settings`) — alterar senha e preferências de notificação (UC-06)
- [ ] `MessagesPage` (`/messages`) — listagem de conversas (UC-26)
- [ ] `ConversationPage` (`/messages/[conversationId]`) — troca de mensagens (UC-25, UC-27, UC-28)
- [ ] `AdminDashboardPage` (`/admin/dashboard`) — métricas e lista de posts (UC-19, UC-22)
- [ ] `AdminModerationPage` (`/admin/moderation`) — moderar posts e usuários (UC-20, UC-21)

---

## Dependências entre as pessoas

```
Pessoa 1 finaliza /notifications    →  Pessoa 3 conecta NotificationsPage
Pessoa 1 finaliza /search           →  Pessoa 3 conecta SearchPage
Pessoa 1 finaliza /comments         →  Pessoa 3 conecta PostPage
Pessoa 2 finaliza /admin/*          →  Pessoa 3 conecta telas de admin
Pessoa 2 finaliza /messages/*       →  Pessoa 3 conecta MessagesPage e ConversationPage
Pessoa 3 finaliza LoginPage         →  Pessoa 2 pode rodar testes E2E de fluxo completo
```

---

## Checklist de apresentação

- [ ] Sistema rodando ao vivo (`npm run dev` em `server/` e `web/`)
- [ ] Banco populado com dados de exemplo (`npm run db:seed`)
- [ ] Suíte completa passando: `npm test` em `server/` e `web/`
- [ ] Testes E2E executados ao vivo
- [ ] Relatório de cobertura exibido
- [ ] Relatório de análise estática exibido
- [ ] Cada integrante explica as decisões técnicas da sua parte
