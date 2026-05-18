// TODO: Implement ConversationPage
// UC-25 — enviar mensagem (POST /messages/:conversationId), máx 1000 caracteres
// UC-27 — listar mensagens da conversa paginadas (GET /messages/:conversationId)
// UC-28 — excluir mensagem própria com soft delete (DELETE /messages/:conversationId/:messageId)
// Marcar mensagens como lidas ao abrir a conversa
// Parâmetro de rota: conversationId (UUID)

export default function ConversationPage({ params }: { params: { conversationId: string } }) {
  return <div>Conversa {params.conversationId} — placeholder</div>;
}
