const API_BASE = window.API_BASE;
const API_PROJETOS = `${API_BASE}/api/projetos`;

let projetosCache = [];

// ===============================
// LOAD
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
    await carregarProjetos();

    const selectProjeto = document.getElementById("selectProjeto");
    if (selectProjeto) {
        selectProjeto.addEventListener("change", atualizarInfoProjeto);
    }
});

// ===============================
// CARREGAR PROJETOS
// ===============================
async function carregarProjetos() {
    const select = document.getElementById("selectProjeto");

    try {
        const resposta = await fetch(API_PROJETOS);
        if (!resposta.ok) throw new Error("Erro ao buscar projetos");

        const projetos = await resposta.json();

        projetosCache = projetos.filter(
            (projeto) => projeto.status === "EM_DESENVOLVIMENTO"
        );

        select.innerHTML = "<option value=''>Selecione um projeto</option>";

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        projetosCache.forEach((projeto) => {
            const option = document.createElement("option");
            option.value = projeto.id;

            let atrasado = false;

            if (projeto.atrasado === true) {
                atrasado = true;
            } else if (projeto.dataFim) {
                const dataFim = new Date(projeto.dataFim);
                dataFim.setHours(0, 0, 0, 0);
                atrasado = dataFim < hoje;
            }

            if (atrasado) {
                option.textContent = `${projeto.nome} (ATRASADO)`;
                option.classList.add("projeto-atrasado-option");
            } else {
                option.textContent = projeto.nome;
            }

            select.appendChild(option);
        });

    } catch (erro) {
        console.error("Erro ao carregar projetos:", erro);
        Swal.fire({
            icon: "error",
            title: "Erro",
            text: "Não foi possível carregar os projetos!"
        });
    }
}

// ===============================
// INFO DO PROJETO
// ===============================
function atualizarInfoProjeto() {
    const select = document.getElementById("selectProjeto");
    const infoDiv = document.getElementById("infoProjeto");
    const idProjeto = parseInt(select.value, 10);

    if (!idProjeto) {
        infoDiv.innerHTML = "Selecione um projeto para ver os detalhes.";
        infoDiv.classList.remove("atrasado");
        return;
    }

    const projeto = projetosCache.find((p) => p.id === idProjeto);
    if (!projeto) {
        infoDiv.innerHTML = "Projeto não encontrado.";
        infoDiv.classList.remove("atrasado");
        return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let atrasado = false;

    if (projeto.atrasado === true) {
        atrasado = true;
    } else if (projeto.dataFim) {
        const dataFim = new Date(projeto.dataFim);
        dataFim.setHours(0, 0, 0, 0);
        atrasado = dataFim < hoje;
    }

    let html = `
        <strong>Status:</strong> ${projeto.status.replace(/_/g, " ")}<br>
        <strong>Data início:</strong> ${projeto.dataInicio || "—"}<br>
        <strong>Data fim:</strong> ${projeto.dataFim || "—"}
    `;

    if (atrasado) {
        html += `<br><strong>⚠ Projeto atrasado</strong>`;
        infoDiv.classList.add("atrasado");
    } else {
        infoDiv.classList.remove("atrasado");
    }

    infoDiv.innerHTML = html;

    // Preenche inputs
    document.getElementById("dataInicio").value = projeto.dataInicio || "";
    document.getElementById("dataFim").value = projeto.dataFim || "";
}

// ===============================
// ALOCAR EQUIPE
// ===============================
function alocarEquipe() {
    const select = document.getElementById("selectProjeto");
    const idProjeto = select.value;

    if (!idProjeto) {
        Swal.fire({
            icon: "warning",
            title: "Atenção",
            text: "Selecione um projeto antes de continuar!"
        });
        return;
    }

    localStorage.setItem("idProjeto", idProjeto);
    window.location.href = "./alocacão.html";
}

// ===============================
// VERIFICAÇÃO DE DATAS
// ===============================
function validarDatas(dataInicio, dataFim) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    if (inicio < hoje) {
        Swal.fire({
            icon: "warning",
            title: "Data inválida",
            text: "A data de início não pode ser no passado."
        });
        return false;
    }

    if (fim < inicio) {
        Swal.fire({
            icon: "warning",
            title: "Data inválida",
            text: "A data de término não pode ser antes do início."
        });
        return false;
    }

    return true;
}

// ===============================
// ALTERAR DATAS
// ===============================
async function alterarProjeto() {
    const idProjeto = document.getElementById("selectProjeto").value;
    const dataInicio = document.getElementById("dataInicio").value;
    const dataFim = document.getElementById("dataFim").value;

    if (!idProjeto) {
        Swal.fire({ icon: "warning", title: "Selecione um projeto!" });
        return;
    }

    if (!dataInicio || !dataFim) {
        Swal.fire({
            icon: "warning",
            title: "Preencha as datas de início e fim!"
        });
        return;
    }

    if (!validarDatas(dataInicio, dataFim)) return;

    const corpo = { dataInicio, dataFim };

    try {
        const resposta = await fetch(`${API_PROJETOS}/${idProjeto}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(corpo)
        });

        if (!resposta.ok) {
            throw new Error(await resposta.text());
        }

        Swal.fire({
            icon: "success",
            title: "Projeto atualizado!"
        });

        await carregarProjetos();
        atualizarInfoProjeto();

    } catch (erro) {
        console.error("Erro ao atualizar projeto:", erro);
        Swal.fire({
            icon: "error",
            title: "Erro ao atualizar projeto",
            text: erro.message
        });
    }
}

// ===============================
// FINALIZAR PROJETO
// ===============================
async function finalizarProjeto() {
    const idProjeto = document.getElementById("selectProjeto").value;

    if (!idProjeto) {
        Swal.fire({
            icon: "warning",
            title: "Selecione um projeto para finalizar!"
        });
        return;
    }

    const escolha = await Swal.fire({
        title: "Finalizar projeto",
        text: "Deseja marcar como CONCLUÍDO ou CANCELADO?",
        icon: "question",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "Concluído",
        denyButtonText: "Cancelado",
        cancelButtonText: "Voltar"
    });

    if (!escolha.isConfirmed && !escolha.isDenied) return;

    const concluido = escolha.isConfirmed;

    try {
        const resposta = await fetch(
            `${API_PROJETOS}/${idProjeto}/finalizar?concluido=${concluido}`,
            { method: "PUT" }
        );

        if (!resposta.ok) throw new Error(await resposta.text());

        Swal.fire({
            icon: "success",
            title: "Projeto finalizado!",
            text: concluido ? "Marcado como CONCLUÍDO" : "Marcado como CANCELADO"
        });

        await carregarProjetos();
        atualizarInfoProjeto();

    } catch (erro) {
        Swal.fire({
            icon: "error",
            title: "Erro ao finalizar projeto",
            text: erro.message
        });
    }
}

// ===============================
// EXCLUIR PROJETO
// ===============================
async function excluirProjeto() {
    const idProjeto = document.getElementById("selectProjeto").value;

    if (!idProjeto) {
        Swal.fire({
            icon: "warning",
            title: "Selecione um projeto para excluir!"
        });
        return;
    }

    const confirmacao = await Swal.fire({
        title: "Tem certeza?",
        text: "Essa ação não pode ser desfeita!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, excluir!",
        cancelButtonText: "Cancelar"
    });

    if (!confirmacao.isConfirmed) return;

    try {
        const resposta = await fetch(`${API_PROJETOS}/${idProjeto}`, {
            method: "DELETE"
        });

        if (!resposta.ok) throw new Error("Erro ao excluir");

        Swal.fire({
            icon: "success",
            title: "Excluído!",
            text: "O projeto foi excluído com sucesso."
        });

        await carregarProjetos();
        atualizarInfoProjeto();

    } catch (erro) {
        Swal.fire({
            icon: "error",
            title: "Erro ao excluir projeto",
            text: erro.message
        });
    }
}
