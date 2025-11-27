const API_BASE = window.API_BASE;
const API_LOGIN = `${API_BASE}/api/login`;
const API_VERIFICAR = `${API_BASE}/api/login/verificar-primeiro-acesso`;

// Elementos
const campoSenha = document.getElementById("senha");
const botaoLogin = document.getElementById("btnLogin");

// Inicialmente esconde a senha até verificar o e-mail
campoSenha.style.display = "none";

async function verificarEmail() {
  const email = document.getElementById("email").value.trim();

  if (!email) return;

  try {
    const res = await fetch(API_VERIFICAR, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();

    if (!res.ok) {
      Swal.fire("Erro", data.erro || "Email não encontrado.", "error");
      return;
    }

    if (data.primeiroAcesso) {
      // Redireciona para o primeiro acesso
      localStorage.setItem("emailUsuario", email);
      Swal.fire("Primeiro acesso", "Defina sua nova senha!", "info");
      window.location.href = "../loginPrimeiroAcesso.html";
    } else {
      // Mostra campo de senha e segue login normal
      campoSenha.style.display = "block";
      botaoLogin.innerText = "Entrar";
    }

  } catch (e) {
    Swal.fire("Erro", "Falha ao verificar e-mail.", "error");
  }
}

async function realizarLogin() {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!email || !senha) {
    Swal.fire("Atenção", "Informe seu e-mail e senha.", "warning");
    return;
  }

  const body = { email, senha };

  try {
    const response = await fetch(API_LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      Swal.fire("Erro", data.erro || "Erro ao efetuar login.", "error");
      return;
    }

    // Salva dados da sessão
    localStorage.setItem("usuarioId", data.id);
    localStorage.setItem("nomeUsuario", data.nome);
    localStorage.setItem("token", data.token);
    localStorage.setItem("emailUsuario", data.email);

    Swal.fire("Sucesso", "Bem-vindo!", "success");
    window.location.href = "../perfil.html";

  } catch (error) {
    Swal.fire("Erro", "Falha ao conectar ao servidor.", "error");
  }
}
