// Funciones de utilidad comunes
document.addEventListener('DOMContentLoaded', function () {
    // Menú móvil
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function () {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }

    // Mostrar año actual en el footer
    const year = new Date().getFullYear();
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = year;
    }
});

// Funciones para localStorage
function getFromStorage(key) {
    const data = localStorage.getItem(`taller_${key}`);
    return data ? JSON.parse(data) : [];
}

function saveToStorage(key, data) {
    localStorage.setItem(`taller_${key}`, JSON.stringify(data));
}

// Formateadores
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

function formatCurrency(amount) {
    if (isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(amount);
}

// Mostrar notificaciones con respectiva accion 
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification-dialog';
    notification.style.fontFamily = 'Times New Roman, serif';
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '5px';
    notification.style.color = '#fff';

    if (type === 'error') {
        notification.style.backgroundColor = '#2196F3';
    } else {
        if (message.includes('actualizada') || message.includes('actualizado')) {
            notification.style.backgroundColor = '#FF9800';
        } else if (message.includes('eliminada') || message.includes('eliminado')) {
            notification.style.backgroundColor = '#f44336';
        } else {
            notification.style.backgroundColor = '#4CAF50';
        }

        if (!message.startsWith('Éxito:')) {
            message = `Éxito: ${message}`;
        }
    }
    notification.textContent = message;
    document.body.appendChild(notification);

    // Animación de desvanecimiento
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Manejo del cierre de sesión
document.addEventListener('DOMContentLoaded', function () {
    const logoutBtn = document.getElementById('logout-btn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();

            // Eliminar datos de sesión
            localStorage.removeItem('taller_user');
            sessionStorage.removeItem('taller_user');

            // Redirigir a login
            window.location.href = 'login.html';
        });
    }

    // Verificar autenticación al cargar el dashboard
    if (!localStorage.getItem('taller_user') && !sessionStorage.getItem('taller_user')) {
        window.location.href = 'login.html';
    }
});

// Función para mostrar diálogo de confirmación personalizado
function showConfirmDialog(message, callback, ...callbackArgs) {
    const modal = document.getElementById('confirm-modal');
    const messageElement = document.getElementById('confirm-message');


    messageElement.textContent = message;
    modal.style.display = 'flex';

    const okBtn = document.getElementById('confirm-ok');
    const cancelBtn = document.getElementById('confirm-cancel');

    const cleanUp = () => {
        okBtn.onclick = null;
        cancelBtn.onclick = null;
    };

    okBtn.onclick = () => {
        cleanUp();
        modal.style.display = 'none';
        callback(...callbackArgs); // Pasar los argumentos al callback
    };

    cancelBtn.onclick = () => {
        cleanUp();
        modal.style.display = 'none';
    };

    modal.querySelector('.close-modal').onclick = cancelBtn.onclick;
    ;
}
