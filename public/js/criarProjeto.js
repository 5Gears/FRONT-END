document.addEventListener("DOMContentLoaded", () => {
  carregarClientes();

  const botaoCriar = document.getElementById("btnCriarProjeto");
  botaoCriar.addEventListener("click", criarProjeto);
});

async function carregarClientes() {
  try {
    const resposta = await fetch("http://localhost:8080/api/clientes");
    if (!resposta.ok) {
      throw new Error("Erro ao buscar clientes");
    }

    const clientes = await resposta.json();
    const selectCliente = document.getElementById("clienteId");

    clientes.forEach((cliente) => {
      const option = document.createElement("option");
      option.value = cliente.id;
      option.textContent = cliente.nome;
      selectCliente.appendChild(option);
    });
  } catch (erro) {
    Swal.fire({
      icon: "error",
      title: "Erro",
      text: "Não foi possível carregar a lista de clientes.",
      confirmButtonColor: "#d33",
    });
    console.error("Erro ao carregar clientes:", erro);
  }
}

async function criarProjeto(event) {
  event.preventDefault();

  const nome = document.getElementById("nomeProjeto").value.trim();
  const descricao = document.getElementById("descricaoProjeto").value.trim();
  const tempoEstimadoHoras = document.getElementById("tempoEstimado").value;
  const orcamento = document.getElementById("orcamento").value;
  const dataInicio = document.getElementById("dataInicio").value;
  const dataFim = document.getElementById("dataFim").value;
  const clienteId = document.getElementById("clienteId").value || null;
  const competenciasRequeridas = document.getElementById("competenciasRequeridas").value.trim();

  const responsavelId = localStorage.getItem("usuarioId");

  if (!nome || !responsavelId) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Preencha ao menos o nome do projeto e esteja logado para prosseguir.",
      confirmButtonColor: "#3085d6",
    });
    return;
  }

  const projeto = {
    nome,
    descricao: descricao || null,
    tempoEstimadoHoras: tempoEstimadoHoras ? parseInt(tempoEstimadoHoras) : null,
    orcamento: orcamento ? parseFloat(orcamento) : null,
    dataInicio: dataInicio || null,
    dataFim: dataFim || null,
    clienteId: clienteId ? parseInt(clienteId) : null,
    responsavelId: parseInt(responsavelId),
    competenciasRequeridas: competenciasRequeridas || null,
  };

  try {
    const resposta = await fetch("http://localhost:8080/api/projetos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(projeto),
    });

    if (!resposta.ok) {
      const erroTexto = await resposta.text();
      throw new Error(erroTexto || "Erro ao criar projeto");
    }

    const projetoCriado = await resposta.json();

    Swal.fire({
      icon: "success",
      title: "Projeto criado!",
      text: `O projeto "${projetoCriado.nome}" foi criado com sucesso.`,
      confirmButtonColor: "#3085d6",
    }).then(() => {
      window.location.href = "./perfil.html";
    });
  } catch (erro) {
    console.error("Erro ao criar projeto:", erro);

    Swal.fire({
      icon: "error",
      title: "Erro ao criar projeto",
      text: "Verifique os campos e tente novamente.",
      confirmButtonColor: "#d33",
    });
  }
}
