document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const tableBody = document.querySelector('#stock-table tbody');
    const addItemBtn = document.getElementById('add-item');
    const stockModal = document.getElementById('stock-modal');
    const stockForm = document.getElementById('stock-form');
    const modalTitle = stockModal.querySelector('h3');
    const searchBox = document.getElementById('search-item');
    const categoryFilter = document.getElementById('category-filter');
    const clearFilterBtn = document.getElementById('clear-filter');

    // Validación para campos de solo letras
    function validarSoloLetras(input) {
        input.value = input.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    }

    // Configura eventos para los campos
    document.getElementById('item-name').addEventListener('input', function() {
        validarSoloLetras(this);
    });
    
    document.getElementById('item-supplier').addEventListener('input', function() {
        validarSoloLetras(this);
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

    // Cargar stock desde la base de datos
    async function loadStock() {
        try {
            const data = await fetchData('php/stock.php?action=read');
            return data;
        } catch (error) {
            console.error('Error al cargar stock:', error);
            showNotification('Error al cargar stock', 'error');
            return [];
        }
    }

    // Guardar item (crear o actualizar)
    async function saveStockItem(itemData) {
        try {
            const action = itemData.id ? 'update' : 'create';
            const data = await fetchData(`php/stock.php?action=${action}`, 'POST', itemData);

            // Mensaje personalizado
            const message = itemData.id
                ? 'Item actualizado correctamente'
                : 'Item guardado correctamente';

            showNotification(message);
            return data;
        } catch (error) {
            console.error('Error al guardar item:', error);
            showNotification('Error al guardar item', 'error');
            throw error;
        }
    }

    // Eliminar item
    async function deleteStockItem(id) {
        try {
            const data = await fetchData('php/stock.php?action=delete', 'POST', { id });
            showNotification('Item eliminado correctamente');
            return data;
        } catch (error) {
            console.error('Error al eliminar item:', error);
            showNotification('Error al eliminar item', 'error');
            throw error;
        }
    }

    // Mostrar modal para nuevo/editar item
    async function showStockModal(item = null) {
        if (item) {
            // Modo edición: Rellenar formulario con datos existentes
            modalTitle.textContent = 'Editar Item';
            document.getElementById('item-name').value = item.nombre || '';
            document.getElementById('item-category').value = item.categoria || '';
            document.getElementById('item-code').value = item.codigo || '';
            document.getElementById('item-stock').value = item.cantidad || 0;
            document.getElementById('item-min-stock').value = item.min_stock || 5;
            document.getElementById('item-price').value = item.precio || 0;
            document.getElementById('item-supplier').value = item.proveedor || '';
            document.getElementById('item-notes').value = item.notas || '';
            stockForm.dataset.id = item.id;
        } else {
            // Modo creación: Limpiar formulario
            modalTitle.textContent = 'Nuevo Item';
            stockForm.reset();
            document.getElementById('item-min-stock').value = 5;
            delete stockForm.dataset.id;
        }
        stockModal.style.display = 'flex';
    }

    // Función para aplicar filtros
    function applyFilters(items) {
        const categoryValue = categoryFilter.value;
        const searchTerm = searchBox.value.toLowerCase().trim();
        
        // Si no hay filtros aplicados, mostrar todos los items
        if (categoryValue === 'all' && searchTerm === '') {
            return items;
        }
        
        return items.filter(item => {
            // Filtro por categoría
            const categoryMatch = categoryValue === 'all' ||
                                (item.categoria && item.categoria.toLowerCase() === categoryValue.toLowerCase());
            
            // Filtro por término de búsqueda
            const searchMatch = searchTerm === '' ||
                (item.nombre && item.nombre.toLowerCase().includes(searchTerm)) ||
                (item.codigo && item.codigo.toLowerCase().includes(searchTerm));
            
            return categoryMatch && searchMatch;
        });
    }

    // Función para generar código automático
    function generarCodigo() {
        const nombre = document.getElementById('item-name').value.trim();
        const categoria = document.getElementById('item-category').value;
        
        if (!nombre || !categoria) return '';
        
        // Obtener siglas del nombre (3 primeras letras)
        const siglasNombre = nombre.substring(0, 3).toUpperCase().replace(/\s/g, '');
        
        // Obtener siglas de la categoría (3 primeras letras)
        const siglasCategoria = categoria.substring(0, 3).toUpperCase();
        
        // Generar número aleatorio de 3 dígitos
        const numero = Math.floor(Math.random() * 900) + 100;
        
        return `${siglasNombre}-${siglasCategoria}-${numero}`;
    }

    // Renderizar tabla de items
    async function renderStock() {
        try {
            tableBody.innerHTML = '';
            
            const items = await loadStock();
            const filteredItems = applyFilters(items);
            
            if (filteredItems.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="7" style="text-align: center;">No hay items registrados</td>';
                tableBody.appendChild(row);
                return;
            }

            filteredItems.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.id}</td>
                    <td>${item.nombre}</td>
                    <td>${item.categoria || 'N/A'}</td>
                    <td class="${item.cantidad <= (item.min_stock || 5) ? 'low-stock' : ''}">
                        ${item.cantidad}
                    </td>
                    <td>${formatCurrency(item.precio)}</td>
                    <td>${item.proveedor || 'N/A'}</td>
                    <td>
                        <button class="btn-action edit" data-id="${item.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" data-id="${item.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                
                // Evento para editar item
                row.querySelector('.edit').addEventListener('click', () => {
                    showStockModal(item);
                });
                
                // Evento para eliminar item
                row.querySelector('.delete').addEventListener('click', () => {
                    showConfirmDialog(
                        '¿Estás seguro de eliminar este item?',
                        async () => {
                            await deleteStockItem(item.id);
                            await renderStock();
                        }
                    );
                });
                
                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error('Error al renderizar stock:', error);
            showNotification('Error al cargar stock', 'error');
        }
    }

    // Guardar item (crear o actualizar)
    stockForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const itemData = {
            nombre: document.getElementById('item-name').value,
            categoria: document.getElementById('item-category').value,
            codigo: document.getElementById('item-code').value,
            cantidad: parseFloat(document.getElementById('item-stock').value) || 0,
            min_stock: parseFloat(document.getElementById('item-min-stock').value) || 5,
            precio: parseFloat(document.getElementById('item-price').value) || 0,
            proveedor: document.getElementById('item-supplier').value,
            notas: document.getElementById('item-notes').value
        };

        // Validación de campos obligatorios
        if (!itemData.nombre || !itemData.categoria || isNaN(itemData.precio)) {
            showNotification('Complete los campos requeridos: Nombre, Categoría y Precio', 'error');
            return;
        }

        // Validación formato código (si fue modificado manualmente)
        if (itemData.codigo && !/^[A-Z]{3}-[A-Z]{3}-\d{3}$/.test(itemData.codigo)) {
            showNotification('Formato de código inválido. Debe ser: ABC-TIP-123', 'error');
            return;
        }

        // Si no tiene código, generarlo automáticamente
        if (!itemData.codigo) {
            itemData.codigo = generarCodigo();
            document.getElementById('item-code').value = itemData.codigo;
        }

        // Agregar ID si estamos en modo edición
        if (this.dataset.id) {
            itemData.id = this.dataset.id;
        }

        try {
            await saveStockItem(itemData);
            stockModal.style.display = 'none';
            await renderStock();
        } catch (error) {
            console.error('Error al guardar item:', error);
        }
    });

    // Configurar evento para autogenerar código
    document.getElementById('item-category').addEventListener('change', function() {
        if (!document.getElementById('item-code').value) {
            document.getElementById('item-code').value = generarCodigo();
        }
    });

    document.getElementById('item-name').addEventListener('blur', function() {
        if (!document.getElementById('item-code').value && document.getElementById('item-category').value) {
            document.getElementById('item-code').value = generarCodigo();
        }
    });

    // Limpiar filtros
    clearFilterBtn.addEventListener('click', function() {
        categoryFilter.value = 'all';
        searchBox.value = '';
        renderStock();
    });

    // Configuración de eventos
    addItemBtn.addEventListener('click', () => showStockModal());
    
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            stockModal.style.display = 'none';
        });
    });

    // Eventos de filtrado
    searchBox.addEventListener('input', () => renderStock());
    categoryFilter.addEventListener('change', () => renderStock());

    // Inicializar
    renderStock();
});