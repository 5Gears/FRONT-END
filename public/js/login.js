async function realizarLogin() {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!email || !senha) {
    Swal.fire('⚠️ Atenção', 'Por favor, preencha o e-mail e a senha.', 'warning');
    return;
  }

  const body = { email, senha };

  try {
    const response = await fetch("http://localhost:8080/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => ({}));

    if (response.status === 401 && data.erro?.includes("primeiro acesso")) {
      localStorage.setItem("emailUsuario", email);
      await Swal.fire('🔐 Primeiro acesso detectado!', 'Defina uma nova senha.', 'info');
      window.location.href = "../html/loginPrimeiroAcesso.html";
      return;
    }

    if (!response.ok) {
      Swal.fire('❌ Erro', data.erro || 'Erro ao tentar realizar login.', 'error');
      return;
    }

    localStorage.setItem("usuarioId", data.id);
    localStorage.setItem("nomeUsuario", data.nome);
    localStorage.setItem("token", data.token);
    localStorage.setItem("emailUsuario", data.email);

    await Swal.fire('✅ Sucesso', 'Bem-vindo!', 'success');
    window.location.href = "../html/cadastro.html";

  } catch (error) {
    console.error("Erro na requisição:", error);
    Swal.fire('⚠️ Erro', 'Não foi possível conectar ao servidor.', 'error');
  }
}