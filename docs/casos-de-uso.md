# Casos de Uso — Ágora

Documento de especificação dos casos de uso da plataforma de microblogging Ágora.

**Atores:**
- **Usuário** — pessoa autenticada com conta ativa
- **Administrador** — usuário presente na tabela `admins` com permissões granulares
- **Visitante** — pessoa não autenticada

---

## Sumário

| ID | Nome | Ator |
|---|---|---|
| UC-01 | Cadastro | Visitante |
| UC-02 | Login | Visitante |
| UC-03 | Logout | Usuário |
| UC-04 | Visualizar perfil | Usuário / Visitante |
| UC-05 | Editar perfil | Usuário |
| UC-06 | Gerenciar configurações | Usuário |
| UC-07 | Excluir conta | Usuário |
| UC-08 | Seguir usuário | Usuário |
| UC-09 | Deixar de seguir | Usuário |
| UC-10 | Listar seguidores e seguindo | Usuário |
| UC-11 | Publicar post | Usuário |
| UC-12 | Excluir post | Usuário |
| UC-13 | Curtir / descurtir post | Usuário |
| UC-14 | Comentar em post | Usuário |
| UC-15 | Repostar | Usuário |
| UC-16 | Visualizar feed | Usuário |
| UC-17 | Visualizar notificações | Usuário |
| UC-18 | Buscar usuários e posts | Usuário |
| UC-19 | Acessar painel administrativo | Administrador |
| UC-20 | Moderar post | Administrador |
| UC-21 | Suspender ou banir usuário | Administrador |
| UC-22 | Visualizar métricas | Administrador |
| UC-23 | Editar comentário | Usuário |
| UC-24 | Excluir comentário | Usuário |
| UC-25 | Enviar mensagem direta | Usuário |
| UC-26 | Listar conversas | Usuário |
| UC-27 | Ler conversa | Usuário |
| UC-28 | Excluir mensagem direta | Usuário |

---

## UC-01 — Cadastro

**Ator:** Visitante

**Pré-condições:**
- O visitante não possui conta ativa na plataforma
- O visitante está na tela de cadastro (`/register`)

**Fluxo principal:**
1. O visitante preenche os campos: nome de usuário, nome de exibição, e-mail e senha
2. O sistema valida o formato do nome de usuário (3–30 caracteres alfanuméricos ou `_`)
3. O sistema verifica que o nome de usuário e o e-mail não estão em uso por conta ativa
4. O sistema cria o registro em `users` com `deleted_at = NULL`
5. O sistema cria o registro em `notification_preferences` com todos os campos `true`
6. O sistema gera um token JWT e cria um registro em `sessions`
7. O sistema retorna a sessão (token + dados do usuário)
8. O usuário é redirecionado para `/feed`

**Fluxos alternativos:**
- **FA-01a — Nome de usuário já em uso:** o sistema retorna erro 409 e exibe mensagem "Nome de usuário indisponível"
- **FA-01b — E-mail já em uso:** o sistema retorna erro 409 e exibe mensagem "E-mail já cadastrado"
- **FA-01c — Formato inválido:** o sistema retorna erro 422 indicando o campo inválido

**Pós-condições:**
- Conta criada e ativa em `users`
- Preferências de notificação criadas em `notification_preferences`
- Sessão ativa em `sessions`
- Usuário autenticado e redirecionado ao feed

---

## UC-02 — Login

**Ator:** Visitante

**Pré-condições:**
- O visitante possui conta ativa (`deleted_at IS NULL`)
- O visitante está na tela de login (`/login`)

**Fluxo principal:**
1. O visitante informa nome de usuário e senha
2. O sistema busca o usuário pelo nome de usuário com `deleted_at IS NULL`
3. O sistema compara a senha com o hash armazenado via bcrypt
4. O sistema verifica que o usuário não possui sanção ativa (ban ou suspension vigente)
5. O sistema gera um token JWT assinado com `JWT_SECRET`
6. O sistema cria um registro em `sessions` com o hash do token
7. O sistema retorna a sessão (token + dados do usuário)
8. O usuário é redirecionado para `/feed`

**Fluxos alternativos:**
- **FA-02a — Credenciais inválidas:** o sistema retorna erro 401 com mensagem genérica (sem indicar qual campo está errado)
- **FA-02b — Conta suspensa:** o sistema retorna erro 403 informando a data de término da suspensão
- **FA-02c — Conta banida:** o sistema retorna erro 403 informando que a conta foi banida permanentemente
- **FA-02d — Conta deletada:** o sistema trata como usuário inexistente (erro 401)

**Pós-condições:**
- Sessão ativa registrada em `sessions`
- Token JWT retornado ao cliente

---

## UC-03 — Logout

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado com sessão válida

**Fluxo principal:**
1. O usuário aciona a opção de logout
2. O sistema recebe o token JWT no header `Authorization`
3. O sistema atualiza o registro em `sessions`, definindo `revoked_at = NOW()`
4. O sistema retorna status 200
5. O cliente descarta o token e redireciona para `/login`

**Fluxos alternativos:**
- **FA-03a — Token inválido ou já revogado:** o sistema retorna erro 401; o cliente descarta o token localmente mesmo assim

**Pós-condições:**
- Sessão marcada como revogada em `sessions`
- Qualquer requisição futura com o mesmo token é rejeitada

---

## UC-04 — Visualizar perfil

**Ator:** Usuário / Visitante

**Pré-condições:**
- O perfil solicitado existe e está ativo (`deleted_at IS NULL`)

**Fluxo principal:**
1. O usuário acessa `/profile/:username`
2. O sistema busca os dados do usuário pelo `username`
3. O sistema retorna: dados do perfil, contagem de seguidores e seguindo, lista paginada de posts ativos do usuário
4. Se o visitante é o próprio dono do perfil: exibe botão "Editar perfil"
5. Se o visitante é outro usuário autenticado: exibe botão "Seguir" ou "Deixar de seguir" conforme o estado atual

**Fluxos alternativos:**
- **FA-04a — Perfil não encontrado:** o sistema retorna erro 404
- **FA-04b — Perfil privado acessado por não-seguidor:** o sistema exibe dados básicos (nome, bio, contagens) mas oculta os posts

**Pós-condições:**
- Nenhuma alteração de estado

---

## UC-05 — Editar perfil

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado
- O usuário está visualizando o próprio perfil

**Fluxo principal:**
1. O usuário aciona "Editar perfil"
2. O sistema exibe formulário com campos: nome de exibição, bio, URL do avatar e URL da capa
3. O usuário altera os campos desejados e confirma
4. O sistema valida os dados (bio ≤ 160 caracteres, nome de exibição ≤ 50 caracteres)
5. O sistema atualiza o registro em `users` e define `updated_at = NOW()`
6. O sistema retorna os dados atualizados

**Fluxos alternativos:**
- **FA-05a — Dados inválidos:** o sistema retorna erro 422 indicando o campo e o motivo

**Pós-condições:**
- Registro de `users` atualizado com os novos dados

---

## UC-06 — Gerenciar configurações

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado
- O usuário está na tela de configurações (`/settings`)

**Fluxo principal — alteração de senha:**
1. O usuário informa a senha atual e a nova senha
2. O sistema valida a senha atual via bcrypt
3. O sistema gera novo hash e atualiza `password_hash` em `users`

**Fluxo principal — privacidade:**
1. O usuário alterna a opção "Conta privada"
2. O sistema atualiza `is_private` em `users`

**Fluxo principal — preferências de notificação:**
1. O usuário ativa ou desativa cada tipo de notificação (follow, like, comment, repost, mention)
2. O sistema atualiza os campos correspondentes em `notification_preferences`

**Fluxos alternativos:**
- **FA-06a — Senha atual incorreta:** o sistema retorna erro 401 e não realiza a alteração

**Pós-condições:**
- Configurações atualizadas conforme a ação executada

---

## UC-07 — Excluir conta

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado

**Fluxo principal:**
1. O usuário solicita exclusão da conta em `/settings`
2. O sistema exibe confirmação solicitando a senha
3. O usuário confirma com a senha
4. O sistema valida a senha via bcrypt
5. O sistema define `deleted_at = NOW()` em `users`
6. O sistema revoga todas as sessões ativas do usuário (`revoked_at = NOW()`)
7. O cliente descarta o token e redireciona para `/login`

**Fluxos alternativos:**
- **FA-07a — Senha incorreta:** o sistema retorna erro 401 e não exclui a conta
- **FA-07b — Usuário cancela:** nenhuma alteração é realizada

**Pós-condições:**
- Conta marcada como deletada em `users` (soft delete)
- Todas as sessões revogadas
- Nome de usuário e e-mail ficam disponíveis para reutilização (índice único parcial com `WHERE deleted_at IS NULL`)

---

## UC-08 — Seguir usuário

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado
- O usuário alvo existe, está ativo e é diferente do próprio usuário
- O usuário ainda não segue o alvo

**Fluxo principal:**
1. O usuário aciona "Seguir" no perfil do alvo
2. O sistema insere o registro em `follows` com `(follower_id, followed_id)`
3. O sistema cria notificação do tipo `follow` em `notifications` para o alvo
4. O sistema retorna status 201

**Fluxos alternativos:**
- **FA-08a — Já segue:** o sistema retorna erro 409
- **FA-08b — Tentativa de auto-follow:** o sistema retorna erro 422 (CHECK constraint no banco)
- **FA-08c — Perfil privado:** o follow é registrado normalmente; a exibição de posts é controlada na leitura

**Pós-condições:**
- Registro inserido em `follows`
- Notificação criada para o usuário seguido

---

## UC-09 — Deixar de seguir

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado
- O usuário segue o alvo

**Fluxo principal:**
1. O usuário aciona "Deixar de seguir" no perfil do alvo
2. O sistema remove o registro de `follows` com `(follower_id, followed_id)`
3. O sistema retorna status 200

**Fluxos alternativos:**
- **FA-09a — Não segue o alvo:** o sistema retorna erro 404

**Pós-condições:**
- Registro removido de `follows`

---

## UC-10 — Listar seguidores e seguindo

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado
- O perfil alvo existe e está ativo

**Fluxo principal:**
1. O usuário acessa a lista de seguidores ou seguindo de um perfil
2. O sistema consulta `follows` filtrando por `followed_id` (seguidores) ou `follower_id` (seguindo)
3. O sistema retorna a lista paginada por cursor com dados básicos de cada usuário

**Fluxos alternativos:**
- **FA-10a — Perfil privado acessado por não-seguidor:** o sistema retorna erro 403

**Pós-condições:**
- Nenhuma alteração de estado

---

## UC-11 — Publicar post

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado com conta ativa e sem sanção vigente
- O usuário está na tela `/post/new`

**Fluxo principal:**
1. O usuário digita o conteúdo do post (máximo 280 caracteres)
2. O sistema valida que o conteúdo não está vazio após trim e respeita o limite
3. O sistema insere o registro em `posts` com `author_id`, `content`, `is_repost_simple = FALSE`
4. O sistema retorna o post criado
5. O usuário é redirecionado para `/feed`

**Fluxos alternativos:**
- **FA-11a — Conteúdo vazio:** o sistema retorna erro 422
- **FA-11b — Conteúdo excede 280 caracteres:** o sistema retorna erro 422

**Pós-condições:**
- Post ativo inserido em `posts`

---

## UC-12 — Excluir post

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado
- O post existe, está ativo e pertence ao usuário

**Fluxo principal:**
1. O usuário aciona "Excluir" no post
2. O sistema confirma que `author_id` do post é igual ao `userId` da sessão
3. O sistema define `deleted_at = NOW()` no registro de `posts`
4. O sistema retorna status 200

**Fluxos alternativos:**
- **FA-12a — Post não pertence ao usuário:** o sistema retorna erro 403
- **FA-12b — Post não encontrado:** o sistema retorna erro 404

**Pós-condições:**
- Post marcado como deletado (soft delete); não aparece mais no feed nem no perfil

---

## UC-13 — Curtir / descurtir post

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado
- O post existe e está ativo

**Fluxo principal — curtir:**
1. O usuário aciona o botão de curtida
2. O sistema insere registro em `post_likes` com `(user_id, post_id)`
3. O sistema cria notificação do tipo `like` para o autor do post
4. O sistema retorna status 201

**Fluxo principal — descurtir:**
1. O usuário aciona novamente o botão de curtida
2. O sistema remove o registro de `post_likes`
3. O sistema retorna status 200

**Fluxos alternativos:**
- **FA-13a — Tentar curtir post já curtido:** o sistema retorna erro 409
- **FA-13b — Tentar descurtir post não curtido:** o sistema retorna erro 404
- **FA-13c — Autor curte o próprio post:** permitido; notificação não é gerada para si mesmo

**Pós-condições:**
- Registro inserido ou removido de `post_likes`
- Notificação criada (apenas ao curtir, e apenas se não for o próprio autor)

---

## UC-14 — Comentar em post

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado
- O post existe e está ativo

**Fluxo principal:**
1. O usuário digita um comentário na tela `/post/:id` (máximo 280 caracteres)
2. O sistema valida que o conteúdo não está vazio após trim
3. O sistema insere o registro em `comments`
4. O sistema cria notificação do tipo `comment` para o autor do post
5. O sistema retorna o comentário criado

**Fluxos alternativos:**
- **FA-14a — Conteúdo vazio ou inválido:** o sistema retorna erro 422
- **FA-14b — Post não encontrado:** o sistema retorna erro 404

**Pós-condições:**
- Comentário inserido em `comments`
- Notificação criada para o autor do post (exceto se comentar no próprio post)

---

## UC-15 — Repostar

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado
- O post original existe e está ativo

**Fluxo principal:**
1. O usuário aciona "Repostar" em um post
2. O usuário escolhe entre repost simples (sem texto) ou repost com comentário (até 280 caracteres)
3. O sistema insere registro em `posts` com `repost_of_id` preenchido e `is_repost_simple` conforme o tipo
4. O sistema cria notificação do tipo `repost` para o autor do post original
5. O sistema retorna o repost criado

**Fluxos alternativos:**
- **FA-15a — Repost com comentário vazio após trim:** o sistema retorna erro 422
- **FA-15b — Post original não encontrado:** o sistema retorna erro 404

**Pós-condições:**
- Repost inserido em `posts` vinculado ao post original
- Notificação criada para o autor do post original

---

## UC-16 — Visualizar feed

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado

**Fluxo principal:**
1. O usuário acessa `/feed`
2. O sistema busca os IDs dos usuários seguidos pelo usuário autenticado via `follows`
3. O sistema retorna posts e reposts desses usuários onde `deleted_at IS NULL AND hidden_at IS NULL`, ordenados por `created_at DESC`, paginados por cursor
4. O sistema exibe o feed com ações de curtir, comentar e repostar em cada post

**Fluxos alternativos:**
- **FA-16a — Usuário não segue ninguém:** o sistema retorna lista vazia
- **FA-16b — Cursor inválido:** o sistema retorna erro 422

**Pós-condições:**
- Nenhuma alteração de estado

---

## UC-17 — Visualizar notificações

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado

**Fluxo principal:**
1. O usuário acessa `/notifications`
2. O sistema busca notificações por `recipient_id = userId`, ordenadas por `created_at DESC`, paginadas por cursor
3. O sistema retorna a lista com os dados do ator de cada notificação
4. O badge no menu exibe a contagem de notificações com `read_at IS NULL`
5. O usuário aciona "Marcar todas como lidas" e o sistema atualiza `read_at = NOW()` nas não lidas

**Fluxos alternativos:**
- **FA-17a — Sem notificações:** o sistema retorna lista vazia

**Pós-condições:**
- Notificações marcadas como lidas após acionamento do botão

---

## UC-18 — Buscar usuários e posts

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado

**Fluxo principal:**
1. O usuário digita um termo na barra de busca em `/search`
2. O sistema realiza busca full-text via índice GIN `tsvector` em português
3. O sistema retorna em seções separadas: usuários (por `display_name` e `username`) e posts (por `content`), ambos paginados
4. O usuário pode navegar para o perfil de um usuário ou para o detalhe de um post nos resultados

**Fluxos alternativos:**
- **FA-18a — Termo vazio:** o sistema não realiza busca
- **FA-18b — Nenhum resultado:** o sistema exibe mensagem "Nenhum resultado encontrado"

**Pós-condições:**
- Nenhuma alteração de estado

---

## UC-19 — Acessar painel administrativo

**Ator:** Administrador

**Pré-condições:**
- O usuário está autenticado
- O usuário possui registro ativo em `admins` (`revoked_at IS NULL`)

**Fluxo principal:**
1. O administrador acessa `/admin/dashboard`
2. O middleware `adminMiddleware` consulta `admins` pelo `userId` e verifica `revoked_at IS NULL`
3. O sistema concede acesso e exibe o painel

**Fluxos alternativos:**
- **FA-19a — Usuário não é admin:** o sistema retorna erro 403 e redireciona para `/feed`
- **FA-19b — Admin revogado:** o sistema retorna erro 403

**Pós-condições:**
- Nenhuma alteração de estado

---

## UC-20 — Moderar post

**Ator:** Administrador

**Pré-condições:**
- O administrador está autenticado e possui permissão `moderate_posts`
- O post existe e está ativo

**Fluxo principal — ocultar post:**
1. O administrador aciona "Ocultar" em `/admin/moderation`
2. O sistema define `hidden_at = NOW()` e `hidden_by = adminId` em `posts`
3. O sistema insere registro em `moderation_logs` com `action = 'hide'` e `reason`

**Fluxo principal — deletar post:**
1. O administrador aciona "Deletar"
2. O sistema define `deleted_at = NOW()` em `posts`
3. O sistema insere registro em `moderation_logs` com `action = 'delete'` e `reason`

**Fluxo principal — restaurar post:**
1. O administrador aciona "Restaurar" em um post oculto
2. O sistema define `hidden_at = NULL` e `hidden_by = NULL` em `posts`
3. O sistema insere registro em `moderation_logs` com `action = 'restore'` e `reason`

**Fluxos alternativos:**
- **FA-20a — Post não encontrado:** o sistema retorna erro 404
- **FA-20b — Admin sem permissão `moderate_posts`:** o sistema retorna erro 403

**Pós-condições:**
- Post com estado atualizado (`hidden_at` ou `deleted_at`)
- Registro imutável inserido em `moderation_logs`

---

## UC-21 — Suspender ou banir usuário

**Ator:** Administrador

**Pré-condições:**
- O administrador está autenticado e possui permissão `sanction_users`
- O usuário alvo existe e está ativo

**Fluxo principal — suspender:**
1. O administrador informa: usuário alvo, motivo e data de término (`expires_at`)
2. O sistema insere registro em `user_sanctions` com `sanction_type = 'suspension'` e `expires_at` preenchido
3. O sistema revoga todas as sessões ativas do usuário alvo (`revoked_at = NOW()`)

**Fluxo principal — banir:**
1. O administrador informa: usuário alvo e motivo (sem data de término)
2. O sistema insere registro em `user_sanctions` com `sanction_type = 'ban'` e `expires_at = NULL`
3. O sistema revoga todas as sessões ativas do usuário alvo

**Fluxo principal — revogar sanção:**
1. O administrador informa: sanção alvo e motivo da revogação
2. O sistema atualiza `revoked_at`, `revoked_by` e `revoke_reason` em `user_sanctions`

**Fluxos alternativos:**
- **FA-21a — Tentativa de ban com `expires_at` preenchido:** o sistema retorna erro 422 (violação do CHECK constraint)
- **FA-21b — Admin sem permissão `sanction_users`:** o sistema retorna erro 403

**Pós-condições:**
- Sanção registrada em `user_sanctions`
- Sessões do usuário revogadas; próximo login será bloqueado enquanto sanção estiver ativa

---

## UC-22 — Visualizar métricas

**Ator:** Administrador

**Pré-condições:**
- O administrador está autenticado e possui permissão `view_metrics`

**Fluxo principal:**
1. O administrador acessa `/admin/dashboard`
2. O sistema executa queries de agregação e retorna métricas, incluindo:
   - Total de usuários ativos
   - Total de posts ativos
   - Total de comentários
   - Total de suspensões ativas
   - Total de bans ativos
   - Novos usuários nos últimos 7 dias
   - Posts publicados nos últimos 7 dias

**Fluxos alternativos:**
- **FA-22a — Admin sem permissão `view_metrics`:** o sistema retorna erro 403

**Pós-condições:**
- Nenhuma alteração de estado

---

## UC-23 — Editar comentário

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado
- O comentário existe, está ativo (`deleted_at IS NULL`) e pertence ao usuário

**Fluxo principal:**
1. O usuário aciona "Editar" em um comentário próprio na tela `/post/:id`
2. O sistema exibe o conteúdo atual para edição
3. O usuário altera o texto (máximo 280 caracteres) e confirma
4. O sistema valida que o conteúdo não está vazio após trim
5. O sistema atualiza `content` em `comments`
6. O sistema retorna o comentário atualizado

**Fluxos alternativos:**
- **FA-23a — Comentário não pertence ao usuário:** o sistema retorna erro 403
- **FA-23b — Conteúdo inválido:** o sistema retorna erro 422

**Pós-condições:**
- Conteúdo do comentário atualizado em `comments`

---

## UC-24 — Excluir comentário

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado
- O comentário existe, está ativo e pertence ao usuário

**Fluxo principal:**
1. O usuário aciona "Excluir" em um comentário próprio
2. O sistema confirma que `author_id` do comentário é igual ao `userId` da sessão
3. O sistema define `deleted_at = NOW()` em `comments`
4. O sistema retorna status 200

**Fluxos alternativos:**
- **FA-24a — Comentário não pertence ao usuário:** o sistema retorna erro 403
- **FA-24b — Comentário não encontrado:** o sistema retorna erro 404

**Pós-condições:**
- Comentário marcado como deletado (soft delete); não aparece mais na listagem

---

## UC-25 — Enviar mensagem direta

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado
- O destinatário existe e está ativo

**Fluxo principal:**
1. O usuário seleciona um destinatário (via busca ou perfil)
2. O sistema verifica se já existe uma conversa entre os dois usuários em `conversations`
3. Se não existir: o sistema cria o registro em `conversations` garantindo `user_a_id < user_b_id`
4. O usuário digita a mensagem (máximo 1000 caracteres) e envia
5. O sistema insere o registro em `direct_messages` com `sender_id`, `conversation_id` e `content`
6. O sistema retorna a mensagem criada

**Fluxos alternativos:**
- **FA-25a — Conteúdo vazio:** o sistema retorna erro 422
- **FA-25b — Tentativa de mensagem para si mesmo:** o sistema retorna erro 422

**Pós-condições:**
- Conversa criada em `conversations` (se não existia)
- Mensagem inserida em `direct_messages`

---

## UC-26 — Listar conversas

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado

**Fluxo principal:**
1. O usuário acessa `/messages`
2. O sistema busca em `conversations` onde `user_a_id = userId` ou `user_b_id = userId`
3. Para cada conversa, o sistema retorna: dados do outro participante, prévia da última mensagem, contagem de mensagens não lidas
4. O sistema ordena as conversas pela mensagem mais recente

**Fluxos alternativos:**
- **FA-26a — Sem conversas:** o sistema retorna lista vazia

**Pós-condições:**
- Nenhuma alteração de estado

---

## UC-27 — Ler conversa

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado
- A conversa existe e o usuário é um dos participantes

**Fluxo principal:**
1. O usuário acessa `/messages/:conversationId`
2. O sistema verifica que o usuário é participante da conversa
3. O sistema retorna as mensagens da conversa ordenadas por `created_at ASC`, paginadas por cursor, excluindo as com `deleted_at IS NOT NULL`
4. O sistema marca como lidas todas as mensagens recebidas pelo usuário (`read_at = NOW()`) onde `read_at IS NULL`

**Fluxos alternativos:**
- **FA-27a — Conversa não encontrada:** o sistema retorna erro 404
- **FA-27b — Usuário não é participante:** o sistema retorna erro 403

**Pós-condições:**
- Mensagens recebidas marcadas como lidas (`read_at` preenchido)

---

## UC-28 — Excluir mensagem direta

**Ator:** Usuário

**Pré-condições:**
- O usuário está autenticado
- A mensagem existe, está ativa (`deleted_at IS NULL`) e foi enviada pelo usuário

**Fluxo principal:**
1. O usuário aciona "Excluir" em uma mensagem própria na conversa
2. O sistema confirma que `sender_id` da mensagem é igual ao `userId` da sessão
3. O sistema define `deleted_at = NOW()` em `direct_messages`
4. O sistema retorna status 200

**Fluxos alternativos:**
- **FA-28a — Mensagem não pertence ao usuário:** o sistema retorna erro 403
- **FA-28b — Mensagem não encontrada:** o sistema retorna erro 404

**Pós-condições:**
- Mensagem marcada como deletada (soft delete); não aparece mais na conversa

---

