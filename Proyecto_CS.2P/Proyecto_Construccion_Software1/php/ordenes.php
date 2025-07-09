<?php
// Incluye el archivo de conexión a la base de datos.
require_once 'db.php';
// Establece la cabecera HTTP para indicar que la respuesta será en formato JSON.
header('Content-Type: application/json');

// Obtiene el valor del parámetro 'action' de la URL (p.ej., ?a.ction=create)
$action = $_GET['action'] ?? '';
// Prepara una sentencia SQL INSERT para insertar ordenes de un cliente.
try {
    switch ($action) {
        case 'create':
            $pdo->beginTransaction();

            // Obtener información del cliente y vehículo
            $stmt = $pdo->prepare("SELECT nombre FROM clientes WHERE id = ?");
            $stmt->execute([$_POST['cliente_id']]);
            $cliente = $stmt->fetch();
            $cliente_nombre = $cliente['nombre'] ?? 'Desconocido';

            $stmt = $pdo->prepare("SELECT CONCAT(marca, ' ', modelo) as info FROM vehiculos WHERE id = ?");
            $stmt->execute([$_POST['vehiculo_id']]);
            $vehiculo = $stmt->fetch();
            $vehiculo_info = $vehiculo['info'] ?? 'Desconocido';

            $stmt = $pdo->prepare("INSERT INTO ordenes
                                (fecha, descripcion, estado, descuento, total, 
                                 cliente_id, cliente_nombre, vehiculo_id, vehiculo_info)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            // Ejecuta la sentencia con los datos recibidos por POST y la información de cliente/vehículo.
            $stmt->execute([
                $_POST['fecha'],
                $_POST['descripcion'],
                $_POST['estado'],
                $_POST['descuento'],
                $_POST['total'],
                $_POST['cliente_id'],
                $cliente_nombre,
                $_POST['vehiculo_id'],
                $vehiculo_info
            ]);
            // Obtener el ID de la orden recién insertada
            $orden_id = $pdo->lastInsertId();

            // Insertar los items de la orden
            $items = json_decode($_POST['items'], true);
            foreach ($items as $item) {
                $stmt = $pdo->prepare("INSERT INTO orden_items
                                    (orden_id, descripcion, cantidad, precio, total)
                                    VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([
                    $orden_id,
                    $item['descripcion'],
                    $item['cantidad'],
                    $item['precio'],
                    $item['total']
                ]);
            }
            // Devuelve una respuesta JSON indicando éxito y el ID de la nueva orden.
            $pdo->commit();
            echo json_encode(['success' => true, 'id' => $orden_id]);
            break;
        // Caso para leer (obtener) todas las órdenes de servicio con sus detalles.
        case 'read':
            $stmt = $pdo->query("SELECT o.*, c.nombre as cliente_nombre,
                               CONCAT(v.marca, ' ', v.modelo) as vehiculo_info
                               FROM ordenes o
                               JOIN clientes c ON o.cliente_id = c.id
                               JOIN vehiculos v ON o.vehiculo_id = v.id
                               ORDER BY o.id DESC");
            // Obtiene todas las órdenes encontradas.
            $ordenes = $stmt->fetchAll();

            // Obtener items para cada orden
            foreach ($ordenes as &$orden) {
                $stmt = $pdo->prepare("SELECT * FROM orden_items WHERE orden_id = ?");
                $stmt->execute([$orden['id']]);
                $orden['items'] = $stmt->fetchAll();
            }

            echo json_encode($ordenes);
            break;
        // Caso para actualizar una orden de servicio existente.
        case 'update':
            $pdo->beginTransaction();

            // Obtener información del cliente y vehículo
            $stmt = $pdo->prepare("SELECT nombre FROM clientes WHERE id = ?");
            $stmt->execute([$_POST['cliente_id']]);
            $cliente = $stmt->fetch();
            $cliente_nombre = $cliente['nombre'] ?? 'Desconocido';

            $stmt = $pdo->prepare("SELECT CONCAT(marca, ' ', modelo) as info FROM vehiculos WHERE id = ?");
            $stmt->execute([$_POST['vehiculo_id']]);
            $vehiculo = $stmt->fetch();
            $vehiculo_info = $vehiculo['info'] ?? 'Desconocido';

            // Actualizar la orden principal
            $stmt = $pdo->prepare("UPDATE ordenes SET
                                fecha = ?, descripcion = ?, estado = ?,
                                descuento = ?, total = ?, cliente_id = ?, 
                                cliente_nombre = ?, vehiculo_id = ?, vehiculo_info = ?
                                WHERE id = ?");
            // Ejecuta la sentencia con los datos actualizados.
            $stmt->execute([
                $_POST['fecha'],
                $_POST['descripcion'],
                $_POST['estado'],
                $_POST['descuento'],
                $_POST['total'],
                $_POST['cliente_id'],
                $cliente_nombre,
                $_POST['vehiculo_id'],
                $vehiculo_info,
                $_POST['id']
            ]);

            // Eliminar items antiguos y agregar nuevos
            $stmt = $pdo->prepare("DELETE FROM orden_items WHERE orden_id = ?");
            $stmt->execute([$_POST['id']]);

            $items = json_decode($_POST['items'], true);
            foreach ($items as $item) {
                $stmt = $pdo->prepare("INSERT INTO orden_items
                                    (orden_id, descripcion, cantidad, precio, total)
                                    VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([
                    $_POST['id'],
                    $item['descripcion'],
                    $item['cantidad'],
                    $item['precio'],
                    $item['total']
                ]);
            }

            // Devuelve una respuesta JSON indicando el éxito.
            $pdo->commit();
            echo json_encode(['success' => true]);
            break;

        case 'delete':
            $pdo->beginTransaction();

            // Eliminar items primero
            $stmt = $pdo->prepare("DELETE FROM orden_items WHERE orden_id = ?");
            $stmt->execute([$_POST['id']]);

            // Luego eliminar la orden
            $stmt = $pdo->prepare("DELETE FROM ordenes WHERE id = ?");
            $stmt->execute([$_POST['id']]);

            $pdo->commit();
            echo json_encode(['success' => true]);
            break;

        default:
            echo json_encode(['error' => 'Acción no válida']);
    }
    // Captura cualquier PDOException que ocurra.
} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['error' => $e->getMessage()]);
}
