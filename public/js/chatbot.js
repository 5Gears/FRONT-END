const API_BASE = window.API_BASE;
const API_CHATBOT = `${API_BASE}/api/assistente/chatbot`;
const API_PROJETOS_CHATBOT = `${API_BASE}/api/projetos`;

// 🕒 Valores padrão
const DEFAULT_HORAS_DIA = 8;
const DEFAULT_HORAS_TOTAL = 40;

let aguardandoAlocacao = false;
let projetoSelecionado = null;
let usuariosSugeridos = [];

document.addEventListener('DOMContentLoaded', async () => {
  const chatBody = document.querySelector('.chat-body');
  const inputField = document.querySelector('.chat-input input');
  const sendButton = document.querySelector('.chat-input button');

  // -------- Utilitários --------
  function addMessage(text, isUser = true, type = 'normal') {
    const msg = document.createElement('div');
    msg.classList.add('chat-message', isUser ? 'user-message' : 'bot-message');
    if (type === 'error') msg.style.color = '#e74c3c';
    if (type === 'success') msg.style.color = '#27ae60';
    if (type === 'info') msg.style.color = '#2980b9';
    msg.textContent = text;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  async function postToBackend(endpoint, body) {
    const res = await fetch(`${API_CHATBOT}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `Erro ${res.status}`);
    }

    return await res.json();
  }

  // agora recebe também dataSaida
  async function postAlocacao(idProjeto, usuario, dataSaida) {
    const body = {
      dataAlocacao: new Date().toISOString().split('T')[0],
      dataSaida: dataSaida, // <= data final vinda do popup
      horasPorDia: usuario.horasPorDia || DEFAULT_HORAS_DIA,
      horasAlocadas: usuario.horasTotais || DEFAULT_HORAS_TOTAL
    };

    const res = await fetch(`${API_PROJETOS_CHATBOT}/${idProjeto}/usuarios/${usuario.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `Erro ${res.status}`);
    }
  }

  // -------- Normalizador --------
  function normalizarSenioridade(texto) {
    const mapa = {
      jr: 'JUNIOR',
      júnior: 'JUNIOR',
      junior: 'JUNIOR',
      pleno: 'PLENO',
      pl: 'PLENO',
      sênior: 'SENIOR',
      senior: 'SENIOR',
      sr: 'SENIOR',
      estagiario: 'ESTAGIARIO',
      estágio: 'ESTAGIARIO',
      estagio: 'ESTAGIARIO',
      trainee: 'ESTAGIARIO'
    };

    for (const [chave, valor] of Object.entries(mapa)) {
      if (texto.toLowerCase().includes(chave)) return valor;
    }
    return null;
  }

  // -------- Busca --------
  async function handleBuscaProfissionais(userText) {
    if (userText.trim().length < 4) {
      addMessage('Por favor, descreva melhor o perfil desejado.', false, 'info');
      return;
    }

    addMessage('🔎 Processando sua solicitação...', false, 'info');

    const body = {
      idProjeto: projetoSelecionado.id,
      nomeProjeto: projetoSelecionado.nome,
      mensagem: userText
    };

    try {
      const resp = await postToBackend('/demandar-profissionais', body);
      const { idProjeto, usuarios } = resp;

      if (!usuarios || usuarios.length === 0) {
        addMessage('😕 Nenhum profissional adequado foi encontrado.', false, 'info');
        return;
      }

      usuariosSugeridos = usuarios.map(u => ({
        ...u,
        horasPorDia: DEFAULT_HORAS_DIA,
        horasTotais: DEFAULT_HORAS_TOTAL
      }));

      localStorage.setItem('idProjetoSelecionado', idProjeto);
      localStorage.setItem('sugestoesSunnyBot', JSON.stringify(usuariosSugeridos));

      let texto = '👥 Profissionais sugeridos:\n\n';
      texto += usuariosSugeridos
        .map(u => `${u.nome} (${u.senioridade}) – ${u.cargo} – R$${(u.valorHora ?? 0).toFixed(2)}/h`)
        .join('\n\n');

      addMessage(texto, false, 'success');
      addMessage('Deseja alocar esses profissionais agora?', false);
      exibirBotaoAlocar();

      aguardandoAlocacao = true;
    } catch (err) {
      const msgErro = err.message?.toLowerCase() || '';
      if (msgErro.includes('vaga demais')) {
        addMessage('❌ Não entendi o perfil solicitado. Tente algo como:', false, 'error');
        addMessage('➡️ "Programador Júnior com Spring Boot"\n➡️ "Estagiário de Design UI/UX"', false, 'info');
      } else {
        addMessage(`❌ Erro: ${err.message}`, false, 'error');
      }
      console.error('Erro handleBuscaProfissionais:', err);
    }
  }

  // -------- Botão de alocação --------
  function exibirBotaoAlocar() {
    const div = document.createElement('div');
    div.classList.add('chat-action');
    div.innerHTML = `<button class="alocar-btn">Alocar agora</button>`;
    chatBody.appendChild(div);
    div.querySelector('.alocar-btn').addEventListener('click', abrirPopupAlocacao);
  }

  // -------- Pop-up --------
  async function abrirPopupAlocacao() {
    if (!usuariosSugeridos.length) {
      addMessage('Nenhum profissional disponível para alocar.', false);
      return;
    }

    const hojeStr = new Date().toISOString().split('T')[0];

    const html = `
      <div style="text-align:left;max-height:350px;overflow-y:auto;">
        <div style="margin-bottom:12px;">
          <label style="font-size:13px;font-weight:600;">Data final da alocação (para todos os selecionados):</label><br>
          <input type="date" id="dataFimGlobal" value="${hojeStr}" style="margin-top:5px;padding:4px 6px;">
        </div>
        <hr/>
        ${usuariosSugeridos.map(u => `
          <div style="margin-bottom:12px;padding:8px 0;border-bottom:1px solid #ddd;">
            <input type="checkbox" id="user_${u.id}" value="${u.id}">
            <label for="user_${u.id}">
              <b>${u.nome}</b> (${u.senioridade}) – ${u.cargo} – R$${(u.valorHora ?? 0).toFixed(2)}/h
            </label>
            <div style="margin-top:5px;">
              <label style="font-size:13px;">Horas/dia:</label>
              <input type="number" id="horasDia_${u.id}" value="${u.horasPorDia}" min="1" max="12" style="width:60px;margin-right:8px;">
              <label style="font-size:13px;">Horas totais:</label>
              <input type="number" id="horasTotal_${u.id}" value="${u.horasTotais}" min="1" max="200" style="width:60px;">
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
      width: 600,
      background: '#fff',
      preConfirm: () => {
        const popup = Swal.getPopup();
        const dataFimGlobal = popup.querySelector('#dataFimGlobal').value;

        if (!dataFimGlobal) {
          Swal.showValidationMessage('Defina a data final da alocação.');
          return false;
        }

        const selecionados = Array.from(
          popup.querySelectorAll('input[type="checkbox"]:checked')
        ).map(cb => {
          const id = Number(cb.value);
          const horasDia = Number(popup.querySelector(`#horasDia_${id}`).value);
          const horasTotais = Number(popup.querySelector(`#horasTotal_${id}`).value);
          return { id, horasPorDia: horasDia, horasTotais, dataFim: dataFimGlobal };
        });

        if (selecionados.length === 0) {
          Swal.showValidationMessage('Selecione pelo menos um profissional.');
          return false;
        }

        return selecionados;
      }
    });

    if (result.isConfirmed && result.value) {
      const selecionados = result.value;

      // Atualiza cache local com horas e dataFim
      usuariosSugeridos = usuariosSugeridos.map(u => {
        const sel = selecionados.find(s => s.id === u.id);
        return sel ? { ...u, ...sel } : u;
      });

      localStorage.setItem('sugestoesSunnyBot', JSON.stringify(usuariosSugeridos));
      addMessage(`⏳ Alocando ${selecionados.length} profissional(is)...`, false, 'info');

      try {
        for (const usuario of selecionados) {
          await postAlocacao(projetoSelecionado.id, usuario, usuario.dataFim);
        }
        Swal.fire('✅ Sucesso', 'Profissionais alocados com sucesso!', 'success');
        addMessage('✅ Todos os profissionais foram alocados!', false, 'success');
      } catch (err) {
        console.error('Erro ao alocar:', err);
        Swal.fire('Erro', 'Falha ao alocar um ou mais profissionais.', 'error');
        addMessage(`❌ Ocorreu um erro: ${err.message}`, false, 'error');
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

      addMessage(`Olá! 👋 Sou o SunnyBOT. Projeto atual: ${projetoSelecionado.nome}.`, false, 'info');
      addMessage('Descreva os profissionais que deseja alocar neste projeto.', false);
    } catch {
      addMessage('⚠️ Erro ao carregar o projeto. Volte à tela anterior.', false, 'error');
    }
  } else {
    addMessage('⚠️ Nenhum projeto selecionado. Volte à tela anterior e escolha um projeto.', false, 'error');
  }

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
      const nivelDetectado = normalizarSenioridade(userText);
      if (nivelDetectado)
        addMessage(`🔎 Detectei que você busca um profissional de nível ${nivelDetectado}.`, false, 'info');

      if (aguardandoAlocacao) {
        aguardandoAlocacao = false;
        if (userText.toLowerCase().includes('sim')) await abrirPopupAlocacao();
        else addMessage('Tudo bem! Você pode alocar manualmente depois.', false, 'info');
        return;
      }

      if (!projetoSelecionado?.id) {
        addMessage('⚠️ Nenhum projeto selecionado.', false, 'error');
        return;
      }

      await handleBuscaProfissionais(userText);
    } catch (err) {
      addMessage(`❌ Erro: ${err.message}`, false, 'error');
    }
  }

  window.addEventListener('beforeunload', () => {
    localStorage.removeItem('idProjetoSelecionado');
    localStorage.removeItem('sugestoesSunnyBot');
  });
});
