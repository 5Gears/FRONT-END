document.addEventListener("DOMContentLoaded", async () => {
  await carregarProjetos();
});

async function carregarProjetos() {
  const select = document.querySelector("select");

  try {
    const resposta = await fetch("http://localhost:8080/api/projetos");
    if (!resposta.ok) throw new Error("Erro ao buscar projetos");

    const projetos = await resposta.json();

    const projetosEmDesenvolvimento = projetos.filter(
      (projeto) => projeto.status === "EM_DESENVOLVIMENTO"
    );

    select.innerHTML = "<option value=''>Selecione um projeto</option>";
    projetosEmDesenvolvimento.forEach((projeto) => {
      const option = document.createElement("option");
      option.value = projeto.id;
      option.textContent = projeto.nome;
      select.appendChild(option);
    });

  } catch (erro) {
    console.error("Erro ao carregar projetos:", erro);
    Swal.fire({
      icon: "error",
      title: "Erro",
      text: "Não foi possível carregar os projetos!",
    });
  }
}

function alocarEquipe() {
  const select = document.querySelector("select");
  const idProjeto = select.value;

  if (!idProjeto) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Selecione um projeto antes de continuar!",
    });
    return;
  }

  localStorage.setItem("idProjeto", idProjeto);
  window.location.href = "./alocação.html";
}

async function alterarProjeto() {
    const selectProjeto = document.getElementById("selectProjeto");
    const idProjeto = selectProjeto.value;
    const dataInicio = document.getElementById("dataInicio").value;
    const dataFim = document.getElementById("dataFim").value;

    if (!idProjeto) {
        Swal.fire({
            icon: "warning",
            title: "Selecione um projeto!",
        });
        return;
    }

    if (!dataInicio || !dataFim) {
        Swal.fire({
            icon: "warning",
            title: "Preencha as datas de início e fim!",
        });
        return;
    }

    const corpo = {
        dataInicio: dataInicio,
        dataFim: dataFim
    };

    try {
        const resposta = await fetch(`http://localhost:8080/api/projetos/${idProjeto}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(corpo)
        });

        if (!resposta.ok) {
            throw new Error("Erro ao atualizar projeto");
        }

        Swal.fire({
            icon: "success",
            title: "Projeto atualizado com sucesso!",
        });
    } catch (erro) {
        console.error("Erro ao atualizar projeto:", erro);
        Swal.fire({
            icon: "error",
            title: "Erro ao atualizar projeto",
            text: erro.message
        });
    }
}


async function excluirProjeto() {
  const select = document.querySelector("select");
  const idProjeto = select.value;

  if (!idProjeto) {
    Swal.fire({
      icon: "warning",
      title: "Atenção",
      text: "Selecione um projeto para excluir!",
    });
    return;
  }

  const confirmacao = await Swal.fire({
    title: "Tem certeza?",
    text: "Essa ação não pode ser desfeita!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sim, excluir!",
    cancelButtonText: "Cancelar",
  });

  if (!confirmacao.isConfirmed) return;

  try {
    const resposta = await fetch(`http://localhost:8080/api/projetos/${idProjeto}`, {
      method: "DELETE",
    });

    if (!resposta.ok) throw new Error("Erro ao excluir projeto");

    Swal.fire({
      icon: "success",
      title: "Excluído!",
      text: "O projeto foi excluído com sucesso.",
    });

    const option = select.querySelector(`option[value='${idProjeto}']`);
    if (option) option.remove();

  } catch (erro) {
    console.error("Erro ao excluir projeto:", erro);
    Swal.fire({
      icon: "error",
      title: "Erro",
      text: "Não foi possível excluir o projeto!",
    });
  }
}
