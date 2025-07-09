document.addEventListener('DOMContentLoaded', function () {
    // Referencias a elementos del DOM
    const tableBody = document.querySelector('#orders-table tbody');
    const addOrderBtn = document.getElementById('add-order');
    const orderModal = document.getElementById('order-modal');
    const orderForm = document.getElementById('order-form');
    const modalTitle = orderModal.querySelector('h3');
    const clientSelect = document.getElementById('order-client');
    const vehicleSelect = document.getElementById('order-vehicle');
    const itemsContainer = document.querySelector('.items-list');
    const statusFilter = document.getElementById('status-filter');
    const dateFilter = document.getElementById('date-filter');
    const searchBox = document.querySelector('.search-box input');
    const clearFiltersBtn = document.getElementById('clear-filters') || createClearFiltersButton();

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

    // Crear botón para limpiar campos de filtro
    function createClearFiltersButton() {
        const btn = document.createElement('button');
        btn.innerHTML = '<i class="fas fa-times"></i> Limpiar filtros';
        btn.className = 'btn-primary';
        btn.id = 'clear-filters';
        document.querySelector('.filters').appendChild(btn);
        return btn;
    }

    // Validar descripción de item (solo letras)
    function validarDescripcionItem(input) {
        input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    }

    // Cargar clientes para el selector
    async function loadClientOptions(selectedId = '') {
        try {
            const clients = await fetchData('php/clientes.php?action=read');
            clientSelect.innerHTML = '<option value="">Seleccione un cliente</option>';

            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.textContent = client.nombre;
                if (client.id == selectedId) option.selected = true;
                clientSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar clientes:', error);
        }
    }

    // Cargar vehículos de un cliente específico
    async function loadVehicleOptions(clientId, selectedId = '') {
        try {
            const vehicles = await fetchData(`php/vehiculos.php?action=read_by_client&cliente_id=${clientId}`);
            vehicleSelect.innerHTML = '<option value="">Seleccione un vehículo</option>';

            vehicles.forEach(vehicle => {
                const option = document.createElement('option');
                option.value = vehicle.id;
                option.textContent = `${vehicle.marca} ${vehicle.modelo}`;
                if (vehicle.id == selectedId) option.selected = true;
                vehicleSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error al cargar vehículos:', error);
        }
    }

    // Calcular total de un item
    function calculateItemTotal(itemRow) {
        const qty = parseFloat(itemRow.querySelector('.item-qty').value) || 0;
        const price = parseFloat(itemRow.querySelector('.item-price').value) || 0;
        const total = qty * price;
        itemRow.querySelector('.item-total').textContent = formatCurrency(total > 0 ? total : 0);
        return total;
    }

    // Calcular total de la orden
    function calculateOrderTotal() {
        let subtotal = 0;
        document.querySelectorAll('.item-row:not(#item-template)').forEach(row => {
            subtotal += calculateItemTotal(row);
        });

        const discount = parseFloat(document.getElementById('order-discount').value) || 0;
        const total = subtotal - discount;

        document.querySelector('.total-amount').textContent = formatCurrency(total > 0 ? total : 0);
        return total;
    }

    // Configurar eventos para cada fila de ítem
    function setupItemEvents(itemRow) {
        const descInput = itemRow.querySelector('.item-desc');

        // Validación en tiempo real para descripción
        descInput.addEventListener('input', function () {
            validarDescripcionItem(this);
        });

        itemRow.querySelector('.item-qty').addEventListener('input', calculateOrderTotal);
        itemRow.querySelector('.item-price').addEventListener('input', calculateOrderTotal);

        itemRow.querySelector('.remove-item').addEventListener('click', () => {
            showConfirmDialog(
                '¿Eliminar este item?',
                () => {
                    itemRow.remove();
                    calculateOrderTotal();
                }
            );
        });
    }

    // Cargar órdenes desde la base de datos
    async function loadOrders() {
        try {
            const data = await fetchData('php/ordenes.php?action=read');
            return data;
        } catch (error) {
            console.error('Error al cargar órdenes:', error);
            showNotification('Error al cargar órdenes', 'error');
            return [];
        }
    }

    // Guardar orden (crear o actualizar)
   async function saveOrder(orderData) {
    try {
        orderData.items = JSON.stringify(orderData.items);
        const action = orderData.id ? 'update' : 'create';
        const data = await fetchData(`php/ordenes.php?action=${action}`, 'POST', orderData);
        
        // Mensaje modificado para asegurar que contiene "actualizada"
        const message = orderData.id 
            ? 'Orden actualizada correctamente'  // Asegura que use "actualizada"
            : 'Orden creada correctamente';
            
        showNotification(message);
        return data;
    } catch (error) {
        console.error('Error al guardar orden:', error);
        showNotification('Error al procesar la orden', 'error');
        throw error;
    }
}

    // Eliminar orden
    async function deleteOrder(id) {
        try {
            const data = await fetchData('php/ordenes.php?action=delete', 'POST', { id });
            showNotification('Orden de trabajo eliminada correctamente');
            return data;
        } catch (error) {
            console.error('Error al eliminar orden:', error);
            showNotification('Error al eliminar orden', 'error');
            throw error;
        }
    }

    // Función para aplicar todos los filtros
    function applyFilters(orders) {
        const statusValue = statusFilter.value;
        const dateValue = dateFilter.value;
        const searchTerm = searchBox.value.toLowerCase().trim();

        let filteredOrders = [...orders];

        // Filtrar por estado
        if (statusValue !== 'all') {
            filteredOrders = filteredOrders.filter(order => order.estado === statusValue);
        }

        // Filtrar por fecha
        if (dateValue) {
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.fecha).toISOString().split('T')[0];
                return orderDate === dateValue;
            });
        }

        // Filtrar por término de búsqueda
        if (searchTerm) {
            filteredOrders = filteredOrders.filter(order =>
                (order.cliente_nombre && order.cliente_nombre.toLowerCase().includes(searchTerm)) ||
                (order.vehiculo_info && order.vehiculo_info.toLowerCase().includes(searchTerm)) ||
                (order.id.toString().includes(searchTerm)) ||
                (order.descripcion && order.descripcion.toLowerCase().includes(searchTerm))
            );
        }

        return filteredOrders;
    }

    // Mostrar modal de orden (nueva o editar)
    async function showOrderModal(order = null) {
        try {
            // Cargar clientes para el selector
            await loadClientOptions(order ? order.cliente_id : '');

            if (order) {
                // Modo edición
                modalTitle.textContent = 'Editar Orden de Trabajo';
                document.getElementById('order-date').value = order.fecha;
                document.getElementById('order-description').value = order.descripcion;
                document.getElementById('order-status').value = order.estado;
                document.getElementById('order-discount').value = order.descuento || 0;

                // Cargar vehículos del cliente seleccionado
                if (order.cliente_id) {
                    await loadVehicleOptions(order.cliente_id, order.vehiculo_id);
                }

                // Limpiar items anteriores
                document.querySelectorAll('.item-row:not(#item-template)').forEach(row => row.remove());

                // Agregar items
                if (order.items && order.items.length) {
                    order.items.forEach(item => {
                        const newItem = document.getElementById('item-template').cloneNode(true);
                        newItem.id = '';
                        newItem.style.display = 'flex';
                        newItem.querySelector('.item-desc').value = item.descripcion;
                        newItem.querySelector('.item-qty').value = item.cantidad;
                        newItem.querySelector('.item-price').value = item.precio;
                        itemsContainer.insertBefore(newItem, document.getElementById('add-item'));
                        setupItemEvents(newItem);
                    });
                }

                orderForm.dataset.id = order.id;
            } else {
                // Modo creación
                modalTitle.textContent = 'Nueva Orden de Trabajo';
                orderForm.reset();
                document.getElementById('order-date').value = new Date().toISOString().split('T')[0];
                document.getElementById('order-status').value = 'pending';
                document.getElementById('order-discount').value = '0';

                // Limpiar items y selectores
                document.querySelectorAll('.item-row:not(#item-template)').forEach(row => row.remove());
                vehicleSelect.innerHTML = '<option value="">Seleccione un vehículo</option>';
                delete orderForm.dataset.id;
            }

            calculateOrderTotal();
            orderModal.style.display = 'flex';
        } catch (error) {
            console.error('Error al mostrar modal de orden:', error);
        }
    }

    // Renderizar órdenes en la tabla
    async function renderOrders() {
        try {
            tableBody.innerHTML = '';

            const orders = await loadOrders();
            const filteredOrders = applyFilters(orders);

            if (filteredOrders.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="7" style="text-align: center;">No hay órdenes registradas</td>';
                tableBody.appendChild(row);
                return;
            }

            // Mostrar las órdenes en orden inverso (más recientes primero)
            filteredOrders.reverse().forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.id}</td>
                    <td>${order.cliente_nombre || 'N/A'}</td>
                    <td>${order.vehiculo_info || 'N/A'}</td>
                    <td>${formatDate(order.fecha)}</td>
                    <td><span class="status-badge status-${order.estado}">${order.estado}</span></td>
                    <td>${formatCurrency(order.total)}</td>
                    <td>
                        <button class="btn-action edit" data-id="${order.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" data-id="${order.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;

                // Evento para editar orden
                row.querySelector('.edit').addEventListener('click', async () => {
                    const orders = await loadOrders();
                    const orderToEdit = orders.find(o => o.id == order.id);
                    if (orderToEdit) {
                        showOrderModal(orderToEdit);
                    }
                });

                // Evento para eliminar orden
                row.querySelector('.delete').addEventListener('click', () => {
                    showConfirmDialog(
                        '¿Estás seguro de eliminar esta orden?',
                        async () => {
                            await deleteOrder(order.id);
                            await renderOrders();
                        }
                    );
                });

                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error al renderizar órdenes:', error);
            showNotification('Error al cargar órdenes', 'error');
        }
    }

    // Agregar nuevo item
    document.getElementById('add-item').addEventListener('click', function () {
        const newItem = document.getElementById('item-template').cloneNode(true);
        newItem.id = '';
        newItem.style.display = 'flex';
        itemsContainer.insertBefore(newItem, this);
        setupItemEvents(newItem);
        calculateOrderTotal();
    });

    // Evento para cambio de cliente (cargar sus vehículos)
    clientSelect.addEventListener('change', async (e) => {
        if (e.target.value) {
            await loadVehicleOptions(e.target.value);
        } else {
            vehicleSelect.innerHTML = '<option value="">Seleccione un vehículo</option>';
        }
    });

    // Guardar orden
    orderForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Recopilar información de todos los ítems
        const items = [];
        document.querySelectorAll('.item-row:not(#item-template)').forEach(row => {
            items.push({
                descripcion: row.querySelector('.item-desc').value,
                cantidad: parseFloat(row.querySelector('.item-qty').value) || 0,
                precio: parseFloat(row.querySelector('.item-price').value) || 0,
                total: parseFloat(row.querySelector('.item-total').textContent.replace(/[^0-9.-]+/g, "")) || 0
            });
        });

        // Validación: al menos un ítem requerido
        if (items.length === 0) {
            showNotification('Debe agregar al menos un item a la orden', 'error');
            return;
        }

        // Prepara el objeto de datos de la orden
        const orderData = {
            fecha: document.getElementById('order-date').value,
            descripcion: document.getElementById('order-description').value,
            estado: document.getElementById('order-status').value,
            items: items,
            descuento: parseFloat(document.getElementById('order-discount').value) || 0,
            total: calculateOrderTotal(),
            cliente_id: document.getElementById('order-client').value,
            vehiculo_id: document.getElementById('order-vehicle').value
        };

        // Validación: cliente y vehículo requeridos
        if (!orderData.cliente_id || !orderData.vehiculo_id) {
            showNotification('Debe seleccionar un cliente y un vehículo', 'error');
            return;
        }

        // Agregar ID si estamos en modo edición
        if (this.dataset.id) {
            orderData.id = this.dataset.id;
        }

        try {
            await saveOrder(orderData);
            orderModal.style.display = 'none';
            await renderOrders();
        } catch (error) {
            console.error('Error al guardar orden:', error);
        }
    });

    // Limpiar filtros
    clearFiltersBtn.addEventListener('click', function () {
        statusFilter.value = 'all';
        dateFilter.value = '';
        searchBox.value = '';
        renderOrders();
    });

    // Configuración de eventos principales
    addOrderBtn.addEventListener('click', () => showOrderModal());

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            orderModal.style.display = 'none';
        });
    });

    document.getElementById('order-discount').addEventListener('input', calculateOrderTotal);
    statusFilter.addEventListener('change', renderOrders);
    dateFilter.addEventListener('change', renderOrders);
    searchBox.addEventListener('input', renderOrders);

    // Inicializar
    document.getElementById('item-template').style.display = 'none';
    setupItemEvents(document.getElementById('item-template'));
    loadClientOptions();
    renderOrders();
});