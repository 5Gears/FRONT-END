// ===========================================
// SunnyBOT – Integração Chatbot (FiveGears)
// ===========================================

const API_BASE_URL = 'http://localhost:8080/api/assistente/chatbot';
const API_PROJETOS_CHATBOT = 'http://localhost:8080/api/projetos';

// 🕒 Defaults (inputs vazios — gerente deve preencher)
const DEFAULT_HORAS_DIA = '';
const DEFAULT_HORAS_TOTAL = '';

let aguardandoAlocacao = false;
let projetoSelecionado = null;
let usuariosSugeridos = [];

document.addEventListener('DOMContentLoaded', async () => {
  const chatBody = document.querySelector('.chat-body');
  const inputField = document.querySelector('.chat-input input');
  const sendButton = document.querySelector('.chat-input button');

  // -------- Utilidades --------
  function addMessage(text, isUser = true) {
    const msg = document.createElement('div');
    msg.classList.add('chat-message', isUser ? 'user-message' : 'bot-message');
    msg.textContent = text;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // -------- Backend --------
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

  async function postAlocacao(idProjeto, idUsuario, horasAlocadas, horasPorDia) {
    const body = {
      dataAlocacao: new Date().toISOString().split('T')[0],
      dataSaida: null,
      horasPorDia,
      horasAlocadas
    };

    console.log('📦 Enviando alocação:', { idProjeto, idUsuario, body });

    const res = await fetch(`${API_PROJETOS_CHATBOT}/${idProjeto}/usuarios/${idUsuario}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.text();
    console.log('📬 Resposta do backend:', res.status, data);

    if (!res.ok) throw new Error(data || `Erro ${res.status}`);
  }

  // -------- Busca de profissionais --------
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
      .map(u => `${u.nome} (${u.senioridade}) – ${u.cargo} – R$${(u.valorHora ?? 0).toFixed(2)}/h`)
      .join('\n\n');

    addMessage(texto, false);
    addMessage('Deseja alocar esses profissionais agora?', false);
    exibirBotaoAlocar();

    aguardandoAlocacao = true;
  }

  // -------- Botão + Pop-up de alocação --------
  function exibirBotaoAlocar() {
    const div = document.createElement('div');
    div.classList.add('chat-action');
    div.innerHTML = `<button class="alocar-btn">Alocar agora</button>`;
    chatBody.appendChild(div);
    div.querySelector('.alocar-btn').addEventListener('click', abrirPopupAlocacao);
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
              <b>${u.nome}</b> (${u.senioridade}) – ${u.cargo} – R$${(u.valorHora ?? 0).toFixed(2)}/h
            </label><br>
            <div style="margin-left:22px;margin-top:6px;">
              <label>Horas por dia: </label>
              <input id="horasPorDia_${u.id}" type="number" min="1" max="12" style="width:70px" value="${DEFAULT_HORAS_DIA}" placeholder="00">
              &nbsp;
              <label>Total: </label>
              <input id="horasTotais_${u.id}" type="number" min="1" max="200" style="width:70px" value="${DEFAULT_HORAS_TOTAL}" placeholder="00">
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
      preConfirm: () => {
        const popup = Swal.getPopup();

        const selecionados = Array.from(popup.querySelectorAll('input[type="checkbox"]:checked')).map(cb => {
          const id = Number(cb.value);
          const hpdEl = popup.querySelector(`#horasPorDia_${CSS.escape(String(id))}`);
          const httEl = popup.querySelector(`#horasTotais_${CSS.escape(String(id))}`);

          const horasPorDia = Number(hpdEl?.value);
          const horasTotais = Number(httEl?.value);

          return { idUsuario: id, horasPorDia, horasTotais };
        });

        if (selecionados.length === 0) {
          Swal.showValidationMessage('Selecione pelo menos um profissional.');
          return false;
        }

        // validação: impedir campos vazios, 0, NaN
        for (const s of selecionados) {
          if (!Number.isFinite(s.horasPorDia) || !Number.isFinite(s.horasTotais) ||
              s.horasPorDia <= 0 || s.horasTotais <= 0) {
            Swal.showValidationMessage('Preencha as horas de todos os selecionados.');
            return false;
          }
        }

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

  // -------- Inicialização --------
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

  // -------- Envio + Processamento --------
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
