const API_BASE = window.API_BASE;
const API_PROJETOS = `${API_BASE}/api/projetos`;

function nomeProjeto() {
  Swal.fire({
    title: 'Adicionar um Projeto',
    html: `
      <div style="text-align:left;">
        <label for="nome">Nome do Projeto</label>
        <input id="nome" class="swal2-input" placeholder="Nome do Projeto">

        <label for="orcamento">Orçamento</label>
        <input id="orcamento" class="swal2-input" placeholder="Orçamento">

        <label for="data_inicio">Data de início</label>
        <input id="data_inicio" class="swal2-input" placeholder="dd/mm/aaaa">

        <label for="data_fim">Data de Encerramento</label>
        <input id="data_fim" class="swal2-input" placeholder="dd/mm/aaaa">
      </div>
    `,
    width: 1000,
    showCancelButton: true,
    confirmButtonText: 'Salvar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const nome = document.getElementById('nome').value.trim();
      const orcamento = document.getElementById('orcamento').value.trim();
      const data_inicio = document.getElementById('data_inicio').value.trim();
      const data_fim = document.getElementById('data_fim').value.trim();

      if (!nome || !orcamento || !data_inicio || !data_fim) {
        Swal.showValidationMessage('⚠️ Preencha todos os campos antes de salvar!');
        return false;
      }

      return { nome, orcamento, data_inicio, data_fim };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const dados = result.value;

      fetch(API_PROJETOS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      })
        .then(res => {
          if (res.status === 200) {
            Swal.fire('✅ Sucesso!', 'Projeto criado com sucesso.', 'success');
          } else if (res.status === 400) {
            Swal.fire('❌ Erro', 'Dados inválidos.', 'error');
          } else {
            Swal.fire('⚠️ Atenção', 'Erro inesperado no servidor.', 'warning');
          }
        })
        .catch(() => {
          Swal.fire('❌ Erro', 'Falha na comunicação com o servidor.', 'error');
        });
    } else if (result.dismiss !== Swal.DismissReason.cancel) {
      Swal.fire('Erro!', 'Ocorreu um problema ao criar o projeto.', 'error');
    }
  });
}
