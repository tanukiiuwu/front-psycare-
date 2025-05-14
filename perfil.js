const API_BASE_URL = 'https://psycare-api.onrender.com';
const TOKEN = localStorage.getItem('token');
const authMessage = document.getElementById('auth-message');
const userForm = document.getElementById('user-form');
const responseDiv = document.getElementById('response');

// 1. Inicialización con manejo de errores robusto
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar si hay token
    if (!TOKEN || TOKEN === 'undefined') {
        showMessage(authMessage, 'Debes iniciar sesión primero', 'error');
        disableForm();
        redirectToLogin();
        return;
    }

    try {
        // Intento de carga inicial
        showMessage(responseDiv, 'Cargando información del perfil...', 'loading');
        
        const profileData = await loadUserProfile();
        populateForm(profileData);
        setupFormEvents();
        
        showMessage(authMessage, 'Sesión iniciada correctamente', 'success');
    } catch (error) {
        handleInitialError(error);
    }
});

// 2. Función principal para cargar perfil
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        // Manejo especial para errores 500
        if (response.status === 500) {
            const errorData = await tryParseResponse(response);
            throw new Error(errorData.message || 'El servidor encontró un error interno');
        }

        // Manejo de otros errores HTTP
        if (!response.ok) {
            const errorData = await tryParseResponse(response);
            throw new Error(errorData.message || `Error HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error al cargar perfil:', error);
        throw error;
    }
}

// 3. Configuración de eventos del formulario
function setupFormEvents() {
    // Actualizar perfil
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            showMessage(responseDiv, 'Guardando cambios...', 'loading');
            const formData = getFormData();
            await updateProfile(formData);
            showMessage(responseDiv, 'Perfil actualizado correctamente', 'success');
        } catch (error) {
            handleProfileError(error);
        }
    });

    // Botón para recargar datos
    document.getElementById('get-user').addEventListener('click', async () => {
        try {
            await loadUserProfile();
            showMessage(responseDiv, 'Datos actualizados', 'success');
        } catch (error) {
            handleProfileError(error);
        }
    });

    // Botón para eliminar cuenta
    document.getElementById('delete-user').addEventListener('click', async () => {
        if (confirm('¿Estás seguro de eliminar tu cuenta permanentemente?')) {
            try {
                showMessage(responseDiv, 'Eliminando cuenta...', 'loading');
                await deleteAccount();
                showMessage(responseDiv, 'Cuenta eliminada correctamente', 'success');
                redirectToLogin();
            } catch (error) {
                handleProfileError(error);
            }
        }
    });
}

// 4. Funciones para operaciones CRUD
async function updateProfile(profileData) {
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData)
    });
    return handleApiResponse(response);
}

async function deleteAccount() {
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return handleApiResponse(response);
}

// 5. Funciones de apoyo mejoradas
async function handleApiResponse(response) {
    if (response.status === 500) {
        const errorData = await tryParseResponse(response);
        throw new Error(errorData.message || 'Error interno del servidor');
    }

    if (!response.ok) {
        const errorData = await tryParseResponse(response);
        throw new Error(errorData.message || `Error HTTP ${response.status}`);
    }

    return await response.json();
}

async function tryParseResponse(response) {
    try {
        return await response.json();
    } catch {
        return { message: response.statusText };
    }
}

function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
    };
}

function getFormData() {
    return {
        name: userForm.name.value.trim(),
        email: userForm.email.value.trim(),
        bio: userForm.bio.value.trim(),
        pronouns: userForm.pronouns.value.trim(),
        age: userForm.age.value ? parseInt(userForm.age.value) : null
    };
}

function populateForm(data) {
    if (!data) return;
    
    userForm.name.value = data.name || '';
    userForm.email.value = data.email || '';
    userForm.bio.value = data.bio || '';
    userForm.pronouns.value = data.pronouns || '';
    userForm.age.value = data.age || '';
}

// 6. Manejo de errores mejorado
function handleInitialError(error) {
    console.error('Error inicial:', error);
    
    let message = 'Error al cargar el perfil';
    if (error.message.includes('401') || error.message.includes('403')) {
        message = 'Sesión expirada o no autorizada';
        redirectToLogin();
    } else if (error.message.includes('500')) {
        message = 'Error del servidor. Intenta más tarde';
    } else if (error.message.includes('NetworkError')) {
        message = 'Problema de conexión. Verifica tu internet';
    }

    showMessage(responseDiv, `${message}: ${error.message || 'Sin detalles'}`, 'error');
    showMessage(authMessage, message, 'error');
}

function handleProfileError(error) {
    console.error('Error en perfil:', error);
    showMessage(responseDiv, `Error: ${error.message || 'Error desconocido'}`, 'error');
}

// 7. Funciones de utilidad
function showMessage(element, message, type = 'info') {
    if (!element) return;
    
    element.textContent = message;
    element.className = `response ${type}`;
}

function disableForm() {
    if (!userForm) return;
    
    const inputs = userForm.querySelectorAll('input, textarea, button, select');
    inputs.forEach(input => {
        input.disabled = true;
    });
}

function redirectToLogin() {
    localStorage.removeItem('token');
    setTimeout(() => {
        window.location.href = '/login.html';
    }, 2000);
}