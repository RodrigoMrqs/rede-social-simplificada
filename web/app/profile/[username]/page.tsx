// TODO: Implement ProfilePage
// UC-04 — exibe perfil (próprio ou de terceiros) com posts do usuário
// UC-05 — se próprio perfil: botão "Editar perfil" (modal ou seção expansível)
// UC-08 — se perfil de terceiro: botão Seguir → userService.follow()
// UC-09 — se já seguindo: botão Deixar de seguir → userService.unfollow()
// Parâmetro de rota: username

export default function ProfilePage({ params }: { params: { username: string } }) {
  return <div>Perfil de @{params.username} — placeholder</div>;
}
