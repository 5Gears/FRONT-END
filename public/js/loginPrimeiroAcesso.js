async function confirmarPrimeiroAcesso() {
  const novaSenha = document.getElementById("novaSenha").value.trim();
  const confirmarSenha = document.getElementById("confirmarSenha").value.trim();

  if (!novaSenha || !confirmarSenha) {
    alert("Preencha todos os campos!");
    return;
  }

  if (novaSenha !== confirmarSenha) {
    alert("As senhas não coincidem!");
    return;
  }

  const email = localStorage.getItem("emailUsuario");
  if (!email) {
    alert("Usuário não identificado. Volte para o login.");
    window.location.href = "./login.html";
    return;
  }

  try {
    const response = await fetch("http://localhost:8080/api/login/primeiro-acesso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email, senha: novaSenha })
    });

    if (response.ok) {
      alert("Senha cadastrada com sucesso! Faça login novamente.");
      window.location.href = "./login.html";
    } else {
      const errorData = await response.json();
      alert("Erro ao definir senha: " + (errorData.erro || "Tente novamente."));
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
    alert("Erro de conexão com o servidor.");
  }
}