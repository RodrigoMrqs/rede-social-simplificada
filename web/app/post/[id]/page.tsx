// TODO: Implement PostDetailPage
// UC-14 — exibe post completo + lista de comentários + formulário para comentar
// Parâmetro de rota: id (UUID do post)
// Buscar post via postService.getPost(token, id)

export default function PostDetailPage({ params }: { params: { id: string } }) {
  return <div>Detalhe do post {params.id} — placeholder</div>;
}
