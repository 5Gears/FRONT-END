// Variáveis de estado global para rastrear o fluxo do chatbot
let chatStep = 1;
let projetoSelecionado = { nome: '', id: null };
const API_BASE_URL = 'http://localhost:8080/api'; // Substitua pela URL real do seu backend

document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleciona os elementos principais
    const chatBody = document.querySelector('.chat-body');
    const inputField = document.querySelector('.chat-input input');
    const sendButton = document.querySelector('.chat-input button');
    const alocarForm = document.querySelector('.formulario'); // Adicionado para desabilitar/habilitar

    // --- Funções de UI do Chatbot ---

    /**
     * Adiciona uma nova mensagem ao corpo do chat.
     * @param {string} text - O texto da mensagem.
     * @param {boolean} isUser - True se for mensagem do usuário, false para mensagem do bot.
     */
    function addMessage(text, isUser = true) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message');
        messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');
        messageDiv.textContent = text;
        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight; // Rola para a mensagem mais recente
    }

    /**
     * Exibe a lista de sugestões de usuários e permite a seleção no formulário principal.
     * @param {Array} usuarios - Lista de usuários sugeridos pelo SunnyBOT.
     */
    function showSuggestionsAndPopulateForm(usuarios) {
        let suggestionsHTML = 'Sugestões encontradas: \n';
        const selectProfissional = alocarForm.querySelector('.form span:nth-child(2) + input[type="text"]');
        const selectNomeProjeto = alocarForm.querySelector('select');
        const alocarButton = alocarForm.querySelector('.proximo button');
        
        // Limpa e popula o campo de projeto no formulário principal (se houver um select para isso)
        if (selectNomeProjeto) {
             selectNomeProjeto.innerHTML = `<option value="${projetoSelecionado.id}">${projetoSelecionado.nome}</option>`;
             selectNomeProjeto.disabled = true; // Desabilita para manter o projeto selecionado pelo chat
        }
        
        // Limpa e popula o campo Nome do Profissional para mostrar as sugestões (neste caso, é um input no seu HTML, adaptando para sugestão)
        // Se fosse um SELECT, seria mais fácil. Aqui, apenas exibimos as sugestões no chat.
        
        // *Adaptação: Exibindo sugestões no chat e orientando o gerente a usar o formulário*
        
        suggestionsHTML += usuarios.map(u => 
            `ID: ${u.id}, Nome: ${u.nome}, Cargo: ${u.cargo} (${u.senioridade}), Valor/Hora: R$ ${u.valorHora.toFixed(2)}`
        ).join('\n');
        
        addMessage(suggestionsHTML, false);
        
        addMessage(`*O front-end armazenou as sugestões e o ID do projeto*. Por favor, utilize o formulário principal para preencher o restante dos dados e realizar a alocação manual (Etapa 7).`, false);
    }
    
    // --- Funções de Comunicação com o Backend (Fetch API) ---
    
    /**
     * Envia uma requisição POST ao backend.
     * @param {string} endpoint - O caminho da API.
     * @param {Object} body - O corpo da requisição em JSON.
     * @returns {Promise<Object>} - O objeto de resposta do backend.
     */
    async function postToBackend(endpoint, body) {
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            
            const data = await response.json();

            if (!response.ok) {
                // Lança um erro para status HTTP 4xx ou 5xx
                throw new Error(data.erro || `Erro HTTP: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('Erro na comunicação com a API:', error);
            throw error; // Propaga o erro para ser tratado pela função chamadora
        }
    }

    // --- Lógica de Fluxo (SunnyBOT) ---

    /**
     * Processa a mensagem do usuário e avança o fluxo do chatbot.
     * @param {string} userText - A mensagem do usuário.
     */
    async function processChatbotFlow(userText) {
        try {
            switch (chatStep) {
                case 1: // Etapa 1: Início da conversa - Espera o nome do projeto
                    await handleStep1(userText);
                    break;
                case 3: // Etapa 3: Interpretação da necessidade - Espera a descrição da demanda
                    await handleStep3(userText);
                    break;
                // Outras etapas (2, 4, 5, 6) são tratadas no backend ou em chamadas encadeadas
                default:
                    addMessage("O SunnyBOT está fora de um fluxo de alocação. Por favor, reinicie a conversa.", false);
            }
        } catch (error) {
            // Trata erros de requisição (ex: Projeto não encontrado - HTTP 400)
            const errorMessage = error.message.includes('Erro HTTP') ? 
                                 error.message : 
                                 `Ocorreu um erro: ${error.message}. Tente novamente.`;
            addMessage(`[ERRO BOT] ${errorMessage}`, false);
            // Volta para a etapa inicial ou a que falhou (neste caso, volta para o início do fluxo)
            chatStep = 1;
            addMessage("Olá, sou o SunnyBOT! Estou aqui para te ajudar a alocar pessoas em seu projeto. Por favor, informe o nome do projeto em que deseja trabalhar.", false);
            // Limpa dados temporários, se necessário
            projetoSelecionado = { nome: '', id: null };
            localStorage.removeItem('idProjetoSelecionado');
            localStorage.removeItem('sugestoesSunnyBot');
        }
    }

    /**
     * Etapa 1 e 2: Envia o nome do projeto para validação no backend.
     * @param {string} nomeProjeto - O nome do projeto fornecido pelo usuário.
     */
    async function handleStep1(nomeProjeto) {
        const projetoClean = nomeProjeto.trim();
        if (projetoClean.length < 3) {
            addMessage("Por favor, forneça um nome de projeto válido.", false);
            return;
        }

        // Requisição (Etapa 1) e Validação (Etapa 2)
        const requestBody = {
            nomeProjeto: projetoClean,
            mensagem: "iniciar"
        };
        // O endpoint /chatbot/iniciar no backend deve lidar com as etapas 1 a 6
        // Se o projeto for válido, o backend retorna a sugestão (Etapa 6).
        // Se o projeto não for encontrado (Etapa 2), o backend retorna um HTTP 400.

        // Simulação de chamada para o backend
        // *IMPORTANTE: No seu backend, esta única chamada deve englobar a validação do projeto (Etapa 2)
        // e, em seguida, a solicitação da demanda (Etapa 3/4/5/6) para a próxima mensagem do usuário.
        
        // Para seguir estritamente o seu fluxo de etapas:
        
        // Simulação Etapa 1 e 2: Apenas a validação do projeto
        const validacao = await postToBackend('/chatbot/validar-projeto', requestBody); 
        
        // Se sucesso (validacao.idProjeto existe):
        projetoSelecionado.nome = validacao.projeto; 
        projetoSelecionado.id = validacao.idProjeto; 
        
        // Passa para a Etapa 3
        chatStep = 3;
        addMessage(`Projeto '${projetoSelecionado.nome}' validado com sucesso! Agora, descreva a demanda de profissionais que você precisa (Ex: Preciso de 5 programadores júnior com conhecimento em segurança).`, false);
    }
    
    /**
     * Etapa 3, 4, 5 e 6: Envia a demanda de profissionais para gerar filtro, buscar e retornar sugestões.
     * @param {string} demanda - A descrição da demanda fornecida pelo usuário.
     */
    async function handleStep3(demanda) {
        if (demanda.trim().length < 10) {
            addMessage("Por favor, descreva a demanda com mais detalhes.", false);
            return;
        }
        
        addMessage("Processando sua demanda... (Etapas 3, 4, 5)", false);

        // Requisição que envolve (Etapa 3) e o backend executa (Etapa 4, 5 e retorna 6)
        const requestBody = {
            nomeProjeto: projetoSelecionado.nome,
            mensagem: demanda
        };

        // Simulação de chamada para o backend (esperando o retorno completo da Etapa 6)
        // O endpoint /chatbot/demandar-profissionais deve orquestrar as etapas 3, 4, 5 e retornar a 6
        const responseData = await postToBackend('/chatbot/demandar-profissionais', requestBody); 

        // Tratamento da Etapa 6: Retorno completo para o front-end
        const idProjeto = responseData.idProjeto; // 3
        const usuariosSugestao = responseData.usuarios; // Array de usuários

        // Armazena dados no localStorage (Etapa 6 - Armazenamento)
        localStorage.setItem('idProjetoSelecionado', idProjeto); //
        localStorage.setItem('sugestoesSunnyBot', JSON.stringify(usuariosSugestao)); //

        // Exibe sugestões e orienta o gerente (passa para Etapa 7 - Alocação real)
        showSuggestionsAndPopulateForm(usuariosSugestao);
        
        // Finaliza o fluxo do chatbot para alocação, voltando ao estado inicial para nova busca, se necessário
        chatStep = 1;
        projetoSelecionado = { nome: '', id: null };
    }

    // --- Configuração de Event Listeners ---

    /**
     * Função principal de envio de mensagem pelo chat.
     */
    function handleSendMessage() {
        const userText = inputField.value.trim();

        if (userText !== "") {
            addMessage(userText, true);
            inputField.value = '';

            // 4. Inicia o processamento do fluxo após a mensagem do usuário
            processChatbotFlow(userText);
        }
    }

    // Adiciona ouvintes de evento
    sendButton.addEventListener('click', handleSendMessage);
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });

    // Mensagem inicial do bot (Etapa 1)
    addMessage("Olá, sou o SunnyBOT! Estou aqui para te ajudar a alocar pessoas em seu projeto. Por favor, informe o nome do projeto em que deseja trabalhar.", false); //
});