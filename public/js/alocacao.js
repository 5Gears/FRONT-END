// Variáveis de estado global para rastrear o fluxo do chatbot
let chatStep = 1;
let projetoSelecionado = { nome: '', id: null };
const API_BASE_URL = 'http://localhost:8080/api/assistente'; // URL do backend

document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleciona os elementos principais
    const chatBody = document.querySelector('.chat-body');
    const inputField = document.querySelector('.chat-input input');
    const sendButton = document.querySelector('.chat-input button');
    const alocarForm = document.querySelector('.formulario');

    // --- Funções de UI do Chatbot ---

    function addMessage(text, isUser = true) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message');
        messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
        messageDiv.textContent = text;
        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function showSuggestionsAndPopulateForm(usuarios) {
        let suggestionsHTML = 'Sugestões encontradas:\n';
        const selectNomeProjeto = alocarForm ? alocarForm.querySelector('select') : null;

        // Preenche o select do projeto, se existir
        if (selectNomeProjeto) {
            selectNomeProjeto.innerHTML = '';
            const option = document.createElement('option');
            option.value = projetoSelecionado.id;
            option.textContent = projetoSelecionado.nome;
            selectNomeProjeto.appendChild(option);
            selectNomeProjeto.disabled = true;
        }

        // Exibe as sugestões no chat
        suggestionsHTML += usuarios.map(u =>
            `ID: ${u.id}, Nome: ${u.nome}, Cargo: ${u.cargo} (${u.senioridade}), Valor/Hora: R$ ${u.valorHora.toFixed(2)}`
        ).join('\n');

        addMessage(suggestionsHTML, false);
        addMessage(`*O front-end armazenou as sugestões e o ID do projeto*. Por favor, utilize o formulário principal para preencher o restante dos dados e realizar a alocação manual (Etapa 7).`, false);
    }

    // --- Funções de Comunicação com o Backend ---

    async function postToBackend(endpoint, body) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.erro || `Erro HTTP: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Erro na comunicação com a API:', error);
            throw error;
        }
    }

    // --- Lógica do Chatbot ---

    async function processChatbotFlow(userText) {
        try {
            switch (chatStep) {
                case 1:
                    await handleStep1(userText);
                    break;
                case 3:
                    await handleStep3(userText);
                    break;
                default:
                    addMessage("O SunnyBOT está fora de um fluxo de alocação. Por favor, reinicie a conversa.", false);
            }
        } catch (error) {
            const errorMessage = error.message.includes('Erro HTTP') ?
                error.message :
                `Ocorreu um erro: ${error.message}. Tente novamente.`;
            addMessage(`[ERRO BOT] ${errorMessage}`, false);

            // Reinicia o fluxo
            chatStep = 1;
            addMessage("Olá, sou o SunnyBOT! Estou aqui para te ajudar a alocar pessoas em seu projeto. Por favor, informe o nome do projeto em que deseja trabalhar.", false);
            projetoSelecionado = { nome: '', id: null };
            localStorage.removeItem('idProjetoSelecionado');
            localStorage.removeItem('sugestoesSunnyBot');
        }
    }

    async function handleStep1(nomeProjeto) {
        const projetoClean = nomeProjeto.trim();
        if (projetoClean.length < 3) {
            addMessage("Por favor, forneça um nome de projeto válido.", false);
            return;
        }

        const requestBody = { nomeProjeto: projetoClean, mensagem: "ponto" };
        const validacao = await postToBackend('/chatbot/validar-projeto', requestBody);

        projetoSelecionado.nome = validacao.projeto;
        projetoSelecionado.id = validacao.idProjeto;

        chatStep = 3;
        addMessage(`Projeto '${projetoSelecionado.nome}' validado com sucesso! Agora, descreva a demanda de profissionais que você precisa (Ex: Preciso de 5 programadores júnior com conhecimento em segurança).`, false);
    }

    async function handleStep3(demanda) {
        if (demanda.trim().length < 10) {
            addMessage("Por favor, descreva a demanda com mais detalhes.", false);
            return;
        }

        addMessage("Processando sua demanda... (Etapas 3, 4, 5)", false);

        const requestBody = { nomeProjeto: projetoSelecionado.nome, mensagem: demanda };
        const responseData = await postToBackend('/chatbot/demandar-profissionais', requestBody);

        const idProjeto = responseData.idProjeto;
        const usuariosSugestao = responseData.usuarios;

        localStorage.setItem('idProjetoSelecionado', idProjeto);
        localStorage.setItem('sugestoesSunnyBot', JSON.stringify(usuariosSugestao));

        showSuggestionsAndPopulateForm(usuariosSugestao);

        // Reinicia o fluxo
        chatStep = 1;
        projetoSelecionado = { nome: '', id: null };
    }

    // --- Eventos de envio de mensagem ---

    function handleSendMessage() {
        const userText = inputField.value.trim();
        if (userText !== "") {
            addMessage(userText, true);
            inputField.value = '';
            processChatbotFlow(userText);
        }
    }

    sendButton.addEventListener('click', handleSendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });

    // Mensagem inicial do bot
    addMessage("Olá, sou o SunnyBOT! Estou aqui para te ajudar a alocar pessoas em seu projeto. Por favor, informe o nome do projeto em que deseja trabalhar.", false);
});
