// ===========================================
// SunnyBOT – Integração Chatbot (FiveGears)
// ===========================================

const API_BASE_URL = 'http://localhost:8080/api/assistente/chatbot';
const PROJETO_API_URL = 'http://localhost:8080/api/projetos';
let chatStep = 1;
let aguardandoConfirmacao = false;
let aguardandoAlocacao = false;
let projetoSelecionado = { nome: '', id: null };
let usuariosSugeridos = [];

document.addEventListener('DOMContentLoaded', () => {
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
        chatStep = 1;
        aguardandoConfirmacao = false;
        aguardandoAlocacao = false;
        projetoSelecionado = { nome: '', id: null };
        usuariosSugeridos = [];
        localStorage.removeItem('idProjetoSelecionado');
        localStorage.removeItem('sugestoesSunnyBot');
        addMessage("Olá! 👋 Sou o SunnyBOT e vou te ajudar na alocação de profissionais.\nPor favor, digite o nome do projeto para começarmos.", false);
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

    // ========== Etapa 1 – Validar Projeto ==========
    async function handleStep1(userText) {
    let nomeProjeto = userText.trim();

    // Limpeza automática do prefixo e caracteres indesejados
    nomeProjeto = nomeProjeto
        .replace(/^projeto\s+/i, '')        
        .replace(/^project\s+/i, '')        
        .replace(/^projetinho\s+/i, '')     
        .replace(/[^a-zA-ZÀ-ÿ0-9\s._-]/g, '') 
        .trim();

    
    nomeProjeto = nomeProjeto.normalize('NFC');

    if (nomeProjeto.length < 3) {
        addMessage("Por favor, insira um nome de projeto válido.", false);
        return;
    }

    addMessage(`Buscando projeto '${nomeProjeto}'...`, false);

    try {
        const body = { nomeProjeto, mensagem: "iniciar" };
        const resp = await postToBackend('/validar-projeto', body);

        projetoSelecionado = { nome: resp.projeto, id: resp.idProjeto };
        chatStep = 2;

        addMessage(`Projeto '${projetoSelecionado.nome}' encontrado!`, false);
        addMessage("Deseja buscar profissionais para esse projeto agora? (Responda 'sim' ou 'não')", false);

        aguardandoConfirmacao = true;
    } catch (err) {
        addMessage("Projeto não encontrado. Verifique o nome e tente novamente.", false);
        chatStep = 1;
    }
}

    // ========== Etapa 3 – Buscar Profissionais ==========
    async function handleStep3(userText) {
        if (userText.trim().length < 10) {
            addMessage("Descreva melhor a sua necessidade, por favor.", false);
            return;
        }

        addMessage("Processando sua solicitação...", false);

        const body = { nomeProjeto: projetoSelecionado.nome, mensagem: userText };
        const resp = await postToBackend('/demandar-profissionais', body);
        const { idProjeto, usuarios } = resp;

        localStorage.setItem('idProjetoSelecionado', idProjeto);
        localStorage.setItem('sugestoesSunnyBot', JSON.stringify(usuarios));

        preencherFormularioProjeto();
        usuariosSugeridos = usuarios;

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

        // animação suave de entrada (fade + bounce)
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
            backdrop: `
                rgba(0,0,0,0.4)
                url("https://i.gifer.com/embedded/download/ZZ5H.gif")
                left top
                no-repeat
            `,
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
                    addMessage("Todos os profissionais selecionados foram alocados com sucesso!", false);
                } catch (err) {
                    Swal.fire('Erro', 'Falha ao alocar um ou mais profissionais.', 'error');
                    addMessage("Ocorreu um erro durante a alocação.", false);
                }
            } else {
                addMessage("Operação cancelada. Nenhum profissional foi alocado.", false);
            }

            aguardandoAlocacao = false;
            chatStep = 1;
            projetoSelecionado = { nome: '', id: null };
            usuariosSugeridos = [];
        });
    }

    // ========== Controle Principal ==========
    async function processMessage(userText) {
        try {
            const texto = userText.toLowerCase();

            if (aguardandoConfirmacao) {
                aguardandoConfirmacao = false;
                if (texto.includes('sim')) {
                    chatStep = 3;
                    addMessage(`Perfeito! Agora descreva os profissionais que você deseja alocar no projeto '${projetoSelecionado.nome}'.`, false);
                    addMessage(`Exemplo: "Preciso de 3 analistas de dados plenos com experiência em Python e Power BI."`, false);
                } else {
                    chatStep = 1;
                    addMessage("Certo! Quando quiser iniciar novamente, basta me dizer o nome do projeto.", false);
                }
                return;
            }

            if (aguardandoAlocacao) {
                aguardandoAlocacao = false;
                if (texto.includes('sim')) abrirPopupAlocacao();
                else {
                    chatStep = 1;
                    addMessage("Tudo bem! Você pode fazer a alocação manual depois.", false);
                }
                return;
            }

            switch (chatStep) {
                case 1: await handleStep1(userText); break;
                case 3: await handleStep3(userText); break;
                default: addMessage("O fluxo do SunnyBOT foi interrompido. Reiniciando...", false); clearChat();
            }
        } catch (err) {
            addMessage(`❌ Erro: ${err.message}`, false);
            clearChat();
        }
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

    window.addEventListener('beforeunload', () => clearChat());

    addMessage("Olá! 👋 Sou o SunnyBOT e vou te ajudar na alocação de profissionais.\nPor favor, digite o nome do projeto para começarmos.", false);
});
