const BASE_URL = "http://localhost:8080/api";

// Senioridades disponíveis
const senioridades = ["ESTAGIARIO", "JUNIOR", "PLENO", "SENIOR"];

// Níveis de permissão
const niveisPermissao = {
    "FUNCIONARIO": 1,
    "GERENTE": 2,
    "PROJETOS": 3,
    "ADMIN": 4
};

document.addEventListener("DOMContentLoaded", () => {
    carregarCargos();
    carregarSenioridades();
    carregarNiveisPermissao();
});

// Carregar cargos do backend
async function carregarCargos() {
    try {
        const response = await fetch(`${BASE_URL}/cargos`);
        if (!response.ok) throw new Error("Erro ao buscar cargos");
        const cargos = await response.json();

        const selectCargo = document.getElementById("cargo");
        selectCargo.innerHTML = "<option value=''>Selecione um cargo</option>";
        cargos.forEach(cargo => {
            const option = document.createElement("option");
            option.value = cargo.nome; // importante: enviamos o nome, não o ID
            option.text = cargo.nome;
            selectCargo.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar cargos:", error);
        Swal.fire('⚠️ Atenção', 'Não foi possível carregar os cargos.', 'warning');
    }
}

// Carregar senioridades
function carregarSenioridades() {
    const select = document.getElementById("senioridade");
    select.innerHTML = "<option value=''>Selecione</option>";
    senioridades.forEach(s => {
        const option = document.createElement("option");
        option.value = s;
        option.text = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); // exibição amigável
        select.appendChild(option);
    });
}

// Carregar níveis de permissão
function carregarNiveisPermissao() {
    const select = document.getElementById("nivelPermissao");
    select.innerHTML = "<option value=''>Selecione</option>";
    Object.keys(niveisPermissao).forEach(nivel => {
        const option = document.createElement("option");
        option.value = niveisPermissao[nivel];
        option.text = nivel;
        select.appendChild(option);
    });
}

// Função para cadastrar usuário
async function cadastrarUsuario() {
    const idEmpresa = localStorage.getItem("idEmpresa");
    if (!idEmpresa) {
        await Swal.fire('⚠️ Atenção', 'Usuário não identificado. Faça login novamente.', 'warning');
        window.location.href = "./login.html";
        return;
    }

    const usuario = {
        nome: document.getElementById("nome").value.trim(),
        email: document.getElementById("email").value.trim(),
        cpf: document.getElementById("cpf").value.trim(),
        telefone: document.getElementById("telefone").value.trim(),
        area: document.getElementById("area").value.trim(),
        cargaHoraria: parseInt(document.getElementById("cargaHoraria").value) || 0,
        valorHora: parseFloat(document.getElementById("valorHora").value) || 0,
        idEmpresa: parseInt(idEmpresa),
        idNivel: parseInt(document.getElementById("nivelPermissao").value) || 1,
        cargoNome: document.getElementById("cargo").value || null,
        senioridade: document.getElementById("senioridade").value || null
    };

    // Validação mínima
    if (!usuario.nome || !usuario.email) {
        Swal.fire('⚠️ Atenção', 'Nome e e-mail são obrigatórios.', 'warning');
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/usuarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(usuario)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || "Erro ao cadastrar usuário");
        }

        const data = await response.json();
        Swal.fire('✅ Sucesso', `Usuário <b>${data.nome}</b> cadastrado com sucesso!`, 'success');

        // Resetar formulário
        document.getElementById("formUsuario").querySelectorAll("input, select").forEach(el => el.value = "");

    } catch (error) {
        console.error(error);
        Swal.fire('❌ Erro', 'Erro ao cadastrar usuário: ' + error.message, 'error');
    }
}
