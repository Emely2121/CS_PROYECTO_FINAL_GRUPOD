document.addEventListener('DOMContentLoaded', function () {
    // Actualiza los contadores de estadísticas del dashboard
    function updateStats() {
        const clients = JSON.parse(localStorage.getItem('taller_clientes')) || [];
        const vehicles = JSON.parse(localStorage.getItem('taller_vehiculos')) || [];
        const orders = JSON.parse(localStorage.getItem('taller_ordenes')) || [];
        const stock = JSON.parse(localStorage.getItem('taller_stock')) || [];

        // Actualiza contadores simples
        document.getElementById('clientes-count').textContent = clients.length;
        document.getElementById('vehiculos-count').textContent = vehicles.length;
        document.getElementById('ordenes-count').textContent = orders.length;
        document.getElementById('stock-count').textContent = stock.length;

        // Actualiza badges con texto apropiado (singular/plural)
        document.getElementById('clientes-badge').textContent = `${clients.length} ${clients.length === 1 ? 'registro' : 'registros'}`;
        document.getElementById('vehiculos-badge').textContent = `${vehicles.length} ${vehicles.length === 1 ? 'registro' : 'registros'}`;
        document.getElementById('ordenes-badge').textContent = `${orders.length} ${orders.length === 1 ? 'registro' : 'registros'}`;
        document.getElementById('stock-badge').textContent = `${stock.length} ${stock.length === 1 ? 'registro' : 'registros'}`;
    }

    // Cargar órdenes recientes
    function loadRecentOrders() {
        const orders = JSON.parse(localStorage.getItem('taller_ordenes')) || [];
        const recentOrders = orders.slice(-5).reverse();
        const container = document.getElementById('recent-orders');

        container.innerHTML = '';

        if (recentOrders.length === 0) {
            container.innerHTML = '<p>No hay órdenes recientes</p>';
            return;
        }

        // Genera tarjetas para cada orden reciente
        recentOrders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            orderCard.innerHTML = `
                <h4>Orden #${order.id}</h4>
                <p><strong>Cliente:</strong> ${order.clienteNombre || 'N/A'}</p>
                <p><strong>Vehículo:</strong> ${order.vehiculoInfo || 'N/A'}</p>
                <p><strong>Fecha:</strong> ${formatDate(order.fecha)}</p>
                <p><strong>Total:</strong> ${formatCurrency(order.total)}</p>
                <p><span class="status-badge status-${order.estado}">${order.estado}</span></p>
            `;
            container.appendChild(orderCard);
        });
    }

    // Inicializar
    updateStats();
    loadRecentOrders();

    // Actualizar cada minuto
    setInterval(() => {
        updateStats();
        loadRecentOrders();
    }, 60000);
});
