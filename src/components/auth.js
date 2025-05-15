document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const errorMessage = document.getElementById('error-message');
  const registerButton = document.getElementById('register-button');

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Obtener valores del formulario
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();

    // Validación básica
    if (!name || !email || !password) {
      showError('Todos los campos son obligatorios');
      return;
    }

    if (password.length < 6) {
      showError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!validateEmail(email)) {
      showError('Por favor ingresa un correo electrónico válido');
      return;
    }

    // Deshabilitar botón durante la petición
    registerButton.disabled = true;
    registerButton.textContent = 'Registrando...';

    try {
      const response = await fetch('https://psycare-api.onrender.com/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Mostrar mensaje de error específico del servidor si está disponible
        const errorMsg = data.message || 
                        data.error || 
                        `Error ${response.status}: ${response.statusText}`;
        throw new Error(errorMsg);
      }

      // Registro exitoso
      if (data.token && (data.user || data.users)) {
        // Guardar token y datos del usuario
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user || data.users));
        
        // Redirigir al dashboard
        window.location.href = 'dashboard.html';
      } else {
        throw new Error('Respuesta inesperada del servidor');
      }

    } catch (error) {
      console.error('Error en el registro:', error);
      
      // Mensajes de error más amigables
      if (error.message.includes('email') || error.message.includes('correo')) {
        showError('El correo electrónico ya está registrado');
      } else if (error.message.includes('password') || error.message.includes('contraseña')) {
        showError('La contraseña no cumple con los requisitos');
      } else {
        showError(`Error al registrar: ${error.message}`);
      }
    } finally {
      // Restaurar botón
      registerButton.disabled = false;
      registerButton.textContent = 'Registrarse';
    }
  });

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
});