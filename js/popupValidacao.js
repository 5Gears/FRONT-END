function validacao() {
    if (result.isConfirmed) {
        const { login, senha } = result.value;

        // Aqui você chama seu backend (exemplo com fetch)
        fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login, senha })
        })
            .then(res => {
                if (res.status === 200) {
                    Swal.fire('✅ Sucesso', 'Login realizado com sucesso', 'success');
                } else if (res.status === 404) {
                    Swal.fire('❌ Erro', 'Usuário não encontrado', 'error');
                } else {
                    Swal.fire('⚠️ Atenção', 'Algo deu errado', 'warning');
                }
            })
            .catch(() => {
                Swal.fire('⚠️ Erro', 'Falha na comunicação com o servidor', 'error');
            });
    }
};