const API_BASE_URL = "http://localhost:8080/api";

// ===============================
// Carregar Projetos
// ===============================
async function carregarProjetos() {
    try {
        const resposta = await fetch(`${API_BASE_URL}/projetos`);
        if (!resposta.ok) throw new Error(`Erro ao carregar projetos (status ${resposta.status})`);

        const projetos = await resposta.json();
        preencherSelectProjetos(projetos);

    } catch (erro) {
        console.error("Erro ao buscar projetos:", erro);

        Swal.fire({
            icon: "error",
            title: "Erro ao carregar projetos",
            text: "Tente novamente mais tarde.",
            confirmButtonColor: "#d33"
        });
    }
}

function preencherSelectProjetos(projetos) {
    const select = document.getElementById("projeto");
    select.innerHTML = `<option value="">Selecione...</option>`;

    projetos.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.nome;
        select.appendChild(option);
    });
}

// ===============================
// Carregar Usuários do Projeto
// ===============================
async function carregarUsuariosPorProjeto(idProjeto) {
    if (!idProjeto) {
        limparSelectUsuarios();
        return;
    }

    try {
        const resposta = await fetch(`${API_BASE_URL}/projetos/${idProjeto}/usuarios`);
        if (!resposta.ok) throw new Error(`Erro ao carregar usuários (status ${resposta.status})`);

        const usuarios = await resposta.json();
        preencherSelectUsuarios(usuarios);

    } catch (erro) {
        console.error("Erro ao buscar usuários:", erro);

        Swal.fire({
            icon: "error",
            title: "Erro ao carregar profissionais",
            text: "Não foi possível buscar os usuários deste projeto.",
            confirmButtonColor: "#d33"
        });
    }
}

function preencherSelectUsuarios(usuarios) {
    const select = document.getElementById("profissional");
    select.innerHTML = `<option value="">Selecione...</option>`;

    usuarios.forEach(u => {
        const option = document.createElement("option");
        option.value = u.usuarioId;
        option.textContent = u.nome;
        select.appendChild(option);
    });
}

function limparSelectUsuarios() {
    const select = document.getElementById("profissional");
    select.innerHTML = `<option value="">Selecione...</option>`;
}

// ===============================
// Inicialização
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    carregarProjetos();

    const selectProjeto = document.getElementById("projeto");
    selectProjeto.addEventListener("change", (e) => {
        const idProjeto = e.target.value;
        carregarUsuariosPorProjeto(idProjeto);
    });
});

// ===============================
// Util: Mapeamento de números → ENUM
// ===============================
function mapNivel(valor) {
    const mapa = {
        1: "HORRIVEL",
        2: "BAIXO",
        3: "MEDIO",
        4: "ALTO",
        5: "EXCELENTE"
    };
    return mapa[valor] || "MEDIO";
}

// ===============================
// Coletar avaliações do formulário
// ===============================
function coletarAvaliacoes() {
    const avaliacoes = [];

    for (let i = 1; i <= 10; i++) {
        const radios = document.getElementsByName(`ss${i}`);
        let selecionado = null;

        radios.forEach(r => {
            if (r.checked) selecionado = parseInt(r.value);
        });

        if (selecionado) {
            avaliacoes.push({
                idSoftSkill: i,
                nivel: mapNivel(selecionado),
                comentario: null
            });
        }
    }

    return avaliacoes;
}

// ===============================
// Enviar Feedback
// ===============================
async function enviarFeedback() {

    const idProjeto = document.getElementById("projeto").value;
    const idUsuarioAvaliado = document.getElementById("profissional").value;
    const idAvaliador = localStorage.getItem("usuarioId");

    // validações
    if (!idProjeto) {
        Swal.fire({
            icon: "warning",
            title: "Selecione um projeto",
            text: "Você precisa escolher um projeto antes de enviar.",
            confirmButtonColor: "#3085d6"
        });
        return;
    }

    if (!idUsuarioAvaliado) {
        Swal.fire({
            icon: "warning",
            title: "Selecione um profissional",
            text: "Você precisa escolher um profissional antes de enviar.",
            confirmButtonColor: "#3085d6"
        });
        return;
    }

    if (!idAvaliador) {
        Swal.fire({
            icon: "error",
            title: "Usuário não autenticado",
            text: "Faça login novamente.",
            confirmButtonColor: "#d33"
        });
        return;
    }

    const avaliacoes = coletarAvaliacoes();

    if (avaliacoes.length === 0) {
        Swal.fire({
            icon: "info",
            title: "Nenhuma avaliação",
            text: "Avalie pelo menos uma soft skill antes de enviar.",
            confirmButtonColor: "#3085d6"
        });
        return;
    }

    const payload = {
        idUsuarioAvaliado: parseInt(idUsuarioAvaliado),
        idProjeto: parseInt(idProjeto),
        avaliacoes: avaliacoes
    };

    console.log("Payload enviado:", payload);

    // Loading visual
    Swal.fire({
        title: "Enviando feedback...",
        text: "Aguarde um instante",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
    });

    try {
        const resposta = await fetch(`${API_BASE_URL}/feedbacks/avaliar?idAvaliador=${idAvaliador}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const texto = await resposta.text();

        if (!resposta.ok) {
            Swal.fire({
                icon: "error",
                title: "Erro ao enviar feedback",
                text: texto || "Algo inesperado aconteceu.",
                confirmButtonColor: "#d33"
            });
            return;
        }

        Swal.fire({
            icon: "success",
            title: "Feedback enviado!",
            text: "Soft skills avaliadas com sucesso!",
            confirmButtonColor: "#28a745"
        });

    } catch (erro) {
        console.error("Erro no fetch:", erro);

        Swal.fire({
            icon: "error",
            title: "Erro no servidor",
            text: "Não foi possível enviar o feedback.",
            confirmButtonColor: "#d33"
        });
    }
}
