const API_BASE = window.API_BASE;
const API_LOGIN = `${API_BASE}/api/login`;
const API_VERIFICAR = `${API_BASE}/api/login/verificar-primeiro-acesso`;
const API_USUARIOS = `${API_BASE}/api/usuarios`;

const campoSenha = document.getElementById("senha");
const botaoLogin = document.getElementById("btnLogin");

campoSenha.style.display = "none";

const nomeNiveisPermissao = {
    1: "FUNCIONARIO",
    2: "GERENTE",
    3: "PROJETOS",
    4: "ADMIN"
};

function converterIdNivelParaNome(idNivel) {
    if (idNivel && nomeNiveisPermissao[idNivel]) {
        return nomeNiveisPermissao[idNivel];
    }
    return "FUNCIONARIO";
}

async function verificarEmail() {
    const email = document.getElementById("email").value.trim();

    if (!email) return;

    try {
        const res = await fetch(API_VERIFICAR, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (!res.ok) {
            Swal.fire("Erro", data.erro || "Email não encontrado.", "error");
            return;
        }

        if (data.primeiroAcesso) {
            localStorage.setItem("emailUsuario", email);
            Swal.fire("Primeiro acesso", "Defina sua nova senha!", "info");
            window.location.href = "./loginPrimeiroAcesso.html";
        } else {
            campoSenha.style.display = "block";
            botaoLogin.innerText = "Entrar";
        }

    } catch (e) {
        Swal.fire("Erro", "Falha ao verificar e-mail.", "error");
    }
}

async function realizarLogin() {
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!email || !senha) {
        Swal.fire("Atenção", "Informe seu e-mail e senha.", "warning");
        return;
    }

    const body = { email, senha };

    try {
        const response = await fetch(API_LOGIN, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const dataLogin = await response.json();

        if (!response.ok) {
            Swal.fire("Erro", dataLogin.erro || "Erro ao efetuar login.", "error");
            return;
        }

        localStorage.setItem("usuarioId", dataLogin.id);
        localStorage.setItem("nomeUsuario", dataLogin.nome);
        localStorage.setItem("token", dataLogin.token);
        localStorage.setItem("emailUsuario", dataLogin.email);
        
        const usuarioId = dataLogin.id;

        const respostaPerfil = await fetch(`${API_USUARIOS}/${usuarioId}`);
        if (!respostaPerfil.ok) throw new Error("Falha ao buscar ID de permissão e ID da Empresa.");

        const dadosPerfil = await respostaPerfil.json();
        
        // --- EXTRAÇÃO E CONVERSÃO DO NÍVEL DE PERMISSÃO ---
        const idNivel = dadosPerfil.idNivel;
        const nivelPermissaoNome = converterIdNivelParaNome(idNivel);

        if (!nivelPermissaoNome) {
            throw new Error("Nível de permissão não definido após conversão.");
        }
      
        const idEmpresa = dadosPerfil.idEmpresa; 
        
        // 1. Salva o Nível de Permissão (para auth.js)
        localStorage.setItem("nivelPermissao", nivelPermissaoNome); 
        
        // 2. Salva o ID da Empresa (para perfil.js)
        if (idEmpresa) {
            localStorage.setItem("idEmpresa", idEmpresa); 
        } else {
            localStorage.removeItem("idEmpresa"); // Garante que não haja lixo se for nulo
        }

        Swal.fire("Sucesso", "Bem-vindo!", "success");
        window.location.href = "./perfil.html";

    } catch (error) {
        console.error("Erro no processo de login:", error);
        Swal.fire("Erro", "Falha ao conectar ou obter dados essenciais.", "error");
        
        // Limpa a sessão em caso de erro crítico
        localStorage.removeItem("usuarioId");
        localStorage.removeItem("nivelPermissao");
        localStorage.removeItem("idEmpresa");
        localStorage.removeItem("nomeUsuario");
        localStorage.removeItem("token");
        localStorage.removeItem("emailUsuario");
    }
}