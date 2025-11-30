const API_BASE = window.API_BASE;
const API_LOGIN_PRIMEIRO_ACESSO = `${API_BASE}/api/login/primeiro-acesso`;

async function confirmarPrimeiroAcesso() {
  const senhaTemporaria = document.getElementById("senhaTemporaria").value.trim();
  const novaSenha = document.getElementById("novaSenha").value.trim();
  const confirmarSenha = document.getElementById("confirmarSenha").value.trim();

  if (!senhaTemporaria || !novaSenha || !confirmarSenha) {
    Swal.fire('⚠️ Atenção', 'Preencha todos os campos!', 'warning');
    return;
  }

  if (novaSenha !== confirmarSenha) {
    Swal.fire('❌ Erro', 'As senhas não coincidem!', 'error');
    return;
  }

  const email = localStorage.getItem("emailUsuario");
  if (!email) {
    Swal.fire('⚠️ Atenção', 'Usuário não identificado. Volte ao login.', 'warning');
    window.location.href = "./index.html";
    return;
  }

  const body = {
    email,
    senhaTemporaria,
    novaSenha
  };

  try {
    const response = await fetch(API_LOGIN_PRIMEIRO_ACESSO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      await Swal.fire('✅ Sucesso', 'Senha alterada com sucesso! Faça login novamente.', 'success');
      localStorage.removeItem("emailUsuario");
      window.location.href = "./index.html";
    } else {
      Swal.fire('❌ Erro', data.erro || 'Erro ao definir senha.', 'error');
    }

  } catch (error) {
    console.error("Erro:", error);
    Swal.fire('⚠️ Erro', 'Falha ao conectar ao servidor.', 'error');
  }
}
