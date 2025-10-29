const API_PROJETOS = 'http://localhost:8080/api/projetos';
const API_USUARIOS = 'http://localhost:8080/api/usuarios';
const idProjeto = localStorage.getItem('idProjeto');

document.addEventListener('DOMContentLoaded', async () => {
  const selectProjeto = document.querySelector('.form select');
  const inputNomeProf = document.querySelector('.form input:nth-of-type(1)');
  const inputInicio = document.querySelector('.form input:nth-of-type(2)');
  const inputFim = document.querySelector('.form input:nth-of-type(3)');
  const inputHorasDia = document.querySelector('.form input:nth-of-type(4)');
  const inputHorasTotais = document.querySelector('.form input:nth-of-type(5)');
  const btnAlocar = document.getElementById('btn-alocar');

  async function carregarProjeto() {
    if (!idProjeto) return;
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

  async function alocarProfissional(event) {
    event.preventDefault();

    const nome = inputNomeProf.value.trim();
    const dataInicio = inputInicio.value.trim();
    const dataFim = inputFim.value.trim();
    const horasPorDia = parseInt(inputHorasDia.value.trim());
    const horasTotais = parseInt(inputHorasTotais.value.trim());

    if (!nome || !dataInicio || !dataFim || !horasPorDia || !horasTotais) {
      Swal.fire('Atenção', 'Preencha todos os campos antes de alocar.', 'warning');
      return;
    }

    try {
      const resUser = await fetch(`${API_USUARIOS}?nome=${encodeURIComponent(nome)}`);
      if (!resUser.ok) throw new Error('Erro ao buscar usuário.');
      const usuarios = await resUser.json();
      if (!usuarios.length) throw new Error(`Usuário "${nome}" não encontrado.`);
      const idUsuario = usuarios[0].id;

      const body = {
        dataAlocacao: dataInicio,
        dataSaida: dataFim,
        horasPorDia,
        horasAlocadas: horasTotais
      };

      const res = await fetch(`${API_PROJETOS}/${idProjeto}/usuarios/${idUsuario}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(await res.text());

      Swal.fire({
        icon: 'success',
        title: 'Profissional Alocado!',
        text: `O usuário "${nome}" foi alocado com sucesso!`,
        confirmButtonText: 'OK'
      });

      limparCampos();
    } catch (err) {
      console.error(err);
      Swal.fire('Erro', err.message || 'Falha ao alocar o profissional.', 'error');
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
