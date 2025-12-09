// Definição Central de Permissões (Role-Based Access Control)
const PERMISSOES_PAGINAS = {
    // Telas de acesso universal
    "perfil.html": ["FUNCIONARIO", "GERENTE", "PROJETOS", "ADMIN"], 
    "feedback.html": ["FUNCIONARIO", "GERENTE", "PROJETOS", "ADMIN"], 
    "faq.html": ["FUNCIONARIO", "GERENTE", "PROJETOS", "ADMIN"], 

    // Telas restritas a Gerentes e Admins
    "equipe.html": ["FUNCIONARIO", "GERENTE", "ADMIN"], 
    "cadastro.html": ["GERENTE", "ADMIN"], 
    "gerenciamento.html": ["GERENTE", "ADMIN"], 
    "alocacao.html": ["GERENTE", "ADMIN"], 
    "editar_alocacao.html": ["GERENTE", "ADMIN"], 
    "criar_projeto.html": ["GERENTE", "ADMIN"], 
    
    // Tela de Aprovação/Visualização (Para o nível PROJETOS)
    "visualizacao_projetos.html": ["PROJETOS", "ADMIN"], 
};

// ----------------------------------------------------------------------

function verificarAcessoPagina() {
    // 1. Obtém o nível de permissão (ex: PROJETOS) e o ID do usuário
    const nivelPermissao = localStorage.getItem("nivelPermissao");
    const idUsuario = localStorage.getItem("usuarioId");
    
    // Se não há sessão, redireciona para o login
    if (!idUsuario || !nivelPermissao) {
        window.location.href = "./index.html";
        return;
    }

    // 2. Determina o nome do arquivo atual
    const caminhoCompleto = window.location.pathname;
    const nomeArquivo = caminhoCompleto.substring(caminhoCompleto.lastIndexOf('/') + 1);

    // Se a página não está mapeada, assume-se que é livre
    if (!PERMISSOES_PAGINAS[nomeArquivo]) {
        return;
    }

    const permissoesNecessarias = PERMISSOES_PAGINAS[nomeArquivo];

    // 3. Bloqueio de URL: Se o usuário não tem o nível necessário, redireciona.
    if (!permissoesNecessarias.includes(nivelPermissao)) {
        console.warn(`Acesso negado: Usuário ${nivelPermissao} tentou acessar ${nomeArquivo}`);
        Swal.fire({
            icon: 'error',
            title: 'Acesso Negado',
            text: 'Você não tem permissão para acessar esta página.',
            showConfirmButton: false,
            timer: 2000
        });

        // Redireciona para uma tela segura
        window.location.href = "./perfil.html"; 
    }
}

// ----------------------------------------------------------------------

function filtrarMenuLateral() {
    const nivelPermissao = localStorage.getItem("nivelPermissao"); 
    const navMenu = document.querySelector('.menu ul');
    
    // Aborta se não tem menu ou permissão
    if (!navMenu || !nivelPermissao) return; 

    // Mapeamento de TODOS os links que existem no seu menu HTML
    const linksMenu = {
        "perfil.html": "Meu Perfil",
        "gerenciamento.html": "Projetos", // Gerente/Admin
        "cadastro.html": "Cadastro",
        "equipe.html": "Equipe",
        "feedback.html": "Avaliações",
        "faq.html": "Suporte",
        "visualizacao_projetos.html": "Visualizar Projetos", // Projetos
    };

    for (const [arquivo, texto] of Object.entries(linksMenu)) {
        const permissoesNecessarias = PERMISSOES_PAGINAS[arquivo] || [];
        const linkElemento = navMenu.querySelector(`a[href="./${arquivo}"]`);
        
        if (!linkElemento) continue; 
        
        // 1. Regra de Bloqueio de Menu: Oculta o link se a permissão falhar
        if (permissoesNecessarias.length > 0 && !permissoesNecessarias.includes(nivelPermissao)) {
            
            // --- LINHA CRÍTICA ---
            // Procura o elemento ancestral <li> mais próximo e o esconde.
            const listItem = linkElemento.closest('li');
            if (listItem) {
                listItem.style.display = 'none'; 
            }
            // ---------------------
            
            continue;
        }

        // Não há mais necessidade de substituição de URL.
        // Ocultar links restritos é suficiente.
    }
}

// ----------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    // A verificação de acesso deve vir primeiro!
    verificarAcessoPagina();
    filtrarMenuLateral();
});