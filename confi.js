const API_BASE_URL = 'https://psycare-api.onrender.com';
const TOKEN = localStorage.getItem('token');
const authMessage = document.getElementById('auth-message');

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    if (!TOKEN) {
        showAuthError('Debes iniciar sesión para acceder a esta página');
        disableForm();
        return;
    }

    initializeForm();
});

function showAuthError(message) {
    authMessage.textContent = message;
    authMessage.className = 'auth-message error';
}

function disableForm() {
    const form = document.getElementById('settings-form');
    const buttons = document.querySelectorAll('button');
    
    form.querySelectorAll('input').forEach(input => {
        input.disabled = true;
    });
    
    buttons.forEach(button => {
        button.disabled = true;
    });
}

function initializeForm() {
    const form = document.getElementById('settings-form');
    const getBtn = document.getElementById('get-settings');
    const deleteBtn = document.getElementById('delete-settings');
    const responseDiv = document.getElementById('response');

    // Cargar configuración al iniciar
    loadSettings();

    // Guardar o actualizar configuración
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            notification_preferences: {
                email: form.email.checked,
                sms: form.sms.checked
            },
            privacy_settings: {
                profile_visible: form.profile_visible.checked,
                share_activity: form.share_activity.checked
            }
        };

        try {
            const response = await fetch(`${API_BASE_URL}/user-settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${await response.text()}`);
            }

            const result = await response.json();
            responseDiv.textContent = 'Configuración guardada: ' + JSON.stringify(result, null, 2);
            showAuthMessage('Configuración actualizada correctamente', 'success');
        } catch (error) {
            console.error('Error:', error);
            responseDiv.textContent = 'Error: ' + error.message;
            showAuthError('Error al guardar la configuración');
        }
    });

    // Obtener configuración
    getBtn.addEventListener('click', loadSettings);

    // Eliminar configuración
    deleteBtn.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de eliminar tu configuración?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/user-settings`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${TOKEN}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: ${await response.text()}`);
                }

                const result = await response.json();
                responseDiv.textContent = 'Configuración eliminada: ' + JSON.stringify(result, null, 2);
                form.reset();
                showAuthMessage('Configuración eliminada correctamente', 'success');
            } catch (error) {
                console.error('Error:', error);
                responseDiv.textContent = 'Error: ' + error.message;
                showAuthError('Error al eliminar la configuración');
            }
        }
    });
}

async function loadSettings() {
    const form = document.getElementById('settings-form');
    const responseDiv = document.getElementById('response');

    try {
        const response = await fetch(`${API_BASE_URL}/user-settings`, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        
        if (data.notification_preferences) {
            form.email.checked = data.notification_preferences.email || false;
            form.sms.checked = data.notification_preferences.sms || false;
        }
        
        if (data.privacy_settings) {
            form.profile_visible.checked = data.privacy_settings.profile_visible || false;
            form.share_activity.checked = data.privacy_settings.share_activity || false;
        }
        
        responseDiv.textContent = 'Configuración actual: ' + JSON.stringify(data, null, 2);
    } catch (error) {
        console.error('Error:', error);
        responseDiv.textContent = 'Error: ' + error.message;
        
        if (error.message.includes('404')) {
            showAuthMessage('No tienes configuración guardada aún', 'success');
        } else {
            showAuthError('Error al cargar la configuración');
        }
    }
}

function showAuthMessage(message, type = 'success') {
    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
}