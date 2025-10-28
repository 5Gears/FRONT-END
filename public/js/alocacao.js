// ===========================================
// Alocação Manual de Profissionais (FiveGears)
// ===========================================

const API_PROJETOS = 'http://localhost:8080/api/projetos';
const API_USUARIOS = 'http://localhost:8080/api/usuarios';
const idProjeto = localStorage.getItem('idProjeto');

document.addEventListener('DOMContentLoaded', async () => {
  const inputNomeProf = document.querySelector('.form input:nth-of-type(1)');
  const selectProjeto = document.querySelector('.form select');
  const inputInicio = document.querySelector('.form input:nth-of-type(2)');
  const inputFim = document.querySelector('.form input:nth-of-type(3)');
  const inputHorasDia = document.querySelector('.form input:nth-of-type(4)');

  const inputHorasTotais = document.createElement('input');
  inputHorasTotais.type = 'text';
  inputHorasTotais.placeholder = 'Total de horas do projeto';
  document.querySelector('.form').appendChild(inputHorasTotais);

  const btnAlocar = document.querySelector('.proximo button a');

  if (!idProjeto) {
    Swal.fire({
      icon: 'warning',
      title: 'Projeto não selecionado',
      text: 'Volte e escolha um projeto antes de alocar profissionais.',
      confirmButtonText: 'OK'
    }).then(() => (window.location.href = './editar_alocacao.html'));
    return;
  }

  async function carregarProjeto() {
    try {
      const res = await fetch(`${API_PROJETOS}/${idProjeto}`);
      const projeto = await res.json();
      selectProjeto.innerHTML = `<option value="${projeto.id}" selected>${projeto.nome}</option>`;
      selectProjeto.disabled = true;
    } catch {
      Swal.fire('Erro', 'Não foi possível carregar o projeto.', 'error');
    }
  }

  async function alocarProfissional(event) {
    event.preventDefault();

    const nome = inputNomeProf.value.trim();
    const dataInicio = inputInicio.value.trim();
    const dataFim = inputFim.value.trim();
    const horasPorDia = inputHorasDia.value.trim();
    const horasTotais = inputHorasTotais.value.trim();

    if (!nome || !dataInicio || !dataFim || !horasPorDia || !horasTotais) {
      Swal.fire('Atenção', 'Preencha todos os campos.', 'warning');
      return;
    }

    try {
      const resUser = await fetch(`${API_USUARIOS}?nome=${encodeURIComponent(nome)}`);
      const usuarios = await resUser.json();
      if (!usuarios.length) throw new Error(`Usuário "${nome}" não encontrado`);
      const idUsuario = usuarios[0].id;

      const body = {
        dataAlocacao: dataInicio,
        dataSaida: dataFim,
        horasPorDia: parseInt(horasPorDia),
        horasAlocadas: parseInt(horasTotais)
      };

      const res = await fetch(`${API_PROJETOS}/${idProjeto}/usuarios/${idUsuario}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(await res.text());

      Swal.fire('Sucesso', `Usuário "${nome}" alocado com sucesso!`, 'success');
      limparCampos();
    } catch (err) {
      console.error(err);
      Swal.fire('Erro', err.message || 'Falha ao alocar.', 'error');
    }
  }

  function limparCampos() {
    inputNomeProf.value = '';
    inputInicio.value = '';
    inputFim.value = '';
    inputHorasDia.value = '';
    inputHorasTotais.value = '';
  }

  await carregarProjeto();
  btnAlocar.addEventListener('click', alocarProfissional);
});
