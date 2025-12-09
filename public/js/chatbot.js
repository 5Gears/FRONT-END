// ======================================================
// CONFIGURAÇÃO DE APIS
// ======================================================
const API_BASE = window.API_BASE;
const API_CHATBOT = `${API_BASE}/api/assistente/chatbot`;
const API_PROJETOS = `${API_BASE}/api/projetos`;

const DEFAULT_HORAS_DIA = 8;
const DEFAULT_HORAS_TOTAL = 40;

let aguardandoAlocacao = false;
let projetoSelecionado = null;
let usuariosSugeridos = [];

// ======================================================
// INICIALIZAÇÃO
// ======================================================
document.addEventListener("DOMContentLoaded", async () => {
    const chatBody = document.querySelector(".chat-body");
    const inputField = document.querySelector(".chat-input input");
    const sendButton = document.querySelector(".chat-input button");

    // =============================
    // FUNÇÃO: adicionar mensagem
    // =============================
    function addMessage(text, isUser = true, type = "normal") {
        const msg = document.createElement("div");
        msg.classList.add("chat-message", isUser ? "user-message" : "bot-message");

        if (type === "error") msg.style.color = "#e74c3c";
        if (type === "success") msg.style.color = "#27ae60";
        if (type === "info") msg.style.color = "#2980b9";

        msg.textContent = text;
        chatBody.appendChild(msg);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // =============================
    // FUNÇÃO: POST genérico backend
    // =============================
    async function postToBackend(endpoint, body) {
        const res = await fetch(`${API_CHATBOT}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || `Erro ${res.status}`);
        }

        return await res.json();
    }

    // =============================
    // FUNÇÃO: POST de alocação
    // =============================
    async function postAlocacao(idProjeto, usuario, dataSaida) {
        const body = {
            dataAlocacao: new Date().toISOString().split("T")[0],
            dataSaida: dataSaida,
            horasPorDia: usuario.horasPorDia || DEFAULT_HORAS_DIA,
            horasAlocadas: usuario.horasTotais || DEFAULT_HORAS_TOTAL
        };

        const res = await fetch(`${API_PROJETOS}/${idProjeto}/usuarios/${usuario.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!res.ok) throw new Error(await res.text());
    }

    // =============================
    // NORMALIZAR SENIORIDADE
    // =============================
    function normalizarSenioridade(texto) {
        const mapa = {
            jr: "JUNIOR",
            junior: "JUNIOR",
            júnior: "JUNIOR",
            pleno: "PLENO",
            pl: "PLENO",
            sênior: "SENIOR",
            senior: "SENIOR",
            sr: "SENIOR",
            estagiario: "ESTAGIARIO",
            estagio: "ESTAGIARIO",
            estágio: "ESTAGIARIO",
            trainee: "ESTAGIARIO"
        };

        for (const [k, v] of Object.entries(mapa)) {
            if (texto.toLowerCase().includes(k)) return v;
        }
        return null;
    }

    // =============================
    // BUSCA DE PROFISSIONAIS
    // =============================
    async function handleBuscaProfissionais(userText) {
        if (userText.trim().length < 4) {
            addMessage("Por favor, descreva melhor o perfil desejado.", false, "info");
            return;
        }

        addMessage("🔎 Processando sua solicitação...", false, "info");

        const body = {
            idProjeto: projetoSelecionado.id,
            nomeProjeto: projetoSelecionado.nome,
            mensagem: userText
        };

        try {
            const resp = await postToBackend("/demandar-profissionais", body);

            const { usuarios } = resp;

            if (!usuarios || usuarios.length === 0) {
                addMessage("😕 Nenhum profissional adequado foi encontrado.", false, "info");
                return;
            }

            usuariosSugeridos = usuarios.map(u => ({
                ...u,
                horasPorDia: DEFAULT_HORAS_DIA,
                horasTotais: DEFAULT_HORAS_TOTAL
            }));

            let texto = "👥 Profissionais sugeridos:\n\n";
            texto += usuariosSugeridos
                .map(u => `${u.nome} (${u.senioridade}) – ${u.cargo} – R$${(u.valorHora ?? 0).toFixed(2)}/h`)
                .join("\n\n");

            addMessage(texto, false, "success");
            addMessage("Deseja alocar esses profissionais agora?", false);

            exibirBotaoAlocar();
            aguardandoAlocacao = true;

        } catch (err) {
            addMessage(`❌ Erro: ${err.message}`, false, "error");
        }
    }

    // =============================
    // BOTÃO "ALOCAR AGORA"
    // =============================
    function exibirBotaoAlocar() {
        const div = document.createElement("div");
        div.classList.add("chat-action");
        div.innerHTML = `<button class="alocar-btn">Alocar agora</button>`;
        chatBody.appendChild(div);

        div.querySelector(".alocar-btn").addEventListener("click", abrirPopupAlocacao);
    }

    // =============================
    // POPUP DE ALOCAÇÃO
    // =============================
    async function abrirPopupAlocacao() {
        if (!usuariosSugeridos.length) {
            addMessage("Nenhum profissional disponível para alocar.", false);
            return;
        }

        const hoje = new Date().toISOString().split("T")[0];

        const html = `
            <div style="max-height:350px;overflow-y:auto;text-align:left;">
                <label>Data final da alocação:</label>
                <input type="date" id="dataFimGlobal" value="${hoje}" style="margin-bottom:12px;">
                <hr>
                ${usuariosSugeridos.map(u => `
                    <div style="margin-bottom:12px">
                        <input type="checkbox" value="${u.id}" id="u_${u.id}">
                        <label for="u_${u.id}">
                            <b>${u.nome}</b> (${u.senioridade}) — ${u.cargo}
                        </label>
                        <br>
                        Horas/dia: <input type="number" id="hDia_${u.id}" value="${u.horasPorDia}" min="1" max="12" style="width:60px">
                        Horas totais: <input type="number" id="hTot_${u.id}" value="${u.horasTotais}" min="1" max="200" style="width:60px">
                    </div>
                `).join("")}
            </div>
        `;

        const result = await Swal.fire({
            title: `Selecione a alocação para <b>${projetoSelecionado.nome}</b>`,
            html,
            showCancelButton: true,
            confirmButtonText: "Confirmar",
            cancelButtonText: "Cancelar",
            width: 600,
            preConfirm: () => {
                const popup = Swal.getPopup();

                const dataFim = popup.querySelector("#dataFimGlobal").value;
                if (!dataFim) return Swal.showValidationMessage("Selecione a data final.");

                const selecionados = Array.from(
                    popup.querySelectorAll("input[type='checkbox']:checked")
                ).map(cb => {
                    const id = Number(cb.value);
                    return {
                        id,
                        horasPorDia: Number(popup.querySelector(`#hDia_${id}`).value),
                        horasTotais: Number(popup.querySelector(`#hTot_${id}`).value),
                        dataFim
                    };
                });

                if (selecionados.length === 0) {
                    Swal.showValidationMessage("Selecione ao menos 1 profissional.");
                    return false;
                }

                return selecionados;
            }
        });

        if (!result.isConfirmed) return;

        const selecionados = result.value;

        addMessage(`⏳ Alocando ${selecionados.length} profissional(is)...`, false, "info");

        try {
            for (const usuario of selecionados) {
                await postAlocacao(projetoSelecionado.id, usuario, usuario.dataFim);
            }

            Swal.fire("Sucesso!", "Profissionais alocados!", "success");
            addMessage("✅ Profissionais alocados com sucesso!", false, "success");

        } catch (err) {
            addMessage(`❌ Erro ao alocar: ${err.message}`, false, "error");
        }

        aguardandoAlocacao = false;
    }

    // ======================================================
    // RECUPERAR PROJETO SELECIONADO DA PAGINA ANTERIOR
    // ======================================================
    const idProjeto = localStorage.getItem("idProjeto");

    if (!idProjeto) {
        addMessage("⚠️ Nenhum projeto selecionado. Volte e escolha um projeto.", false, "error");
        return;
    }

    try {
        const resp = await fetch(`${API_PROJETOS}/${idProjeto}`);
        if (!resp.ok) throw new Error("Erro ao carregar projeto.");

        const projeto = await resp.json();

        projetoSelecionado = {
            id: projeto.id,
            nome: projeto.nome
        };

        addMessage(`Olá! 👋 Sou o SunnyBOT. Projeto atual: ${projeto.nome}.`, false, "info");
        addMessage("Descreva os profissionais desejados para iniciar a busca.", false);

    } catch (e) {
        addMessage("⚠️ Erro ao carregar informações do projeto.", false, "error");
    }

    // ======================================================
    // EVENTOS DE ENVIO DE MENSAGEM
    // ======================================================
    sendButton.addEventListener("click", () => {
        const txt = inputField.value.trim();
        if (!txt) return;
        addMessage(txt, true);
        inputField.value = "";
        processMessage(txt);
    });

    inputField.addEventListener("keypress", e => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendButton.click();
        }
    });

    // ======================================================
    // PROCESSAR MENSAGEM DO USUÁRIO
    // ======================================================
    async function processMessage(userText) {
        const senioridade = normalizarSenioridade(userText);
        if (senioridade) {
            addMessage(`🔎 Detected nível: ${senioridade}`, false, "info");
        }

        if (aguardandoAlocacao) {
            aguardandoAlocacao = false;

            if (userText.toLowerCase().includes("sim")) {
                abrirPopupAlocacao();
            } else {
                addMessage("Tudo bem! Você pode alocar manualmente depois.", false, "info");
            }
            return;
        }

        await handleBuscaProfissionais(userText);
    }

    // limpa lixo ao sair
    window.addEventListener("beforeunload", () => {
        localStorage.removeItem("sugestoesSunnyBot");
    });
});
