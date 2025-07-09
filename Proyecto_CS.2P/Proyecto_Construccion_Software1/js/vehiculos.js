document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const tableBody = document.querySelector('#vehicles-table tbody');
    const addVehicleBtn = document.getElementById('add-vehicle');
    const vehicleModal = document.getElementById('vehicle-modal');
    const vehicleForm = document.getElementById('vehicle-form');
    const modalTitle = document.getElementById('modal-vehicle-title');
    const clientSelect = document.getElementById('vehicle-owner');
    const searchBox = document.getElementById('search-vehicle');
    const typeFilter = document.getElementById('type-filter');
    const yearFilter = document.getElementById('year-filter');
    const clearFiltersBtn = document.getElementById('clear-filters');

    // Validación en tiempo real para marca y modelo (solo letras)
    document.getElementById('vehicle-brand').addEventListener('keydown', function(e) {
        const key = e.key;
        // Permitir: letras, espacios, teclas de control
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(key) &&
            !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) {
            e.preventDefault();
        }
    });

    document.getElementById('vehicle-model').addEventListener('keydown', function(e) {
        const key = e.key;
        // Permitir: letras, espacios, teclas de control
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/.test(key) &&
            !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) {
            e.preventDefault();
        }
    });

    // Validación para placas de Ecuador (ej: ABC-0123 o AB-01234)
    document.getElementById('vehicle-plate').addEventListener('keydown', function(e) {
        const key = e.key;
        const currentValue = e.target.value;
        
        // Permitir: letras (solo al principio), números, guión y teclas de control
        if (
            !/^[a-zA-Z0-9-]$/.test(key) &&
            !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)
        ) {
            e.preventDefault();
            return;
        }
        
        // Validar posición del guión (después de 2 o 3 letras)
        if (key === '-') {
            if (currentValue.length < 2 || currentValue.length > 3 || currentValue.includes('-')) {
                e.preventDefault();
            }
            return;
        }
        
        // Validar estructura completa
        if (currentValue.length >= 8 && key !== 'Backspace' && key !== 'Delete') {
            e.preventDefault();
        }
    });

    // Validación al pegar texto
    ['vehicle-brand', 'vehicle-model', 'vehicle-plate'].forEach(id => {
        document.getElementById(id).addEventListener('paste', function(e) {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text');
            
            if (id === 'vehicle-brand') {
                // Solo letras para marca
                const filtered = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                document.execCommand('insertText', false, filtered);
            }
            else if (id === 'vehicle-model') {
                // Letras y números para modelo
                const filtered = text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s]/g, '');
                document.execCommand('insertText', false, filtered);
            }
            else if (id === 'vehicle-plate') {
                // Formato de placa ecuatoriana
                let filtered = text.replace(/[^a-zA-Z0-9-]/g, '');
                
                // Forzar formato: 2-3 letras + guión + 3-4 números
                filtered = filtered.toUpperCase();
                if (filtered.length > 3 && !filtered.includes('-')) {
                    filtered = filtered.replace(/([A-Z]{2,3})(\d{3,4})/, '$1-$2');
                }
                
                // Limitar longitud total
                filtered = filtered.substring(0, 8);
                document.execCommand('insertText', false, filtered);
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

    // Cargar vehículos desde la base de datos
    async function loadVehicles() {
        try {
            const data = await fetchData('php/vehiculos.php?action=read');
            return data;
        } catch (error) {
            console.error('Error al cargar vehículos:', error);
            showNotification('Error al cargar vehículos', 'error');
            return [];
        }
    }

    // Cargar vehículos de un cliente específico
    async function loadClientVehicles(clientId) {
        try {
            const data = await fetchData(`php/vehiculos.php?action=read_by_client&cliente_id=${clientId}`);
            return data;
        } catch (error) {
            console.error('Error al cargar vehículos del cliente:', error);
            showNotification('Error al cargar vehículos del cliente', 'error');
            return [];
        }
    }

    // Cargar clientes para el selector
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

    // Guardar vehículo (crear o actualizar)
    async function saveVehicle(vehicleData) {
        try {
            const action = vehicleData.id ? 'update' : 'create';
            const data = await fetchData(`php/vehiculos.php?action=${action}`, 'POST', vehicleData);

            // Mensaje personalizado
            const message = vehicleData.id
                ? 'Vehículo actualizado correctamente'
                : 'Vehículo guardado correctamente';

            showNotification(message);
            return data;
        } catch (error) {
            console.error('Error al guardar vehículo:', error);
            showNotification('Error al guardar vehículo', 'error');
            throw error;
        }
    }

    // Eliminar vehículo
    async function deleteVehicle(id) {
        try {
            const data = await fetchData('php/vehiculos.php?action=delete', 'POST', { id });
            showNotification('Vehículo eliminado correctamente');
            return data;
        } catch (error) {
            console.error('Error al eliminar vehículo:', error);
            showNotification('Error al eliminar vehículo', 'error');
            throw error;
        }
    }

    // Mostrar modal para nuevo/editar vehículo
    async function showVehicleModal(vehicle = null) {
        try {
            // Cargar clientes para el selector
            const clients = await loadClients();
            clientSelect.innerHTML = '<option value="">Seleccione un cliente</option>';
            
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.nombre;
                clientSelect.appendChild(option);
            });

            if (vehicle) {
                // Modo edición: Rellenar formulario con datos existentes
                modalTitle.textContent = 'Editar Vehículo';
                document.getElementById('vehicle-brand').value = vehicle.marca || '';
                document.getElementById('vehicle-model').value = vehicle.modelo || '';
                document.getElementById('vehicle-type').value = vehicle.tipo || '';
                document.getElementById('vehicle-year').value = vehicle.anio || '';
                document.getElementById('vehicle-plate').value = vehicle.placa || '';
                clientSelect.value = vehicle.cliente_id || '';
                vehicleForm.dataset.id = vehicle.id;
            } else {
                // Modo creación: Limpiar formulario
                modalTitle.textContent = 'Nuevo Vehículo';
                vehicleForm.reset();
                document.getElementById('vehicle-type').value = '';
                delete vehicleForm.dataset.id;
            }

            vehicleModal.style.display = 'flex';
        } catch (error) {
            console.error('Error al mostrar modal de vehículo:', error);
        }
    }

    // Función para aplicar todos los filtros a los vehículos
    function applyFilters(vehicles) {
        const typeValue = typeFilter.value;
        const yearValue = yearFilter.value;
        const searchTerm = searchBox.value.toLowerCase().trim();
        
        // Si no hay filtros aplicados, mostrar todos los vehículos
        if (typeValue === 'all' && !yearValue && searchTerm === '') {
            return vehicles;
        }
        
        return vehicles.filter(vehicle => {
            // Filtro por tipo
            const typeMatch = typeValue === 'all' ||
                             (vehicle.tipo && vehicle.tipo.toLowerCase() === typeValue.toLowerCase());
            
            // Filtro por año
            const yearMatch = !yearValue ||
                             (vehicle.anio && vehicle.anio.toString() === yearValue);
            
            // Filtro por búsqueda
            const searchMatch = searchTerm === '' ||
                (vehicle.marca && vehicle.marca.toLowerCase().includes(searchTerm)) ||
                (vehicle.modelo && vehicle.modelo.toLowerCase().includes(searchTerm)) ||
                (vehicle.placa && vehicle.placa.toLowerCase().includes(searchTerm)) ||
                (vehicle.tipo && vehicle.tipo.toLowerCase().includes(searchTerm)) ||
                (vehicle.cliente_nombre && vehicle.cliente_nombre.toLowerCase().includes(searchTerm));
            
            return typeMatch && yearMatch && searchMatch;
        });
    }

    // Renderizar tabla de vehículos
    async function renderVehicles() {
        try {
            tableBody.innerHTML = '';
            
            const vehicles = await loadVehicles();
            const filteredVehicles = applyFilters(vehicles);
            
            if (filteredVehicles.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="7" style="text-align: center;">No hay vehículos registrados</td>';
                tableBody.appendChild(row);
                return;
            }

            filteredVehicles.forEach(vehicle => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${vehicle.id}</td>
                    <td>${vehicle.marca || ''} ${vehicle.modelo || ''}</td>
                    <td>${vehicle.tipo || 'N/A'}</td>
                    <td>${vehicle.anio || 'N/A'}</td>
                    <td>${vehicle.placa || 'N/A'}</td>
                    <td>${vehicle.cliente_nombre || 'Cliente no encontrado'}</td>
                    <td>
                        <button class="btn-action edit" data-id="${vehicle.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" data-id="${vehicle.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                // Evento para editar vehículo
                row.querySelector('.edit').addEventListener('click', () => {
                    showVehicleModal(vehicle);
                });
                
                // Evento para eliminar vehículo
                row.querySelector('.delete').addEventListener('click', () => {
                    showConfirmDialog(
                        '¿Estás seguro de eliminar este vehículo?',
                        async () => {
                            await deleteVehicle(vehicle.id);
                            await renderVehicles();
                        }
                    );
                });
                
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error al renderizar vehículos:', error);
            showNotification('Error al cargar vehículos', 'error');
        }
    }

    // Guardar vehículo (crear o actualizar)
    vehicleForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const vehicleData = {
            marca: document.getElementById('vehicle-brand').value.trim(),
            modelo: document.getElementById('vehicle-model').value.trim(),
            tipo: document.getElementById('vehicle-type').value,
            anio: document.getElementById('vehicle-year').value,
            placa: document.getElementById('vehicle-plate').value.trim().toUpperCase(),
            cliente_id: document.getElementById('vehicle-owner').value
        };

        // Validación de campos obligatorios
        if (!vehicleData.marca || !vehicleData.modelo || !vehicleData.tipo || !vehicleData.cliente_id) {
            showNotification('Complete los campos obligatorios (*)', 'error');
            return;
        }

        // Validación de formato de placa ecuatoriana (ej: ABC-1234 o AB-12345)
        if (vehicleData.placa && !/^[A-Z]{2,3}-\d{3,4}$/.test(vehicleData.placa)) {
            showNotification('Formato de placa inválido. Use: ABC-1234 o AB-1234', 'error');
            return;
        }

        // Agregar ID si estamos en modo edición
        if (this.dataset.id) {
            vehicleData.id = this.dataset.id;
        }

        try {
            await saveVehicle(vehicleData);
            vehicleModal.style.display = 'none';
            await renderVehicles();
        } catch (error) {
            console.error('Error al guardar vehículo:', error);
        }
    });

    // Limpiar todos los filtros seleccionados
    function clearFilters() {
        typeFilter.value = 'all';
        yearFilter.value = '';
        searchBox.value = '';
        renderVehicles();
    }

    // Configuración de eventos
    addVehicleBtn.addEventListener('click', () => showVehicleModal());
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            vehicleModal.style.display = 'none';
        });
    });

    // Eventos de filtrado
    typeFilter.addEventListener('change', () => renderVehicles());
    
    yearFilter.addEventListener('input', function() {
        // Solo filtrar si el valor es vacío o un número válido
        if (this.value === '' || (!isNaN(this.value) && this.value >= 1900 && this.value <= new Date().getFullYear())) {
            renderVehicles();
        }
    });
    
    searchBox.addEventListener('input', () => renderVehicles());
    
    clearFiltersBtn.addEventListener('click', clearFilters);

    // Inicializar
    renderVehicles();
});