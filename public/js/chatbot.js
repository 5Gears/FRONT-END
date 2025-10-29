// ===========================================
// SunnyBOT – Integração Chatbot (FiveGears)
// ===========================================

const API_BASE_URL = 'http://localhost:8080/api/assistente/chatbot';
const API_PROJETOS = 'http://localhost:8080/api/projetos';

let aguardandoAlocacao = false;
let projetoSelecionado = null;
let usuariosSugeridos = [];

document.addEventListener('DOMContentLoaded', async () => {
    const chatBody = document.querySelector('.chat-body');
    const inputField = document.querySelector('.chat-input input');
    const sendButton = document.querySelector('.chat-input button');

    // ========== Utilidades ==========
    function addMessage(text, isUser = true) {
        const msg = document.createElement('div');
        msg.classList.add('chat-message', isUser ? 'user-message' : 'bot-message');
        msg.textContent = text;
        chatBody.appendChild(msg);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function clearChat() {
        chatBody.innerHTML = '';
        aguardandoAlocacao = false;
        projetoSelecionado = null;
        usuariosSugeridos = [];
        addMessage('Olá 👋 Sou o SunnyBOT! Carregando informações do projeto...', false);
    }

    // ========== Comunicação Backend ==========
    async function postToBackend(endpoint, body) {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || `Erro ${res.status}`);
        return data;
    }

    async function postAlocacao(idProjeto, idUsuario, horasAlocadas = 8, horasPorDia = 4) {
        const body = {
            dataAlocacao: new Date().toISOString().split('T')[0],
            dataSaida: null,
            horasPorDia: horasPorDia ?? 4,
            horasAlocadas: horasAlocadas ?? 8
        };

        const res = await fetch(`${API_PROJETOS}/${idProjeto}/usuarios/${idUsuario}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const data = await res.text();
            throw new Error(data || `Erro ${res.status}`);
        }
    }

    // ========== Busca de profissionais ==========
    async function handleBuscaProfissionais(userText) {
        if (userText.trim().length < 10) {
            addMessage('Descreva melhor a sua necessidade, por favor.', false);
            return;
        }

        addMessage('Processando sua solicitação...', false);

        const body = {
            idProjeto: projetoSelecionado.id,
            nomeProjeto: projetoSelecionado.nome,
            mensagem: userText
        };

        const resp = await postToBackend('/demandar-profissionais', body);
        const { idProjeto, usuarios } = resp;

        localStorage.setItem('idProjetoSelecionado', idProjeto);
        localStorage.setItem('sugestoesSunnyBot', JSON.stringify(usuarios));

        usuariosSugeridos = usuarios || [];

        if (usuariosSugeridos.length === 0) {
            addMessage('Não encontrei profissionais adequados à sua solicitação.', false);
            return;
        }

        let texto = 'Profissionais sugeridos:\n\n';
        texto += usuariosSugeridos
            .map(u => {
                const valorHora = u.valorHora ? u.valorHora.toFixed(2) : '0.00';
                return `${u.nome} (${u.senioridade}) – ${u.cargo} – R$${valorHora}/h`;
            })
            .join('\n\n');

        addMessage(texto, false);
        addMessage('Deseja alocar esses profissionais agora?', false);
        exibirBotaoAlocar();

        aguardandoAlocacao = true;
    }

    // ========== Pop-up de alocação ==========
    function exibirBotaoAlocar() {
        const div = document.createElement('div');
        div.classList.add('chat-action');
        div.innerHTML = `<button class="alocar-btn">Alocar agora</button>`;
        chatBody.appendChild(div);

        const btn = div.querySelector('.alocar-btn');
        btn.addEventListener('click', abrirPopupAlocacao);
    }

    async function abrirPopupAlocacao() {
        if (!usuariosSugeridos.length) {
            addMessage('Nenhum profissional disponível para alocar.', false);
            return;
        }

        const html = `
            <div style="text-align:left;max-height:300px;overflow-y:auto">
                ${usuariosSugeridos
                    .map(u => {
                        const valorHora = u.valorHora ? u.valorHora.toFixed(2) : '0.00';
                        return `
                            <div style="margin-bottom:8px">
                                <input type="checkbox" id="user_${u.id}" value="${u.id}">
                                <label for="user_${u.id}">
                                    <b>${u.nome}</b> (${u.senioridade}) – ${u.cargo} – R$${valorHora}/h
                                </label>
                            </div>
                        `;
                    })
                    .join('')}
            </div>
        `;

        const result = await Swal.fire({
            title: `Selecione quem deseja alocar em <b>${projetoSelecionado.nome}</b>`,
            html,
            confirmButtonText: 'Confirmar Alocação',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            background: '#fff'
        });

        if (result.isConfirmed) {
            const checkboxes = Swal.getPopup().querySelectorAll('input[type="checkbox"]:checked');
            const selecionados = Array.from(checkboxes).map(cb => parseInt(cb.value));

            if (!selecionados.length) {
                addMessage('Nenhum profissional selecionado.', false);
                return;
            }

            addMessage(`Alocando ${selecionados.length} profissional${selecionados.length > 1 ? 'es' : ''}...`, false);
            try {
                for (const idUsuario of selecionados) {
                    await postAlocacao(projetoSelecionado.id, idUsuario, 8, 4);
                }
                Swal.fire('✅ Sucesso', 'Profissionais alocados com sucesso!', 'success');
                addMessage('✅ Todos os profissionais foram alocados com sucesso!', false);
            } catch (err) {
                Swal.fire('Erro', 'Falha ao alocar um ou mais profissionais.', 'error');
                addMessage(`❌ Ocorreu um erro: ${err.message}`, false);
            }
        }

        aguardandoAlocacao = false;
    }

    // ========== Inicialização ==========
    const idProjeto = localStorage.getItem('idProjeto');
    const nomeProjeto = localStorage.getItem('nomeProjeto');

    if (idProjeto) {
        try {
            const resp = await fetch(`${API_PROJETOS}/${idProjeto}`);
            if (!resp.ok) throw new Error('Erro ao buscar projeto.');
            const projeto = await resp.json();

            projetoSelecionado = {
                id: projeto.id || projeto.idProjeto || idProjeto,
                nome: projeto.nome || nomeProjeto || 'Projeto sem nome'
            };

            addMessage(`Olá! 👋 Sou o SunnyBOT. Projeto atual: ${projetoSelecionado.nome}.`, false);
            addMessage('Descreva os profissionais que deseja alocar neste projeto.', false);
        } catch (err) {
            addMessage('⚠️ Erro ao carregar o projeto. Volte à tela anterior e selecione novamente.', false);
        }
    } else {
        addMessage('⚠️ Nenhum projeto selecionado. Volte à tela anterior e escolha um projeto.', false);
    }

    // ========== Envio de mensagens ==========
    sendButton.addEventListener('click', () => {
        const text = inputField.value.trim();
        if (!text) return;
        addMessage(text, true);
        inputField.value = '';
        processMessage(text);
    });

    inputField.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendButton.click();
        }
    });

    async function processMessage(userText) {
        try {
            if (aguardandoAlocacao) {
                aguardandoAlocacao = false;
                if (userText.toLowerCase().includes('sim')) await abrirPopupAlocacao();
                else addMessage('Tudo bem! Você pode fazer a alocação manual depois.', false);
                return;
            }

            if (!projetoSelecionado?.id) {
                addMessage('⚠️ Nenhum projeto selecionado.', false);
                return;
            }

            await handleBuscaProfissionais(userText);
        } catch (err) {
            addMessage(`❌ Erro: ${err.message}`, false);
        }
    }
});
