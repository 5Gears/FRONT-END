const API_BASE_LOGOUT = window.API_BASE;
const API_LOGOUT = `${API_BASE_LOGOUT}/api/login/logout`;

async function realizarLogout() {
  try {
    const usuarioId = localStorage.getItem("usuarioId");
    if (!usuarioId) {
      Swal.fire('⚠️ Atenção', 'Nenhum usuário está logado.', 'warning');
      return;
    }

    const resposta = await fetch(`${API_LOGOUT}/${usuarioId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    if (resposta.ok) {
      await Swal.fire('✅ Sucesso', 'Logout realizado com sucesso!', 'success');
      localStorage.clear();
      window.location.href = "login.html";
    } else {
      const erro = await resposta.json();
      Swal.fire('❌ Erro', `Erro ao realizar logout: ${erro.erro || "Erro desconhecido"}`, 'error');
    }
  } catch (error) {
    console.error("Erro na requisição de logout:", error);
    Swal.fire('⚠️ Erro', 'Erro de conexão ao tentar realizar logout.', 'error');
  }
}
