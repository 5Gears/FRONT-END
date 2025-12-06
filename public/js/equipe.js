const API_BASE = window.API_BASE;
const API_PROJETOS = `${API_BASE}/api/projetos`;
const ID_USUARIO_LOGADO = localStorage.getItem("usuarioId"); 

let projetosCache = [];

// ===============================
// INICIALIZAÇÃO
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
    if (!ID_USUARIO_LOGADO) {
        alert("ID do usuário não encontrado. Faça login.");
        return;
    }
    
    await carregarProjetosDoResponsavel(ID_USUARIO_LOGADO);

    document.getElementById("btnBuscarEquipe").addEventListener("click", () => {
        const select = document.getElementById("selectProjeto");
        const idProjeto = select.value;
        if (!idProjeto) {
            alert("Selecione um projeto primeiro.");
            return;
        }
        carregarEquipePorId(idProjeto);
    });
});

// ===============================
// CARREGAR PROJETOS
// ===============================
async function carregarProjetosDoResponsavel(idResponsavel) {
    const select = document.getElementById("selectProjeto");

    try {
        const resposta = await fetch(`${API_PROJETOS}/gerente/${idResponsavel}`);
        if (!resposta.ok) throw new Error("Erro ao buscar projetos");

        const projetos = await resposta.json();
        projetosCache = projetos;

        select.innerHTML = "<option value=''>Selecione um projeto</option>";

        if (projetosCache.length === 0) {
            select.innerHTML = "<option value=''>Nenhum projeto encontrado</option>";
            return;
        }

        projetos.forEach(p => {
            const option = document.createElement("option");
            option.value = p.id;
            option.textContent = p.nome;
            select.appendChild(option);
        });
    } catch (erro) {
        console.error("Erro ao carregar projetos:", erro);
        select.innerHTML = "<option value=''>Erro ao carregar</option>";
    }
}

// ===============================
// CARREGAR EQUIPE DO PROJETO
// ===============================
async function carregarEquipePorId(idProjeto) {
    const container = document.getElementById('containerEquipe');
    const titulo = document.getElementById("tituloEquipe");

    container.innerHTML = '';
    titulo.textContent = 'Carregando equipe...';

    try {
        const resposta = await fetch(`${API_PROJETOS}/${idProjeto}/usuarios`);
        if (!resposta.ok) throw new Error(`Status: ${resposta.status}`);

        const equipe = await resposta.json();

        const projeto = projetosCache.find(p => p.id == idProjeto);
        titulo.textContent = projeto ? `Equipe do Projeto: ${projeto.nome}` : "Equipe do Projeto";

        if (equipe.length === 0) {
            container.innerHTML = '<p class="mensagem-status">Nenhum membro alocado neste projeto.</p>';
            return;
        }

        renderizarEquipe(equipe, container);

    } catch (erro) {
        console.error("Erro ao carregar equipe:", erro);
        titulo.textContent = "Erro ao carregar a equipe";
        container.innerHTML = `<p class="mensagem-status">Erro de comunicação com a API. Detalhes: ${erro.message}</p>`;
    }
}

// ===============================
// RENDERIZAR CARDS
// ===============================
function renderizarEquipe(equipe, container) {
    container.innerHTML = ''; // limpar container
    equipe.forEach(usuarioProjeto => {
        container.innerHTML += criarCardMembro(usuarioProjeto);
    });
}

function criarCardMembro(membro) {
    const inicio = formatarData(membro.dataAlocacao);
    const saida = membro.dataSaida ? formatarData(membro.dataSaida) : 'Em andamento';

    return `
        <div class="card-prof">
            <div class="lado-esquerdo">
                <div class="foto">
                    <img src="./assets/image 1 (1).png" alt="perfil">
                </div>
            </div>
            <div class="lado-direito">
                <p><strong>Nome:</strong> ${membro.nome || 'N/A'}</p>
                <p><strong>Email:</strong> ${membro.email || 'N/A'}</p>
                <p><strong>Telefone:</strong> ${membro.telefone || 'N/A'}</p>
                <div class="linha-info">
                    <p><strong>Cargo:</strong> ${membro.cargo || 'N/A'}</p>
                </div>
                <div class="linha-info">
                    <p><strong>Início:</strong> ${inicio}</p>
                    <p><strong>Saída:</strong> ${saida}</p>
                </div>
                <div class="linha-info">
                    <p><strong>Horas Alocadas:</strong> ${membro.horasAlocadas || 0}h</p>
                    <p><strong>Horas/Dia:</strong> ${membro.horasPorDia || 0}h</p>
                </div>
            </div>
        </div>
    `;
}

// ===============================
// AUXILIARES
// ===============================
function formatarData(dataString) {
    if (!dataString) return '—';
    try {
        const [ano, mes, dia] = dataString.split('-');
        return `${dia}/${mes}/${ano}`;
    } catch {
        return dataString;
    }
}

function verPerfil(idUsuario) {
    console.log(`Navegando para o perfil do usuário ID: ${idUsuario}`);
}
