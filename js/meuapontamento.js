const container = document.getElementById('timeline');

const items = new vis.DataSet([
  { id: 1, content: 'Projeto Alpha', start: '2025-10-01', end: '2025-10-10', className: 'project-1' },
  { id: 2, content: 'Projeto Beta', start: '2025-10-05', end: '2025-10-18', className: 'project-2' },
  { id: 3, content: 'Projeto Gama', start: '2025-10-17', end: '2025-10-28', className: 'project-3' },
  { id: 4, content: 'Projeto Delta', start: '2025-10-09', end: '2025-10-11', className: 'project-1' }
]);

const options = {
  stack: true,
  start: '2025-09-25',
  end: '2025-11-05',
  orientation: 'top',
  height: '100%', // <- faz o calendário usar toda a altura
  margin: { item: 20, axis: 40 },
};

const timeline = new vis.Timeline(container, items, options);

// Ajusta o tamanho dinamicamente
window.addEventListener('resize', () => timeline.fit());
