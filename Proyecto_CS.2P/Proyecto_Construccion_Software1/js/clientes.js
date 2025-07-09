document.addEventListener('DOMContentLoaded', function () {
    // Referencias a elementos del DOM
    const tableBody = document.querySelector('#clients-table tbody');
    const addClientBtn = document.getElementById('add-client');
    const clientModal = document.getElementById('client-modal');
    const clientForm = document.getElementById('client-form');
    const modalTitle = document.getElementById('modal-title');
    const searchName = document.getElementById('search-name');
    const searchCedula = document.getElementById('search-cedula');

    // Validación en tiempo real para el campo de nombre (solo letras)
    document.getElementById('client-name').addEventListener('keydown', function (e) {
        const key = e.key;
        // Permitir: letras, espacios, teclas de control (backspace, delete, tab, etc.)
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(key) &&
            !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) {
            e.preventDefault();
        }
    });

    // Validación en tiempo real para cédula y teléfono (solo números)
    ['client-cedula', 'client-phone'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', function (e) {
            const key = e.key;
            // Permitir solo números y teclas de control
            if (!/^[0-9]$/.test(key) &&
                !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) {
                e.preventDefault();
            }
        });
    });

    // Validación en tiempo real para cédula y teléfono para 10 dígitos
    ['client-cedula', 'client-phone'].forEach(id => {
        const input = document.getElementById(id);

        input.addEventListener('input', function () {
            // Limitar a 10 caracteres
            if (this.value.length > 10) {
                this.value = this.value.slice(0, 10);
            }

            // Auto-completar con 09 si está vacío o borrado completamente
            if (this.value.length === 0) {
                this.value = '09';
            }
            else if (this.value.length === 1 && this.value !== '0') {
                this.value = '09';
            }
            else if (this.value.length === 2 && !this.value.startsWith('09')) {
                this.value = '09' + this.value[1];
            }
        });
    });

    // Función para realizar peticiones AJAX
    async function fetchData(url, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        };

        if (data) {
            options.body = new URLSearchParams(data).toString();
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error en fetchData:', error);
            showNotification('Error al conectar con el servidor', 'error');
            throw error;
        }
    }

    // Cargar clientes desde la base de datos
    async function loadClients() {
        try {
            const data = await fetchData('php/clientes.php?action=read');
            return data;
        } catch (error) {
            console.error('Error al cargar clientes:', error);
            showNotification('Error al cargar clientes', 'error');
            return [];
        }
    }

    // Guardar cliente (crear o actualizar)
    async function saveClient(clientData) {
        try {
            const action = clientData.id ? 'update' : 'create';
            const data = await fetchData(`php/clientes.php?action=${action}`, 'POST', clientData);

            // Mensaje personalizado según la acción
            const message = clientData.id
                ? 'Cliente actualizado correctamente'
                : 'Cliente guardado correctamente';

            showNotification(message);
            return data;
        } catch (error) {
            console.error('Error al guardar cliente:', error);
            showNotification('Error al guardar cliente', 'error');
            throw error;
        }
    }
    // Eliminar cliente
    async function deleteClient(id) {
        try {
            const data = await fetchData('php/clientes.php?action=delete', 'POST', { id });
            showNotification('Cliente eliminado correctamente');
            return data;
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            showNotification('Error al eliminar cliente', 'error');
            throw error;
        }
    }

    // Muestra el modal para crear/editar cliente
    async function showClientModal(client = null) {
        if (client) {
            // Modo edición: Rellena el formulario con datos existentes
            modalTitle.textContent = 'Editar Cliente';
            document.getElementById('client-name').value = client.nombre || '';
            document.getElementById('client-cedula').value = client.cedula || '';
            document.getElementById('client-phone').value = client.telefono || '';
            document.getElementById('client-email').value = client.email || '';
            document.getElementById('client-address').value = client.direccion || '';
            clientForm.dataset.id = client.id;
        } else {
            // Modo creación: Limpia el formulario
            modalTitle.textContent = 'Nuevo Cliente';
            clientForm.reset();
            delete clientForm.dataset.id;
        }
        clientModal.style.display = 'flex';
    }

    // Busca clientes según criterios de búsqueda
    async function searchClients() {
        const nameTerm = searchName.value.toLowerCase();
        const cedulaTerm = searchCedula.value.toLowerCase();

        try {
            const clients = await loadClients();
            return clients.filter(client => {
                const nameMatch = client.nombre && client.nombre.toLowerCase().includes(nameTerm);
                const cedulaMatch = client.cedula && client.cedula.toLowerCase().includes(cedulaTerm);

                // Aplicar filtros según qué campos se han llenado
                if (searchName.value && searchCedula.value) {
                    return nameMatch && cedulaMatch;
                } else if (searchName.value) {
                    return nameMatch;
                } else if (searchCedula.value) {
                    return cedulaMatch;
                }
                return true;
            });
        } catch (error) {
            console.error('Error al buscar clientes:', error);
            return [];
        }
    }

    // Renderizar clientes
    async function renderClients(clientsToRender = null) {
        try {
            tableBody.innerHTML = '';

            const clients = clientsToRender || await loadClients();

            if (clients.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="7" style="text-align: center;">No hay clientes registrados</td>';
                tableBody.appendChild(row);
                return;
            }

            // Crear fila para cada cliente
            clients.forEach(client => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${client.id}</td>
                    <td>${client.nombre || 'N/A'}</td>
                    <td>${client.cedula || 'N/A'}</td>
                    <td>${client.telefono || 'N/A'}</td>
                    <td>${client.email || 'N/A'}</td>
                    <td>${client.direccion || 'N/A'}</td>
                    <td>
                        <button class="btn-action edit" data-id="${client.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" data-id="${client.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;

                // Evento para editar cliente
                row.querySelector('.edit').addEventListener('click', () => {
                    showClientModal(client);
                });

                // Evento para eliminar cliente
                row.querySelector('.delete').addEventListener('click', () => {
                    showConfirmDialog(
                        '¿Estás seguro de eliminar este cliente?',
                        async () => {
                            await deleteClient(client.id);
                            await renderClients();
                        }
                    );
                });

                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error al renderizar clientes:', error);
            showNotification('Error al cargar clientes', 'error');
        }
    }

    // Guardar cliente
    clientForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const clientData = {
            nombre: document.getElementById('client-name').value.trim(),
            cedula: document.getElementById('client-cedula').value.trim(),
            telefono: document.getElementById('client-phone').value.trim(),
            email: document.getElementById('client-email').value.trim(),
            direccion: document.getElementById('client-address').value.trim()
        };

        // Validación de campos obligatorios
        if (!clientData.nombre || !clientData.cedula || !clientData.telefono) {
            showNotification('Complete los campos obligatorios (*)', 'error');
            return;
        }

        // Validación adicional (por si se salta el keydown)
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(clientData.nombre)) {
            showNotification('El nombre solo puede contener letras', 'error');
            return;
        }

        if (!/^\d+$/.test(clientData.cedula)) {
            showNotification('La cédula solo puede contener números', 'error');
            return;
        }

        if (!/^\d+$/.test(clientData.telefono)) {
            showNotification('El teléfono solo puede contener números', 'error');
            return;
        }

        // Validaciones adicionales de los digitos de cédula y teléfono
        if (!/^09\d{8}$/.test(clientData.cedula)) {
            showNotification('La cédula debe tener 10 dígitos comenzando con 09', 'error');
            return;
        }

        if (!/^09\d{8}$/.test(clientData.telefono)) {
            showNotification('El teléfono debe tener 10 dígitos comenzando con 09', 'error');
            return;
        }

        // Agregar ID si estamos en modo edición
        if (this.dataset.id) {
            clientData.id = this.dataset.id;
        }

        try {
            await saveClient(clientData);
            clientModal.style.display = 'none';
            await renderClients();
        } catch (error) {
            console.error('Error al guardar cliente:', error);
        }
    });

    // Eventos de búsqueda
    searchName.addEventListener('input', async () => {
        const filteredClients = await searchClients();
        await renderClients(filteredClients);
    });

    searchCedula.addEventListener('input', async () => {
        const filteredClients = await searchClients();
        await renderClients(filteredClients);
    });

    // Botones Configuracion
    addClientBtn.addEventListener('click', () => showClientModal());

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            clientModal.style.display = 'none';
        });
    });

    // Inicializar
    renderClients();
});