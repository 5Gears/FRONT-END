const API_BASE = window.API_BASE;
const BASE_URL = `${API_BASE}/api`;

// Senioridades e permissões
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

let todosCargos = [];

async function carregarCargos() {
  try {
    const response = await fetch(`${BASE_URL}/cargos`);
    if (!response.ok) throw new Error("Erro ao buscar cargos");
    todosCargos = await response.json();

    const inputCargo = document.getElementById("cargoInput");
    const listaSugestoes = document.getElementById("cargoSugestoes");

    inputCargo.addEventListener("input", () => {
      const valor = inputCargo.value.toLowerCase();
      listaSugestoes.innerHTML = "";

      if (valor.length < 2) {
        listaSugestoes.style.display = "none";
        return;
      }

      const resultados = todosCargos.filter(c => c.nome.toLowerCase().includes(valor)).slice(0, 10);
      resultados.forEach(cargo => {
        const li = document.createElement("li");
        li.textContent = cargo.nome;
        li.addEventListener("click", () => {
          inputCargo.value = cargo.nome;
          listaSugestoes.innerHTML = "";
          listaSugestoes.style.display = "none";
        });
        listaSugestoes.appendChild(li);
      });
      listaSugestoes.style.display = resultados.length ? "block" : "none";
    });

    document.addEventListener("click", (e) => {
      if (!listaSugestoes.contains(e.target) && e.target !== inputCargo)
        listaSugestoes.style.display = "none";
    });

  } catch (error) {
    console.error("Erro ao carregar cargos:", error);
    Swal.fire('⚠️ Atenção', 'Não foi possível carregar os cargos.', 'warning');
  }
}

function carregarSenioridades() {
  const select = document.getElementById("senioridade");
  select.innerHTML = "<option value=''>Selecione</option>";
  senioridades.forEach(s => {
    const option = document.createElement("option");
    option.value = s;
    option.text = s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
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
  const idEmpresa = localStorage.getItem("idEmpresa");
  if (!idEmpresa) {
    await Swal.fire('⚠️ Atenção', 'Usuário não identificado. Faça login novamente.', 'warning');
    window.location.href = "/public/index.html";
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
    cargoNome: document.getElementById("cargoInput").value || null,
    senioridade: document.getElementById("senioridade").value || null
  };

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
    document.querySelectorAll("#formUsuario input, #formUsuario select").forEach(el => el.value = "");
  } catch (error) {
    console.error(error);
    Swal.fire('❌ Erro', 'Erro ao cadastrar usuário: ' + error.message, 'error');
  }
}
