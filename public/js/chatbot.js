// ===========================================
// SunnyBOT – Integração Chatbot (FiveGears)
// ===========================================

const API_BASE_URL = 'http://localhost:8080/api/assistente/chatbot';
const PROJETO_API_URL = 'http://localhost:8080/api/projetos';

let aguardandoAlocacao = false;
let projetoSelecionado = { nome: '', id: null };
let usuariosSugeridos = [];

document.addEventListener('DOMContentLoaded', async () => {
    const chatBody = document.querySelector('.chat-body');
    const inputField = document.querySelector('.chat-input input');
    const sendButton = document.querySelector('.chat-input button');
    const alocarForm = document.querySelector('.formulario');

    // ========== Utilidades ==========
    function addMessage(text, isUser = true) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', isUser ? 'user-message' : 'bot-message');
        messageDiv.textContent = text;
        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function clearChat() {
        chatBody.innerHTML = '';
        aguardandoAlocacao = false;
        projetoSelecionado = { nome: '', id: null };
        usuariosSugeridos = [];
        addMessage("Olá! 👋 Sou o SunnyBOT. Carregando informações do projeto...", false);
    }

    function preencherFormularioProjeto() {
        const selectProjeto = alocarForm?.querySelector('select');
        if (selectProjeto) {
            selectProjeto.innerHTML = '';
            const opt = document.createElement('option');
            opt.value = projetoSelecionado.id;
            opt.textContent = projetoSelecionado.nome;
            opt.selected = true;
            selectProjeto.appendChild(opt);
            selectProjeto.disabled = true;
        }
    }

    // ========== Comunicação Backend ==========
    async function postToBackend(endpoint, body) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.erro || `Erro ${response.status}`);
            return data;
        } catch (err) {
            console.error('Erro API:', err);
            throw err;
        }
    }

    async function postAlocacao(idProjeto, idUsuario, idCargo) {
        try {
            const response = await fetch(`${PROJETO_API_URL}/${idProjeto}/usuarios/${idUsuario}/cargo/${idCargo}`, {
                method: 'POST'
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.erro || `Erro ${response.status}`);
            }
        } catch (err) {
            console.error("Erro ao alocar:", err);
            throw err;
        }
    }

    // ========== Etapa principal – Buscar Profissionais ==========
    async function handleBuscaProfissionais(userText) {
        if (userText.trim().length < 10) {
            addMessage("Descreva melhor a sua necessidade, por favor.", false);
            return;
        }

        addMessage("Processando sua solicitação...", false);

        const body = { idProjeto: projetoSelecionado.id, nomeProjeto: projetoSelecionado.nome, mensagem: userText };
        const resp = await postToBackend('/demandar-profissionais', body);
        const { idProjeto, usuarios } = resp;

        localStorage.setItem('idProjetoSelecionado', idProjeto);
        localStorage.setItem('sugestoesSunnyBot', JSON.stringify(usuarios));

        preencherFormularioProjeto();
        usuariosSugeridos = usuarios;

        if (!usuarios || usuarios.length === 0) {
            addMessage("Não encontrei profissionais adequados à sua solicitação.", false);
            return;
        }

        let texto = "Profissionais sugeridos:\n\n";
        texto += usuarios.map(u =>
            `${u.nome} (${u.senioridade})\nCargo: ${u.cargo}\nValor/Hora: R$ ${u.valorHora.toFixed(2)}`
        ).join('\n\n');

        addMessage(texto, false);
        addMessage("Deseja alocar esses profissionais agora? (clique no botão abaixo ou digite 'não')", false);

        exibirBotaoAlocar();
        aguardandoAlocacao = true;
    }

    // ========== Pop-up e Botão Animado ==========
    function exibirBotaoAlocar() {
        const buttonDiv = document.createElement('div');
        buttonDiv.classList.add('chat-action');
        buttonDiv.innerHTML = `
            <button class="alocar-btn animated-btn">Alocar agora</button>
        `;
        chatBody.appendChild(buttonDiv);

        buttonDiv.animate(
            [
                { opacity: 0, transform: 'scale(0.8)' },
                { opacity: 1, transform: 'scale(1.05)' },
                { opacity: 1, transform: 'scale(1)' }
            ],
            { duration: 600, easing: 'ease-out' }
        );

        const alocarBtn = buttonDiv.querySelector('.alocar-btn');
        alocarBtn.addEventListener('click', abrirPopupAlocacao);
    }

    async function abrirPopupAlocacao() {
        if (usuariosSugeridos.length === 0) {
            addMessage("Nenhum profissional disponível para alocar.", false);
            return;
        }

        await Swal.fire({
            title: `Selecione quem deseja alocar no projeto <br><b>${projetoSelecionado.nome}</b>`,
            html: `
                <div style="text-align:left;max-height:300px;overflow-y:auto">
                    ${usuariosSugeridos.map(u => `
                        <div style="margin-bottom:8px">
                            <input type="checkbox" id="user_${u.id}" value="${u.id}" data-idcargo="${u.idCargo}">
                            <label for="user_${u.id}">
                                <b>${u.nome}</b> (${u.senioridade}) – ${u.cargo} – R$${u.valorHora}/h
                            </label>
                        </div>
                    `).join('')}
                </div>
            `,
            confirmButtonText: "Confirmar Alocação",
            showCancelButton: true,
            cancelButtonText: "Cancelar",
            background: '#fff',
            showClass: {
                popup: 'swal2-show animate__animated animate__fadeInDown'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp'
            },
            preConfirm: () => {
                const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
                return Array.from(checkboxes).map(cb => ({
                    idUsuario: parseInt(cb.value),
                    idCargo: parseInt(cb.dataset.idcargo)
                }));
            }
        }).then(async (result) => {
            if (result.isConfirmed && result.value?.length > 0) {
                const selecionados = result.value;
                addMessage(`Alocando ${selecionados.length} profissionais...`, false);

                try {
                    for (const sel of selecionados) {
                        await postAlocacao(projetoSelecionado.id, sel.idUsuario, sel.idCargo);
                    }
                    Swal.fire({
                        icon: 'success',
                        title: 'Sucesso!',
                        text: 'Profissionais alocados com sucesso!',
                        showConfirmButton: false,
                        timer: 1500
                    });
                    addMessage("✅ Todos os profissionais foram alocados com sucesso!", false);
                } catch (err) {
                    Swal.fire('Erro', 'Falha ao alocar um ou mais profissionais.', 'error');
                    addMessage("❌ Ocorreu um erro durante a alocação.", false);
                }
            } else {
                addMessage("Operação cancelada. Nenhum profissional foi alocado.", false);
            }

            aguardandoAlocacao = false;
        });
    }

    // ========== Controle Principal ==========
    async function processMessage(userText) {
        try {
            if (aguardandoAlocacao) {
                aguardandoAlocacao = false;
                if (userText.toLowerCase().includes('sim')) abrirPopupAlocacao();
                else addMessage("Tudo bem! Você pode fazer a alocação manual depois.", false);
                return;
            }

            if (!projetoSelecionado.id) {
                addMessage("⚠️ Nenhum projeto selecionado. Volte à tela de edição e escolha um projeto.", false);
                return;
            }

            await handleBuscaProfissionais(userText);
        } catch (err) {
            addMessage(`❌ Erro: ${err.message}`, false);
        }
    }

    // ========== Inicialização ==========
    const idProjeto = localStorage.getItem('idProjeto');
    if (idProjeto) {
        try {
            const resp = await fetch(`${PROJETO_API_URL}/${idProjeto}`);
            const projeto = await resp.json();
            projetoSelecionado = { nome: projeto.nome, id: projeto.idProjeto };
            addMessage(`Olá! 👋 Sou o SunnyBOT. Projeto selecionado: ${projetoSelecionado.nome}.`, false);
            addMessage(`Descreva os profissionais que deseja alocar neste projeto.`, false);
        } catch (err) {
            addMessage("Erro ao carregar o projeto. Volte à tela anterior e selecione novamente.", false);
        }
    } else {
        addMessage("⚠️ Nenhum projeto selecionado. Volte à tela anterior e escolha um projeto.", false);
    }

    // ========== Eventos ==========
    sendButton.addEventListener('click', () => {
        const userText = inputField.value.trim();
        if (!userText) return;
        addMessage(userText, true);
        inputField.value = '';
        processMessage(userText);
    });

    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendButton.click();
        }
    });
});
