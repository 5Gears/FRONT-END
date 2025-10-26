const BASE_URL = "http://localhost:8080/api";

const senioridades = ["ESTAGIARIO", "JUNIOR", "PLENO", "SENIOR"];

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

async function carregarCargos() {
    try {
        const response = await fetch(`${BASE_URL}/cargos`);
        if (!response.ok) throw new Error("Erro ao buscar cargos");
        const cargos = await response.json();

        const selectCargo = document.getElementById("cargo");
        selectCargo.innerHTML = "<option value=''>Selecione</option>";
        cargos.forEach(cargo => {
            const option = document.createElement("option");
            option.value = cargo.idCargo;
            option.text = cargo.nome;
            selectCargo.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar cargos:", error);
        alert("Não foi possível carregar os cargos.");
    }
}

function carregarSenioridades() {
    const select = document.getElementById("senioridade");
    select.innerHTML = "<option value=''>Selecione</option>";
    senioridades.forEach(s => {
        const option = document.createElement("option");
        option.value = s;
        option.text = s;
        select.appendChild(option);
    });
}

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

async function cadastrarUsuario() {
    const usuarioIdLogado = localStorage.getItem("usuarioId");
    if (!usuarioIdLogado) {
        alert("Usuário não identificado. Faça login novamente.");
        window.location.href = "./login.html";
        return;
    }

    const usuario = {
        nome: document.getElementById("nome").value.trim(),
        email: document.getElementById("email").value.trim(),
        cpf: document.getElementById("cpf").value.trim(),
        telefone: document.getElementById("telefone").value.trim(),
        area: document.getElementById("area").value.trim(),
        cargaHoraria: parseInt(document.getElementById("cargaHoraria").value),
        valorHora: parseFloat(document.getElementById("valorHora").value),
        idCargo: parseInt(document.getElementById("cargo").value),
        senioridade: document.getElementById("senioridade").value,
        idNivel: parseInt(document.getElementById("nivelPermissao").value),
        idEmpresa: parseInt(usuarioIdLogado)
    };

    try {
        const response = await fetch(`${BASE_URL}/usuarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(usuario)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.erro || "Erro ao cadastrar usuário");
        }

        const data = await response.json();
        alert(`Usuário ${data.nome} cadastrado com sucesso!`);

        const formDiv = document.getElementById("formUsuario");
        formDiv.querySelectorAll("input, select").forEach(el => el.value = "");

    } catch (error) {
        console.error(error);
        alert("Erro ao cadastrar usuário: " + error.message);
    }
}
