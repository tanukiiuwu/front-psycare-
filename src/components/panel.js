// Variables globales
const API_BASE_URL = 'https://psycare-api.onrender.com';
let usuarioActual = null;

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Verificar autenticación
  if (!localStorage.getItem('token')) {
    mostrarNotificacion('Por favor inicia sesión', 'error');
    setTimeout(() => window.location.href = 'login.html', 1500);
    return;
  }

  // Inicializar aplicación
  inicializarAplicacion();
});

// Inicialización de la aplicación
async function inicializarAplicacion() {
  try {
    // Mostrar skeleton loaders
    document.querySelectorAll('.skeleton-loader').forEach(loader => {
      loader.style.display = 'block';
    });

    // Cargar datos del usuario
    await cargarUsuario();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Cargar sección por defecto
    cargarSeccion('foro');
  } catch (error) {
    console.error('Error al inicializar:', error);
    mostrarNotificacion('Error al cargar la aplicación', 'error');
  }
}

// Configurar event listeners
function setupEventListeners() {
  // Menú de navegación
  document.querySelectorAll('.menu-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      cargarSeccion(this.dataset.section);
    });
  });

  // Foro
  document.getElementById('nueva-entrada-btn').addEventListener('click', mostrarFormEntrada);
  document.getElementById('cancelar-entrada').addEventListener('click', ocultarFormEntrada);
  document.getElementById('publicar-entrada').addEventListener('click', publicarEntrada);
  document.getElementById('filtro-foro').addEventListener('change', filtrarEntradas);
}

// Cargar datos del usuario
async function cargarUsuario() {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No hay token de autenticación');

    // Verificar si ya tenemos datos del usuario en localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      usuarioActual = JSON.parse(userData);
      actualizarSaludo();
      return;
    }

    // Obtener datos del usuario desde la API
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Si hay error 401 (no autorizado), cerrar sesión
      if (response.status === 401) {
        logout();
        return;
      }
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Normalizar respuesta (manejar inconsistencia user/users)
    usuarioActual = data.user || data.users || data;
    
    if (!usuarioActual || !usuarioActual.user_id) {
      throw new Error('Datos de usuario inválidos');
    }

    localStorage.setItem('user', JSON.stringify(usuarioActual));
    actualizarSaludo();
  } catch (error) {
    console.error('Error al cargar usuario:', error);
    mostrarNotificacion('Error al cargar datos del usuario', 'error');
    throw error;
  }
}

// Actualizar saludo en el header
function actualizarSaludo() {
  if (usuarioActual && usuarioActual.name) {
    const saludoElement = document.getElementById('saludo');
    const hora = new Date().getHours();
    let saludo = '';
    
    if (hora < 12) saludo = 'Buenos días';
    else if (hora < 19) saludo = 'Buenas tardes';
    else saludo = 'Buenas noches';
    
    saludoElement.innerHTML = `<i class="far fa-smile"></i> ${saludo}, <strong>${usuarioActual.name}</strong>`;
  }
}

// Cargar sección seleccionada
async function cargarSeccion(seccion) {
  try {
    // Ocultar todas las secciones
    document.querySelectorAll('.seccion').forEach(sec => {
      sec.classList.remove('active');
    });

    // Mostrar skeleton loader
    const seccionElement = document.getElementById(seccion);
    const loader = seccionElement.querySelector('.skeleton-loader');
    if (loader) loader.style.display = 'block';

    // Mostrar sección seleccionada
    seccionElement.classList.add('active');

    // Cargar datos según la sección
    switch(seccion) {
      case 'foro':
        await cargarEntradasForo();
        break;
      case 'registros':
        await cargarRegistros();
        break;
      case 'test':
        // No necesita carga inicial
        break;
      case 'alertas':
        await cargarAlertas();
        break;
        case 'test':
  await cargarHistorialTests(); // Nueva función
  break;
    }

    // Ocultar loader
    if (loader) loader.style.display = 'none';
  } catch (error) {
    console.error(`Error al cargar sección ${seccion}:`, error);
    mostrarNotificacion(`Error al cargar ${seccion}`, 'error');
  }
}

// FORO: Mostrar formulario de nueva entrada
function mostrarFormEntrada() {
  document.getElementById('form-entrada').style.display = 'block';
  document.getElementById('nueva-entrada-btn').style.display = 'none';
  document.getElementById('entrada-titulo').focus();
}

// FORO: Ocultar formulario de nueva entrada
function ocultarFormEntrada() {
  document.getElementById('form-entrada').style.display = 'none';
  document.getElementById('nueva-entrada-btn').style.display = 'flex';
  document.getElementById('entrada-titulo').value = '';
  document.getElementById('entrada-contenido').value = '';
}

// FORO: Publicar nueva entrada
async function publicarEntrada() {
  const titulo = document.getElementById('entrada-titulo').value.trim();
  const contenido = document.getElementById('entrada-contenido').value.trim();

  if (!titulo || !contenido) {
    mostrarNotificacion('Por favor completa todos los campos', 'warning');
    return;
  }

  try {
    const btnPublicar = document.getElementById('publicar-entrada');
    btnPublicar.disabled = true;
    btnPublicar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publicando...';

    const response = await fetch(`${API_BASE_URL}/forum_entries`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: titulo,
        content: contenido,
        user_id: usuarioActual.user_id
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al publicar entrada');
    }

    ocultarFormEntrada();
    await cargarEntradasForo();
    mostrarNotificacion('Entrada publicada con éxito', 'success');
  } catch (error) {
    console.error('Error al publicar entrada:', error);
    mostrarNotificacion(error.message || 'Error al publicar la entrada', 'error');
  } finally {
    const btnPublicar = document.getElementById('publicar-entrada');
    btnPublicar.disabled = false;
    btnPublicar.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar';
  }
}

// FORO: Cargar entradas del foro
async function cargarEntradasForo() {
  try {
    const response = await fetch(`${API_BASE_URL}/forum_entries`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const entradas = await response.json();
    mostrarEntradasForo(entradas);
  } catch (error) {
    console.error('Error al cargar entradas:', error);
    document.getElementById('lista-entradas').innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar las entradas. Intenta recargar la página.</p>
      </div>
    `;
    throw error;
  }
}

// FORO: Mostrar entradas en el DOM
function mostrarEntradasForo(entradas) {
  const listaEntradas = document.getElementById('lista-entradas');
  
  if (!entradas || entradas.length === 0) {
    listaEntradas.innerHTML = `
      <div class="sin-contenido">
        <i class="far fa-comment-dots"></i>
        <p>No hay entradas en el foro. ¡Sé el primero en publicar!</p>
      </div>
    `;
    return;
  }

  listaEntradas.innerHTML = entradas.map(entrada => `
    <div class="entrada" data-id="${entrada.entry_id}">
      <h3>${entrada.title}</h3>
      <p>${entrada.content}</p>
      <small><i class="far fa-user"></i> ${entrada.user_name || 'Anónimo'} • <i class="far fa-clock"></i> ${formatearFecha(entrada.created_at)}</small>
      
      ${entrada.user_id === usuarioActual.user_id ? `
        <div class="entrada-acciones">
          <button class="btn-editar" onclick="editarEntrada(${entrada.entry_id})"><i class="fas fa-edit"></i> Editar</button>
          <button class="btn-eliminar" onclick="eliminarEntrada(${entrada.entry_id})"><i class="fas fa-trash"></i> Eliminar</button>
        </div>
      ` : ''}
      
      <div class="comentarios" id="comentarios-${entrada.entry_id}">
        <!-- Comentarios se cargarán aquí -->
      </div>
      
      <div class="comentario-form">
        <textarea placeholder="Escribe un comentario..." id="comentario-${entrada.entry_id}"></textarea>
        <button onclick="publicarComentario(${entrada.entry_id})"><i class="fas fa-comment"></i> Enviar comentario</button>
      </div>
    </div>
  `).join('');

  // Cargar comentarios para cada entrada
  entradas.forEach(entrada => {
    cargarComentarios(entrada.entry_id);
  });
}

// FORO: Filtrar entradas
function filtrarEntradas() {
  const filtro = document.getElementById('filtro-foro').value;
  // Implementar lógica de filtrado según necesidad
  cargarEntradasForo(); // Por ahora recargamos todo
}

// FORO: Editar entrada
async function editarEntrada(entryId) {
  try {
    // Obtener datos de la entrada
    const response = await fetch(`${API_BASE_URL}/forum_entries/${entryId}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const entrada = await response.json();
    
    // Mostrar formulario de edición
    const entradaElement = document.querySelector(`.entrada[data-id="${entryId}"]`);
    entradaElement.innerHTML = `
      <div class="form-entrada">
        <h3><i class="fas fa-edit"></i> Editar entrada</h3>
        <input type="text" id="editar-titulo-${entryId}" value="${entrada.title}" placeholder="Título" required>
        <textarea id="editar-contenido-${entryId}" placeholder="Contenido" required>${entrada.content}</textarea>
        <div class="form-botones">
          <button class="btn-secundario" onclick="cancelarEdicion(${entryId})"><i class="fas fa-times"></i> Cancelar</button>
          <button class="btn-primario" onclick="guardarEdicion(${entryId})"><i class="fas fa-save"></i> Guardar cambios</button>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error al editar entrada:', error);
    mostrarNotificacion('Error al cargar la entrada para edición', 'error');
  }
}

// FORO: Cancelar edición de entrada
function cancelarEdicion(entryId) {
  cargarEntradasForo();
}

// FORO: Guardar cambios en la entrada
async function guardarEdicion(entryId) {
  const titulo = document.getElementById(`editar-titulo-${entryId}`).value.trim();
  const contenido = document.getElementById(`editar-contenido-${entryId}`).value.trim();

  if (!titulo || !contenido) {
    mostrarNotificacion('Por favor completa todos los campos', 'warning');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/forum_entries/${entryId}`, {
      method: 'PUT',
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: titulo,
        content: contenido
      })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    await cargarEntradasForo();
    mostrarNotificacion('Entrada actualizada con éxito', 'success');
  } catch (error) {
    console.error('Error al guardar cambios:', error);
    mostrarNotificacion('Error al actualizar la entrada', 'error');
  }
}

// FORO: Eliminar entrada
async function eliminarEntrada(entryId) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta entrada?\nEsta acción no se puede deshacer.')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/forum_entries/${entryId}`, {
      method: 'DELETE',
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    await cargarEntradasForo();
    mostrarNotificacion('Entrada eliminada con éxito', 'success');
  } catch (error) {
    console.error('Error al eliminar entrada:', error);
    mostrarNotificacion('Error al eliminar la entrada', 'error');
  }
}

// FORO: Cargar comentarios de una entrada
async function cargarComentarios(entryId) {
  try {
    const response = await fetch(`${API_BASE_URL}/forum_entry_comments?entry_id=${entryId}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const comentarios = await response.json();
    mostrarComentarios(entryId, comentarios);
  } catch (error) {
    console.error('Error al cargar comentarios:', error);
    document.getElementById(`comentarios-${entryId}`).innerHTML = `
      <p class="error-message"><i class="fas fa-exclamation-triangle"></i> Error al cargar comentarios</p>
    `;
  }
}

// FORO: Mostrar comentarios en el DOM
function mostrarComentarios(entryId, comentarios) {
  const contenedor = document.getElementById(`comentarios-${entryId}`);
  
  if (!comentarios || comentarios.length === 0) {
    contenedor.innerHTML = `
      <p class="sin-comentarios"><i class="far fa-comment"></i> No hay comentarios aún</p>
    `;
    return;
  }

  contenedor.innerHTML = comentarios.map(comentario => `
    <div class="comentario" data-id="${comentario.comment_id}">
      <p>${comentario.content}</p>
      <small><i class="far fa-user"></i> ${comentario.user_name || 'Anónimo'} • <i class="far fa-clock"></i> ${formatearFecha(comentario.created_at)}</small>
      ${comentario.user_id === usuarioActual.user_id ? `
        <div class="comentario-acciones">
          <button class="btn-eliminar" onclick="eliminarComentario(${comentario.comment_id}, ${entryId})"><i class="fas fa-trash"></i></button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

// FORO: Publicar comentario
async function publicarComentario(entryId) {
  const contenido = document.getElementById(`comentario-${entryId}`).value.trim();

  if (!contenido) {
    mostrarNotificacion('Por favor escribe un comentario', 'warning');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/forum_entry_comments`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        entry_id: entryId,
        content: contenido,
        user_id: usuarioActual.user_id
      })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    document.getElementById(`comentario-${entryId}`).value = '';
    await cargarComentarios(entryId);
    mostrarNotificacion('Comentario publicado con éxito', 'success');
  } catch (error) {
    console.error('Error al publicar comentario:', error);
    mostrarNotificacion('Error al publicar el comentario', 'error');
  }
}

// FORO: Eliminar comentario
async function eliminarComentario(commentId, entryId) {
  if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/forum_entry_comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    await cargarComentarios(entryId);
    mostrarNotificacion('Comentario eliminado con éxito', 'success');
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    mostrarNotificacion('Error al eliminar el comentario', 'error');
  }
}

// REGISTROS: Cargar registros emocionales
async function cargarRegistros() {
  try {
    const response = await fetch(`${API_BASE_URL}/records`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const registros = await response.json();
    mostrarRegistros(registros);
  } catch (error) {
    console.error('Error al cargar registros:', error);
    document.getElementById('lista-registros').innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar los registros. Intenta recargar la página.</p>
      </div>
    `;
  }
}

// REGISTROS: Mostrar registros en el DOM
function mostrarRegistros(registros) {
  const listaRegistros = document.getElementById('lista-registros');
  
  if (!registros || registros.length === 0) {
    listaRegistros.innerHTML = `
      <div class="sin-contenido">
        <i class="far fa-calendar-plus"></i>
        <p>No tienes registros emocionales aún.</p>
        <button class="btn-primario" onclick="nuevoRegistro()"><i class="fas fa-plus"></i> Crear primer registro</button>
      </div>
    `;
    return;
  }

  listaRegistros.innerHTML = registros.map(registro => `
    <div class="registro" data-id="${registro.record_id}">
      <div class="registro-header">
        <h3><i class="fas fa-heartbeat"></i> ${registro.emotion} (Intensidad: ${registro.intensity}/10)</h3>
        <small><i class="far fa-calendar"></i> ${formatearFecha(registro.date)}</small>
      </div>
      <p>${registro.description}</p>
      <div class="registro-acciones">
        <button class="btn-editar" onclick="editarRegistro(${registro.record_id})"><i class="fas fa-edit"></i> Editar</button>
        <button class="btn-eliminar" onclick="eliminarRegistro(${registro.record_id})"><i class="fas fa-trash"></i> Eliminar</button>
      </div>
    </div>
  `).join('');
}

// REGISTROS: Nuevo registro
function nuevoRegistro() {
  window.location.href = 'nuevo_registro.html';
}

// REGISTROS: Editar registro
function editarRegistro(recordId) {
  window.location.href = `editar_registro.html?id=${recordId}`;
}

// REGISTROS: Eliminar registro
async function eliminarRegistro(recordId) {
  if (!confirm('¿Estás seguro de que quieres eliminar este registro?\nEsta acción no se puede deshacer.')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/records/${recordId}`, {
      method: 'DELETE',
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    await cargarRegistros();
    mostrarNotificacion('Registro eliminado con éxito', 'success');
  } catch (error) {
    console.error('Error al eliminar registro:', error);
    mostrarNotificacion('Error al eliminar el registro', 'error');
  }
}

// TEST: Iniciar test psicológico
function iniciarTest(tipoTest) {
  window.location.href = `test.html?tipo=${tipoTest}`;
}

// ALERTAS: Cargar alertas
async function cargarAlertas() {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const alertas = await response.json();
    mostrarAlertas(alertas);
  } catch (error) {
    console.error('Error al cargar alertas:', error);
    document.getElementById('lista-alertas').innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar las alertas. Intenta recargar la página.</p>
      </div>
    `;
  }
  
}

// ALERTAS: Mostrar alertas en el DOM
function mostrarAlertas(alertas) {
  const listaAlertas = document.getElementById('lista-alertas');
  
  if (!alertas || alertas.length === 0) {
    listaAlertas.innerHTML = `
      <div class="sin-contenido">
        <i class="far fa-bell-slash"></i>
        <p>No tienes alertas activas.</p>
        <button class="btn-primario" onclick="nuevaAlerta()"><i class="fas fa-plus"></i> Crear nueva alerta</button>
      </div>
    `;
    return;
  }

  listaAlertas.innerHTML = alertas.map(alerta => `
    <div class="alerta ${alerta.status.toLowerCase()}" data-id="${alerta.alert_id}">
      <div class="alerta-header">
        <h3><i class="fas fa-bell"></i> ${alerta.type}</h3>
        <small><i class="far fa-calendar"></i> ${formatearFecha(alerta.created_at)}</small>
      </div>
      <p>${alerta.description}</p>
      <div class="alerta-footer">
        <span class="alerta-estado"><i class="fas fa-circle"></i> ${alerta.status}</span>
        ${alerta.status === 'Pendiente' ? `
          <button class="btn-secundario" onclick="marcarAlertaResuelta(${alerta.alert_id})">
            <i class="fas fa-check"></i> Marcar como resuelta
          </button>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// ALERTAS: Nueva alerta
function nuevaAlerta() {
  window.location.href = 'nueva_alerta.html';
}

// ALERTAS: Marcar alerta como resuelta
async function marcarAlertaResuelta(alertId) {
  if (!confirm('¿Estás seguro de que quieres marcar esta alerta como resuelta?')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/alerts/${alertId}`, {
      method: 'PUT',
      headers: {
        "Authorization": `Bearer ${localStorage.getItem('token')}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "Resuelta"
      })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    await cargarAlertas();
    mostrarNotificacion('Alerta marcada como resuelta', 'success');
  } catch (error) {
    console.error('Error al actualizar alerta:', error);
    mostrarNotificacion('Error al actualizar la alerta', 'error');
  }
}

// Menú de configuración
function toggleMenu() {
  const submenu = document.getElementById("submenu");
  submenu.style.display = submenu.style.display === "block" ? "none" : "block";
}

// Cerrar sesión
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// Formatear fecha
function formatearFecha(fechaString) {
  const fecha = new Date(fechaString);
  return fecha.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
  const notification = document.getElementById('notification');
  notification.innerHTML = `<i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${mensaje}`;
  notification.className = `notification ${tipo} show`;
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 5000);
}

// Cerrar notificación al hacer clic
document.getElementById('notification')?.addEventListener('click', function() {
  this.classList.remove('show');
});
// TEST: Iniciar test psicológico - VERSIÓN MODIFICADA
function iniciarTest(tipoTest) {
  // Redirigir a la nueva página de test
  window.location.href = `test.html?type=${tipoTest}`;
}
// REGISTROS: Cargar registros (modificar para usar localStorage primero)
async function cargarRegistros() {
  try {
    // Usar localStorage temporalmente (luego cambiar a API)
    const registros = JSON.parse(localStorage.getItem('registros')) || [];
    mostrarRegistros(registros);
  } catch (error) {
    console.error('Error al cargar registros:', error);
    document.getElementById('lista-registros').innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar registros. Intenta recargar.</p>
      </div>
    `;
  }
}

// REGISTROS: Mostrar registros en el DOM (ajustar para localStorage)
function mostrarRegistros(registros) {
  const listaRegistros = document.getElementById('lista-registros');
  
  if (!registros || registros.length === 0) {
    listaRegistros.innerHTML = `
      <div class="sin-contenido">
        <i class="far fa-calendar-plus"></i>
        <p>No hay registros emocionales aún.</p>
        <button class="btn-primario" onclick="window.location.href='registro.html'">
          <i class="fas fa-plus"></i> Crear primer registro
        </button>
      </div>
    `;
    return;
  }

  listaRegistros.innerHTML = registros.map(registro => `
    <div class="registro" data-id="${registro.id}">
      <div class="registro-header">
        <h3><i class="fas fa-heartbeat"></i> ${registro.emocion} (Intensidad: ${registro.intensidad}/10)</h3>
        <small><i class="far fa-calendar"></i> ${new Date(registro.fecha).toLocaleDateString('es-ES')}</small>
      </div>
      <p>${registro.descripcion}</p>
      <div class="registro-acciones">
        <button class="btn-editar" onclick="editarRegistro('${registro.id}')">
          <i class="fas fa-edit"></i> Editar
        </button>
        <button class="btn-eliminar" onclick="eliminarRegistro('${registro.id}')">
          <i class="fas fa-trash"></i> Eliminar
        </button>
      </div>
    </div>
  `).join('');
}

// REGISTROS: Eliminar registro (localStorage temporal)
async function eliminarRegistro(id) {
  if (!confirm('¿Eliminar este registro?')) return;
  
  let registros = JSON.parse(localStorage.getItem('registros')) || [];
  registros = registros.filter(r => r.id !== id);
  localStorage.setItem('registros', JSON.stringify(registros));
  cargarRegistros(); // Recargar lista
}