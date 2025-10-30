const API_BASE = window.API_BASE;
const API_LOGIN_PRIMEIRO_ACESSO = `${API_BASE}/api/login/primeiro-acesso`;

async function confirmarPrimeiroAcesso() {
  const novaSenha = document.getElementById("novaSenha").value.trim();
  const confirmarSenha = document.getElementById("confirmarSenha").value.trim();

  if (!novaSenha || !confirmarSenha) {
    Swal.fire('⚠️ Atenção', 'Preencha todos os campos!', 'warning');
    return;
  }

  if (novaSenha !== confirmarSenha) {
    Swal.fire('❌ Erro', 'As senhas não coincidem!', 'error');
    return;
  }

  const email = localStorage.getItem("emailUsuario");
  if (!email) {
    await Swal.fire('⚠️ Atenção', 'Usuário não identificado. Volte para o login.', 'warning');
    window.location.href = "./login.html";
    return;
  }

  try {
    const response = await fetch(API_LOGIN_PRIMEIRO_ACESSO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha: novaSenha }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      await Swal.fire('✅ Sucesso', 'Senha cadastrada com sucesso! Faça login novamente.', 'success');
      localStorage.removeItem("emailUsuario");
      window.location.href = "./login.html";
    } else {
      Swal.fire('❌ Erro', data.erro || 'Erro ao definir senha. Tente novamente.', 'error');
    }

  } catch (error) {
    console.error("Erro na requisição:", error);
    Swal.fire('⚠️ Erro', 'Erro de conexão com o servidor.', 'error');
  }
}
