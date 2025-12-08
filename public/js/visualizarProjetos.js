const API_BASE_URL = "http://localhost:8080/api";

// ===============================
// Buscar Projetos
// ===============================
async function carregarProjetos() {
    try {
        const resposta = await fetch(`${API_BASE_URL}/projetos`);

        if (!resposta.ok) {
            throw new Error(`Erro ao buscar projetos: ${resposta.status}`);
        }

        const projetos = await resposta.json();
        renderizarProjetos(projetos);

    } catch (erro) {
        console.error("Erro:", erro);
        Swal.fire("Erro", "Não foi possível carregar os projetos.", "error");
    }
}

// ===============================
// Renderizar Projetos na Tela
// ===============================
function renderizarProjetos(projetos) {
    const container = document.getElementById("lista-projetos");

    if (!container) {
        console.error("ERRO: Elemento 'lista-projetos' não encontrado no HTML!");
        return;
    }

    container.innerHTML = "";

    projetos.forEach(p => {

        // Botão conforme status
        let acao = "";

        if (p.status === "EM_PLANEJAMENTO") {
            acao = `<button onclick="aprovarProjeto(${p.id})">Aprovar</button>`;
        } else {
            acao = `<button disabled>Aprovado</button>`;
        }

        const html = `
        <div class="boxTabelaNav display-flex meio">
            <div class="container display-flex row alinhar-meio justify-evenly">

                <div class="boxCheckBox display-flex alinhar-meio meio">
                    ${acao}
                </div>

                <div class="boxSpan display-flex meio">
                    <span>${p.nome || "-"}</span>
                </div>

                <div class="boxSpan display-flex meio">
                    <span>${p.status || "-"}</span>
                </div>

                <div class="boxSpan display-flex meio">
                    <span>${formatarData(p.dataInicio)}</span>
                </div>

                <div class="boxSpan display-flex meio">
                    <span>${formatarData(p.dataFim)}</span>
                </div>

                <div class="boxSpan display-flex meio">
                    <span>${p.responsavelNome || "-"}</span>
                </div>

            </div>
        </div>
        `;

        container.innerHTML += html;
    });
}

// ===============================
// Função Para Aprovar Projeto
// ===============================
async function aprovarProjeto(id) {

    Swal.fire({
        title: "Deseja aprovar este projeto?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sim, aprovar",
        cancelButtonText: "Cancelar",
    }).then(async result => {

        if (!result.isConfirmed) return;

        try {
            const resposta = await fetch(`${API_BASE_URL}/projetos/${id}/aceitar`, {
                method: "PUT",
            });

            const texto = await resposta.text();

            if (!resposta.ok) {
                Swal.fire("Erro", "Falha ao aprovar o projeto.", "error");
                return;
            }

            Swal.fire("Sucesso!", "Projeto aprovado com sucesso!", "success");

            carregarProjetos();

        } catch (erro) {
            console.error("Erro ao aprovar:", erro);
            Swal.fire("Erro", "Não foi possível aprovar o projeto.", "error");
        }
    });
}

// ===============================
// Utils
// ===============================
function formatarData(data) {
    if (!data) return "-";
    const d = new Date(data);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pt-BR");
}

// ===============================
// Inicialização
// ===============================
document.addEventListener("DOMContentLoaded", carregarProjetos);
