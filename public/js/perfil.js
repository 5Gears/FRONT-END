async function carregarPerfil() {
  try {
    const usuarioId = localStorage.getItem("usuarioId");

    if (!usuarioId) {
      Swal.fire('⚠️ Atenção', 'Nenhum usuário logado.', 'warning');
      window.location.href = "login.html";
      return;
    }

    const respostaUsuario = await fetch(`http://localhost:8080/api/usuarios/${usuarioId}`);
    if (!respostaUsuario.ok) throw new Error("Erro ao buscar dados do usuário.");

    const usuario = await respostaUsuario.json();
    preencherPerfil(usuario);

    if (usuario.idEmpresa) {
      const respostaEmpresa = await fetch(`http://localhost:8080/api/empresas/${usuario.idEmpresa}`);
      if (respostaEmpresa.ok) {
        const empresa = await respostaEmpresa.json();
        document.getElementById("perfil-empresa").textContent = empresa.nome || "-";
      }
    }

  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
    Swal.fire('❌ Erro', 'Falha ao carregar o perfil.', 'error');
  }
}

function preencherPerfil(usuario) {
  document.getElementById("perfil-nome").textContent = usuario.nome || "-";

  
  const cargo = usuario.cargoNome || "";
  const senioridade = usuario.senioridade ? usuario.senioridade.charAt(0) + usuario.senioridade.slice(1).toLowerCase() : "";
  document.getElementById("perfil-cargo").textContent = cargo && senioridade ? `${cargo} ${senioridade}` : (cargo || "-");

  document.getElementById("perfil-email").textContent = usuario.email || "-";
  document.getElementById("perfil-telefone").textContent = usuario.telefone || "-";
  document.getElementById("perfil-area").textContent = usuario.area || "-";
  document.getElementById("perfil-carga-horaria").textContent = usuario.cargaHoraria
    ? `${usuario.cargaHoraria}h/semana`
    : "-";

  document.getElementById("perfil-empresa").textContent = "-"; 
}

window.onload = carregarPerfil;
