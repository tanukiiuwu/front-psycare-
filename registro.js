document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registro-form');
  const urlParams = new URLSearchParams(window.location.search);
  const registroId = urlParams.get('id'); // Para edición

  // Cargar datos si es edición
  if (registroId) {
    cargarRegistroParaEditar(registroId);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    guardarRegistro();
  });
});

function cargarRegistroParaEditar(id) {
  const registros = JSON.parse(localStorage.getItem('registros')) || [];
  const registro = registros.find(r => r.id === id);

  if (registro) {
    document.getElementById('emocion').value = registro.emocion;
    document.getElementById('intensidad').value = registro.intensidad;
    document.getElementById('descripcion').value = registro.descripcion;
    document.querySelector('h2').innerHTML = '<i class="fas fa-edit"></i> Editar Registro';
  }
}

function guardarRegistro() {
  const registro = {
    id: new URLSearchParams(window.location.search).get('id') || Date.now().toString(),
    emocion: document.getElementById('emocion').value,
    intensidad: parseInt(document.getElementById('intensidad').value),
    descripcion: document.getElementById('descripcion').value,
    fecha: new Date().toISOString()
  };

  // Guardar en localStorage (luego reemplazar por API)
  let registros = JSON.parse(localStorage.getItem('registros')) || [];
  const index = registros.findIndex(r => r.id === registro.id);

  if (index >= 0) {
    registros[index] = registro; // Actualizar
  } else {
    registros.push(registro); // Nuevo
  }

  localStorage.setItem('registros', JSON.stringify(registros));
  window.location.href = 'dashboard.html';
}