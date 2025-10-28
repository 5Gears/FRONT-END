document.addEventListener("DOMContentLoaded", async () => {
    const criarProjetoCheckbox = document.getElementById("criarProjeto");
    const editarProjetoCheckbox = document.getElementById("editarProjeto");
    const selectProjetoDiv = document.querySelector(".selacao-projeto");
    const selectProjeto = selectProjetoDiv.querySelector("select");


    // Função para buscar projetos
    async function carregarProjetos() {
        try {
            const response = await fetch("http://localhost:8080/api/projetos");
            if (!response.ok) throw new Error("Erro ao buscar projetos");
            const projetos = await response.json();

            // Limpa o select
            selectProjeto.innerHTML = "";

            projetos.forEach(projeto => {
                const option = document.createElement("option");
                option.value = projeto.id;
                option.textContent = projeto.nome;
                selectProjeto.appendChild(option);
            });
        } catch (error) {
            console.error("Erro ao carregar projetos:", error);
            Swal.fire('❌ Erro', 'Não foi possível carregar os projetos.', 'error');
        }
    }

    // Carrega projetos ao abrir a página
    carregarProjetos();

    // Controla exibição do select e desmarca outro checkbox
    criarProjetoCheckbox.addEventListener("change", () => {
        if (criarProjetoCheckbox.checked) {
            editarProjetoCheckbox.checked = false;
            selectProjetoDiv.style.display = "none";
        } else {
            selectProjetoDiv.style.display = "block";
        }
    });

    editarProjetoCheckbox.addEventListener("change", () => {
        if (editarProjetoCheckbox.checked) {
            criarProjetoCheckbox.checked = false;
            selectProjetoDiv.style.display = "block";
        } else if (!criarProjetoCheckbox.checked) {
            selectProjetoDiv.style.display = "none";
        }
    });

    // Ajuste inicial do select
    if (criarProjetoCheckbox.checked) {
        selectProjetoDiv.style.display = "none";
    } else {
        selectProjetoDiv.style.display = "block";
    }

    // Botão confirmar
    document.getElementById("confirmar").addEventListener("click", () => {
        if (criarProjetoCheckbox.checked) {
            window.location.href = "./criar_projeto.html";
        } else if (editarProjetoCheckbox.checked) {
            if (!selectProjeto.value) {
                Swal.fire('⚠️ Atenção', 'Selecione um projeto para editar.', 'warning');
                return;
            }
            window.location.href = `./editar_alocação.html?idProjeto=${selectProjeto.value}`;
        } else {
            Swal.fire('⚠️ Atenção', 'Selecione uma opção antes de confirmar.', 'warning');
        }
    });
});
