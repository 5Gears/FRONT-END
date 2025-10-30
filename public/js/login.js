const API_BASE = window.API_BASE;
const API_LOGIN = `${API_BASE}/api/login`;
const API_USUARIOS = `${API_BASE}/api/usuarios`;

async function realizarLogin() {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!email || !senha) {
    Swal.fire('⚠️ Atenção', 'Por favor, preencha o e-mail e a senha.', 'warning');
    return;
  }

  const body = { email, senha };

  try {
    const response = await fetch(API_LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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

    try {
      const usuarioResponse = await fetch(`${API_USUARIOS}/${data.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${data.token}`,
        },
      });

      if (usuarioResponse.ok) {
        const usuarioData = await usuarioResponse.json();
        localStorage.setItem("idEmpresa", usuarioData.idEmpresa);
      } else {
        console.warn("Não foi possível obter os dados completos do usuário.");
      }
    } catch (erroUsuario) {
      console.error("Erro ao buscar os dados do usuário:", erroUsuario);
    }

    await Swal.fire('✅ Sucesso', 'Bem-vindo!', 'success');
    window.location.href = "../html/cadastro.html";

  } catch (error) {
    console.error("Erro na requisição:", error);
    Swal.fire('⚠️ Erro', 'Não foi possível conectar ao servidor.', 'error');
  }
}
