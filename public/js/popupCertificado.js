const API_BASE = window.API_BASE;
const API_LICENCAS = `${API_BASE}/api/licencas`;

function licencaCertificado() {
  Swal.fire({
    title: 'Adicionar Licença ou Certificado',
    html: `
      <div style="text-align:left;">
        <label for="nome">Nome</label>
        <input id="nome" class="swal2-input" placeholder="Nome do certificado">

        <label for="org">Organização Emissora</label>
        <input id="org" class="swal2-input" placeholder="Organização">

        <label for="data_inicio">Data de emissão (início)</label>
        <input id="data_inicio" class="swal2-input" placeholder="dd/mm/aaaa">

        <label for="data_fim">Data de expiração (fim)</label>
        <input id="data_fim" class="swal2-input" placeholder="dd/mm/aaaa">
      </div>
    `,
    width: 1000,
    showCancelButton: true,
    confirmButtonText: 'Salvar',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const nome = document.getElementById('nome').value;
      const org = document.getElementById('org').value;
      const data_inicio = document.getElementById('data_inicio').value;
      const data_fim = document.getElementById('data_fim').value;

      if (!nome || !org || !data_inicio || !data_fim) {
        Swal.showValidationMessage('⚠️ Preencha todos os campos!');
        return false;
      }

      return { nome, org, data_inicio, data_fim };
    }
  }).then((result) => {
    if (result.isConfirmed) {
      const dados = result.value;

      fetch(API_LICENCAS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      })
        .then(res => {
          if (res.status === 200) {
            Swal.fire('✅ Sucesso!', 'Licença/Certificado adicionado.', 'success');
          } else if (res.status === 400) {
            Swal.fire('❌ Erro', 'Dados inválidos.', 'error');
          } else {
            Swal.fire('⚠️ Atenção', 'Erro inesperado no servidor.', 'warning');
          }
        })
        .catch(() => {
          Swal.fire('❌ Erro', 'Falha na comunicação com o servidor.', 'error');
        });
    }
  });
}
