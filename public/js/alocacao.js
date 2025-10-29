const API_PROJETOS = 'http://localhost:8080/api/projetos';
const API_USUARIOS = 'http://localhost:8080/api/usuarios';
const idProjeto = localStorage.getItem('idProjeto');

document.addEventListener('DOMContentLoaded', async () => {
  const selectProjeto = document.querySelector('.form select');
  const inputEmailProf = document.querySelector('.form input:nth-of-type(1)');
  const inputInicio = document.querySelector('.form input:nth-of-type(2)');
  const inputFim = document.querySelector('.form input:nth-of-type(3)');
  const inputHorasDia = document.querySelector('.form input:nth-of-type(4)');
  const inputHorasTotais = document.querySelector('.form input:nth-of-type(5)');
  const btnAlocar = document.getElementById('btn-alocar');

  // --- SE NÃO HOUVER PROJETO SALVO, REDIRECIONA ---
  if (!idProjeto) {
    Swal.fire({
      icon: 'warning',
      title: 'Nenhum projeto selecionado',
      text: 'Você precisa escolher um projeto antes de acessar essa tela.',
      confirmButtonText: 'Voltar',
    }).then(() => {
      window.location.href = './gerenciamento.html';
    });
    return;
  }

  // --- Carrega projeto selecionado ---
  async function carregarProjeto() {
    try {
      const res = await fetch(`${API_PROJETOS}/${idProjeto}`);
      if (!res.ok) throw new Error('Erro ao carregar o projeto.');
      const projeto = await res.json();
      selectProjeto.innerHTML = `<option value="${projeto.id}" selected>${projeto.nome}</option>`;
      selectProjeto.disabled = true;
    } catch (err) {
      console.error('Erro ao carregar projeto:', err);
      Swal.fire('Erro', 'Não foi possível carregar o projeto.', 'error');
    }
  }

  // --- Alocar profissional ---
  async function alocarProfissional(event) {
    event.preventDefault();

    const email = inputEmailProf.value.trim();
    const dataInicio = inputInicio.value.trim();
    const dataFim = inputFim.value.trim();
    const horasPorDia = parseInt(inputHorasDia.value.trim());
    const horasTotais = parseInt(inputHorasTotais.value.trim());

    if (!email || !dataInicio || !dataFim || !horasPorDia || !horasTotais) {
      Swal.fire('Atenção', 'Preencha todos os campos antes de alocar.', 'warning');
      return;
    }

    // validação simples de datas
    if (new Date(dataFim) < new Date(dataInicio)) {
      Swal.fire('Erro', 'A data final não pode ser anterior à data inicial.', 'error');
      return;
    }

    try {
      const resUser = await fetch(`${API_USUARIOS}/buscar?email=${encodeURIComponent(email)}`);
      if (!resUser.ok) throw new Error('Erro ao buscar usuário.');
      const usuario = await resUser.json();

      if (!usuario || !usuario.idUsuario) {
        throw new Error(`Usuário com e-mail "${email}" não encontrado.`);
      }

      const body = {
        dataAlocacao: dataInicio,
        dataSaida: dataFim,
        horasPorDia,
        horasAlocadas: horasTotais
      };

      const res = await fetch(`${API_PROJETOS}/${idProjeto}/usuarios/${usuario.idUsuario}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(await res.text());

      Swal.fire({
        icon: 'success',
        title: 'Profissional Alocado!',
        text: `O usuário "${email}" foi alocado com sucesso!`,
        confirmButtonText: 'OK'
      });

      limparCampos();
    } catch (err) {
      console.error(err);
      Swal.fire('Erro', err.message || 'Falha ao alocar o profissional.', 'error');
    }
  }

  function limparCampos() {
    inputEmailProf.value = '';
    inputInicio.value = '';
    inputFim.value = '';
    inputHorasDia.value = '';
    inputHorasTotais.value = '';
  }

  await carregarProjeto();
  btnAlocar.addEventListener('click', alocarProfissional);
});
