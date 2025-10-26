async function realizarLogin() {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();

  if (!email || !senha) {
    alert("Por favor, preencha o e-mail e a senha.");
    return;
  }

  const body = { email, senha };

  try {
    const response = await fetch("http://localhost:8080/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert(errorData.erro || "Erro ao tentar realizar login.");
      return;
    }

    const data = await response.json();

    if (data.primeiroAcesso) {
      localStorage.setItem("emailUsuario", email);
      alert("Primeiro acesso detectado! Defina uma nova senha.");
      window.location.href = "../html/loginPrimeiroAcesso.html";
      return;
    }

    localStorage.setItem("usuarioId", data.usuarioId);
    localStorage.setItem("nomeUsuario", data.nome);
    localStorage.setItem("token", data.token);
    localStorage.setItem("emailUsuario", email);

    alert("Bem-vindo!");
    window.location.href = "../html/cadastro.html";

  } catch (error) {
    console.error("Erro na requisição:", error);
    alert("Não foi possível conectar ao servidor.");
  }
}
