document.addEventListener("DOMContentLoaded", () => {
  const criarProjeto = document.getElementById("criarProjeto");
  const editarProjeto = document.getElementById("editarProjeto");
  const confirmarBtn = document.getElementById("confirmar");

  criarProjeto.addEventListener("change", () => {
    if (criarProjeto.checked) editarProjeto.checked = false;
  });

  editarProjeto.addEventListener("change", () => {
    if (editarProjeto.checked) criarProjeto.checked = false;
  });

  confirmarBtn.addEventListener("click", () => {
    if (!criarProjeto.checked && !editarProjeto.checked) {
      Swal.fire({
        icon: "warning",
        title: "Atenção",
        text: "Selecione uma opção antes de continuar.",
        confirmButtonText: "OK",
        confirmButtonColor: "#007BFF",
      });
      return;
    }

    if (criarProjeto.checked) {
      Swal.fire({
        icon: "info",
        title: "Redirecionando...",
        text: "Você será direcionado para a tela de criação de projeto.",
        showConfirmButton: false,
        timer: 1500,
      }).then(() => window.location.href = "./criar_projeto.html");
    } else if (editarProjeto.checked) {
      Swal.fire({
        icon: "info",
        title: "Redirecionando...",
        text: "Você será direcionado para a tela de edição de projeto.",
        showConfirmButton: false,
        timer: 1500,
      }).then(() => window.location.href = "./editar_alocação.html");
    }
  });
});
