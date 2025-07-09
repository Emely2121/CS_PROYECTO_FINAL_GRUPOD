// Clases de excepciones personalizadas
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = "AuthenticationError";
    }
}

class UserNotFoundError extends AuthenticationError {
    constructor() {
        super("Usuario no encontrado");
        this.name = "UserNotFoundError";
    }
}

class WrongPasswordError extends AuthenticationError {
    constructor(attemptsLeft) {
        super(`Contraseña incorrecta. Intentos restantes: ${attemptsLeft}`);
        this.name = "WrongPasswordError";
        this.attemptsLeft = attemptsLeft;
    }
}

class AccountLockedError extends AuthenticationError {
    constructor() {
        super("Cuenta bloqueada por 3 intentos fallidos. Contacte al administrador.");
        this.name = "AccountLockedError";
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');

    // Simulación de base de datos de usuarios
    const users = [
        {
            id: 1,
            email: "admin@taller.com",
            password: "admin123",
            name: "Administrador",
            loginAttempts: 0,
            locked: false,
            lastAttempt: null
        }
    ];

    // Manejar el envío del formulario de login
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember').checked;

        try {
            // Validar campos
            if (!email || !password) {
                throw new AuthenticationError("Por favor complete todos los campos");
            }

            // Buscar usuario
            const user = users.find(u => u.email === email);

            // Verificar si el usuario existe
            if (!user) {
                throw new UserNotFoundError();
            }

            // Verificar si la cuenta está bloqueada
            if (user.locked) {
                // Mostrar tiempo restante si está bloqueado temporalmente
                const now = new Date();
                const lastAttempt = new Date(user.lastAttempt);
                const lockTime = 30 * 60 * 1000; // 30 minutos en milisegundos

                if (now - lastAttempt < lockTime) {
                    const minutesLeft = Math.ceil((lockTime - (now - lastAttempt)) / (60 * 1000));
                    throw new AccountLockedError(`Cuenta bloqueada temporalmente. Intente nuevamente en ${minutesLeft} minutos.`);
                } else {
                    // Desbloquear después del tiempo de espera
                    user.locked = false;
                    user.loginAttempts = 0;
                }
            }

            // Verificar contraseña
            if (user.password !== password) {
                // Incrementar intentos fallidos
                user.loginAttempts++;
                user.lastAttempt = new Date();

                // Bloquear cuenta después de 3 intentos fallidos
                if (user.loginAttempts >= 3) {
                    user.locked = true;
                    throw new AccountLockedError();
                } else {
                    const attemptsLeft = 3 - user.loginAttempts;
                    throw new WrongPasswordError(attemptsLeft);
                }
            }

            // Si todo es correcto, restablecer intentos fallidos
            user.loginAttempts = 0;
            user.locked = false;

            // Guardar en localStorage si se seleccionó "Recordar sesión"
            if (rememberMe) {
                localStorage.setItem('taller_user', JSON.stringify({
                    email: user.email,
                    name: user.name
                }));
            } else {
                sessionStorage.setItem('taller_user', JSON.stringify({
                    email: user.email,
                    name: user.name
                }));
            }

            // Redirigir al dashboard
            window.location.href = 'index.html';

        } catch (error) {
            // Mostrar mensaje de error específico con estilo diferente para bloqueo
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';

            if (error instanceof AccountLockedError) {
                errorMessage.style.backgroundColor = 'rgba(231, 76, 60, 0.2)';
                errorMessage.style.borderLeft = '4px solid var(--accent-color)';
            } else if (error instanceof WrongPasswordError) {
                errorMessage.style.backgroundColor = 'rgba(241, 196, 15, 0.2)';
                errorMessage.style.borderLeft = '4px solid #f1c40f';
            } else {
                errorMessage.style.backgroundColor = 'rgba(52, 152, 219, 0.2)';
                errorMessage.style.borderLeft = '4px solid var(--secondary-color)';
            }

            // Ocultar mensaje después de 5 segundos
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);

            // Registrar el error en la consola
            console.error(`Error de autenticación: ${error.name} - ${error.message}`);
        }
    });

    // Si ya hay una sesión activa, redirigir al dashboard
    if (localStorage.getItem('taller_user') || sessionStorage.getItem('taller_user')) {
        window.location.href = 'index.html';
    }
});