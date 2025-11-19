const API_BASE = window.API_BASE;
const API_CLIENTES = `${API_BASE}/api/clientes`;
const API_PROJETOS = `${API_BASE}/api/projetos`;
const API_ANALISAR_PDF = `${API_BASE}/api/projetos/pdf/analisar`;

document.addEventListener("DOMContentLoaded", () => {
  carregarClientes();

  const btnCriarProjeto = document.getElementById("btnCriarProjeto");
  const btnAnalisarPDF = document.getElementById("btnAnalisarPDF");

  if (btnCriarProjeto) {
    btnCriarProjeto.addEventListener("click", criarProjeto);
  }

  if (btnAnalisarPDF) {
    btnAnalisarPDF.addEventListener("click", analisarPDFSelecionado);
  }
});

// ===============================
// Carregar lista de clientes
// ===============================
async function carregarClientes() {
  try {
    const resposta = await fetch(API_CLIENTES);
    if (!resposta.ok) throw new Error("Erro ao buscar clientes");

    const clientes = await resposta.json();
    const selectCliente = document.getElementById("clienteId");

    // Reset
    selectCliente.innerHTML = "<option value=''>Selecione um cliente</option>";

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

// ===============================
// Analisar PDF e preencher campos
// ===============================
async function analisarPDFSelecionado() {
  const fileInput = document.getElementById("fileInput");
  const statusAnalise = document.getElementById("statusAnalise");

  if (!fileInput.files || fileInput.files.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Nenhum arquivo selecionado",
      text: "Por favor, selecione um arquivo PDF para análise.",
    });
    return;
  }

  const arquivo = fileInput.files[0];

  const formData = new FormData();
  formData.append("file", arquivo);

  try {
    statusAnalise.textContent = "Analisando PDF, aguarde...";
    const resposta = await fetch(API_ANALISAR_PDF, {
      method: "POST",
      body: formData,
    });

    if (!resposta.ok) {
      const textoErro = await resposta.text();
      console.error("Erro ao analisar PDF:", textoErro);
      throw new Error("Erro ao analisar PDF.");
    }

    const dados = await resposta.json();

    // Preenchendo campos apenas se estiverem vazios
    const nomeProjetoInput = document.getElementById("nomeProjeto");
    const descricaoInput = document.getElementById("descricaoProjeto");
    const tempoEstimadoInput = document.getElementById("tempoEstimado");
    const orcamentoInput = document.getElementById("orcamento");
    const dataInicioInput = document.getElementById("dataInicio");
    const dataFimInput = document.getElementById("dataFim");
    const competenciasInput = document.getElementById("competenciasRequeridas");
    const selectCliente = document.getElementById("clienteId");

    if (dados.nomeProjeto && !nomeProjetoInput.value) {
      nomeProjetoInput.value = dados.nomeProjeto;
    }

    if (dados.descricao && !descricaoInput.value) {
      descricaoInput.value = dados.descricao;
    }

    if (dados.tempoEstimadoHoras && !tempoEstimadoInput.value) {
      tempoEstimadoInput.value = dados.tempoEstimadoHoras;
    }

    if (dados.orcamento && !orcamentoInput.value) {
      orcamentoInput.value = dados.orcamento;
    }

    if (dados.dataInicio && !dataInicioInput.value) {
      // Esperando formato yyyy-MM-dd vindo da API
      dataInicioInput.value = dados.dataInicio;
    }

    if (dados.dataFim && !dataFimInput.value) {
      dataFimInput.value = dados.dataFim;
    }

    if (dados.competencias && !competenciasInput.value) {
      // IA pode retornar lista em string única ou com vírgulas
      competenciasInput.value = dados.competencias;
    }

    if (dados.cliente && selectCliente.options.length > 1 && !selectCliente.value) {
      // Tenta selecionar o cliente pelo nome retornado
      const clienteNomeIA = dados.cliente.trim().toLowerCase();
      for (let i = 0; i < selectCliente.options.length; i++) {
        const opt = selectCliente.options[i];
        if (opt.textContent.trim().toLowerCase() === clienteNomeIA) {
          selectCliente.value = opt.value;
          break;
        }
      }
    }

    statusAnalise.textContent = "PDF analisado com sucesso. Revise os campos antes de confirmar.";

    Swal.fire({
      icon: "success",
      title: "PDF analisado!",
      text: "Os campos foram preenchidos com base no conteúdo do PDF. Revise antes de criar o projeto.",
      confirmButtonColor: "#3085d6",
    });

  } catch (erro) {
    console.error("Erro ao analisar PDF:", erro);
    if (statusAnalise) {
      statusAnalise.textContent = "Falha ao analisar o PDF.";
    }
    Swal.fire({
      icon: "error",
      title: "Erro ao analisar PDF",
      text: erro.message || "Ocorreu um erro durante a análise do arquivo.",
      confirmButtonColor: "#d33",
    });
  }
}

// ===============================
// Criar Projeto normalmente
// ===============================
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
      text: "Preencha o nome do projeto e esteja logado para prosseguir.",
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
    // draftId: null // se no futuro voltarmos com rascunho persistido
  };

  try {
    const resposta = await fetch(API_PROJETOS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projeto),
    });

    if (!resposta.ok) {
      const erroTexto = await resposta.text();
      console.error("Erro ao criar projeto:", erroTexto);
      throw new Error(erroTexto || "Erro ao criar projeto");
    }

    const projetoCriado = await resposta.json();

    Swal.fire({
      icon: "success",
      title: "Projeto criado!",
      text: `O projeto "${projetoCriado.nome}" foi criado com sucesso.`,
      confirmButtonColor: "#3085d6",
    }).then(() => window.location.href = "/public/perfil.html");
  } catch (erro) {
    console.error("Erro ao criar projeto:", erro);
    Swal.fire({
      icon: "error",
      title: "Erro ao criar projeto",
      text: "Verifique os campos, as datas (não podem estar no passado) e tente novamente.",
      confirmButtonColor: "#d33",
    });
  }
}
