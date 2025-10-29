// ===========================================
// SunnyBOT – Integração Chatbot (FiveGears)
// ===========================================

const API_BASE_URL = 'http://localhost:8080/api/assistente/chatbot';
const API_PROJETOS_CHATBOT = 'http://localhost:8080/api/projetos'; // 🔒 renomeado para evitar conflito

let aguardandoAlocacao = false;
let projetoSelecionado = null;
let usuariosSugeridos = [];

document.addEventListener('DOMContentLoaded', async () => {
    const chatBody = document.querySelector('.chat-body');
    const inputField = document.querySelector('.chat-input input');
    const sendButton = document.querySelector('.chat-input button');

    // ===========================================
    // Utilidades
    // ===========================================
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

    // ===========================================
    // Comunicação com o Backend
    // ===========================================
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
            horasPorDia,
            horasAlocadas
        };

        const res = await fetch(`${API_PROJETOS_CHATBOT}/${idProjeto}/usuarios/${idUsuario}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const data = await res.text();
            throw new Error(data || `Erro ${res.status}`);
        }
    }

    // ===========================================
    // Busca de Profissionais
    // ===========================================
    async function handleBuscaProfissionais(userText) {
        if (userText.trim().length < 5) {
            addMessage('Descreva melhor a sua necessidade, por favor.', false);
            return;
        }

        addMessage('🔎 Processando sua solicitação...', false);

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
            addMessage('😕 Não encontrei profissionais adequados à sua solicitação.', false);
            return;
        }

        let texto = '👥 Profissionais sugeridos:\n\n';
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

    // ===========================================
    // Botão e Pop-up de Alocação
    // ===========================================
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
                ${usuariosSugeridos.map(u => `
                    <div style="margin-bottom:10px;padding:6px 0;border-bottom:1px solid #ddd;">
                        <input type="checkbox" id="user_${u.id}" value="${u.id}">
                        <label for="user_${u.id}">
                            <b>${u.nome}</b> (${u.senioridade}) – ${u.cargo} – R$${u.valorHora.toFixed(2)}/h
                        </label><br>
                        <div style="margin-left:22px;margin-top:4px;">
                            <label>Horas por dia: </label>
                            <input id="horasPorDia_${u.id}" type="number" min="1" max="12" style="width:60px" value="4">
                            &nbsp;
                            <label>Total: </label>
                            <input id="horasTotais_${u.id}" type="number" min="1" max="200" style="width:60px" value="20">
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        const result = await Swal.fire({
            title: `Selecione e defina as horas para <b>${projetoSelecionado.nome}</b>`,
            html,
            confirmButtonText: 'Confirmar',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            focusConfirm: false,
            background: '#fff',
            preConfirm: async () => {
                await new Promise(resolve => setTimeout(resolve, 50)); // garante que DOM está renderizado

                const selecionados = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => {
                    const id = parseInt(cb.value);
                    const horasPorDia = Number(document.getElementById(`horasPorDia_${id}`)?.value || 0);
                    const horasTotais = Number(document.getElementById(`horasTotais_${id}`)?.value || 0);
                    return { idUsuario: id, horasPorDia, horasTotais };
                });

                if (!selecionados.length) {
                    Swal.showValidationMessage('Selecione pelo menos um profissional.');
                    return false;
                }

                for (const s of selecionados) {
                    if (s.horasPorDia <= 0 || s.horasTotais <= 0 || isNaN(s.horasPorDia) || isNaN(s.horasTotais)) {
                        Swal.showValidationMessage('Preencha as horas de todos os selecionados.');
                        return false;
                    }
                }

                console.log('✅ Selecionados no popup:', selecionados);
                return selecionados;
            }
        });

        if (result.isConfirmed && result.value) {
            const selecionados = result.value;
            addMessage(`⏳ Alocando ${selecionados.length} profissional(is)...`, false);

            try {
                for (const s of selecionados) {
                    await postAlocacao(projetoSelecionado.id, s.idUsuario, s.horasTotais, s.horasPorDia);
                }
                Swal.fire('✅ Sucesso', 'Profissionais alocados com sucesso!', 'success');
                addMessage('✅ Todos os profissionais foram alocados com sucesso!', false);
            } catch (err) {
                console.error('Erro ao alocar:', err);
                Swal.fire('Erro', 'Falha ao alocar um ou mais profissionais.', 'error');
                addMessage(`❌ Ocorreu um erro: ${err.message}`, false);
            }
        }

        aguardandoAlocacao = false;
    }

    // ===========================================
    // Inicialização do Chatbot
    // ===========================================
    const idProjeto = localStorage.getItem('idProjeto');
    const nomeProjeto = localStorage.getItem('nomeProjeto');

    if (idProjeto) {
        try {
            const resp = await fetch(`${API_PROJETOS_CHATBOT}/${idProjeto}`);
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

    // ===========================================
    // Envio e Processamento de Mensagens
    // ===========================================
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
