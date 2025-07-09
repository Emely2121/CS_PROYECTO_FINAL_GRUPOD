<?php
// Incluye el archivo de conexión a la base de datos.
require_once 'db.php';
// Establece la cabecera HTTP para indicar que la respuesta será en formato JSON.
header('Content-Type: application/json');

// Obtiene el valor del parámetro 'action' de la URL (p.ej., ?a.ction=create)
$action = $_GET['action'] ?? '';
// Inicia un bloque try-catch para manejar cualquier excepción (errores) que pueda ocurrir
try {
    switch ($action) {
        case 'create':
            // Obtener nombre del cliente
            $stmt = $pdo->prepare("SELECT nombre FROM clientes WHERE id = ?");
            $stmt->execute([$_POST['cliente_id']]);
            $cliente = $stmt->fetch();
            $cliente_nombre = $cliente['nombre'] ?? 'Desconocido';
            // Prepara una sentencia SQL INSERT para insertar datos de un vehículo.
            $stmt = $pdo->prepare("INSERT INTO vehiculos 
                                (marca, modelo, tipo, anio, placa, cliente_id, cliente_nombre)
                                VALUES (?, ?, ?, ?, ?, ?, ?)");
            // Ejecuta la sentencia preparada, pasando los datos del vehículo desde $_POST.
            $stmt->execute([
                $_POST['marca'],
                $_POST['modelo'],
                $_POST['tipo'],
                $_POST['anio'],
                $_POST['placa'],
                $_POST['cliente_id'],
                $cliente_nombre
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;
        // Caso para leer (obtener) todos los vehículos.
        case 'read':
            $stmt = $pdo->query("SELECT v.*, c.nombre as cliente_nombre
                               FROM vehiculos v
                               JOIN clientes c ON v.cliente_id = c.id
                               ORDER BY v.id DESC");
            echo json_encode($stmt->fetchAll());
            break;

        case 'read_by_client':
            $stmt = $pdo->prepare("SELECT * FROM vehiculos WHERE cliente_id = ?");
            $stmt->execute([$_GET['cliente_id']]);
            echo json_encode($stmt->fetchAll());
            break;
        // Caso para actualizar un vehículo existente.
        case 'update':
            // Obtener nombre del cliente
            $stmt = $pdo->prepare("SELECT nombre FROM clientes WHERE id = ?");
            $stmt->execute([$_POST['cliente_id']]);
            $cliente = $stmt->fetch();
            $cliente_nombre = $cliente['nombre'] ?? 'Desconocido';
            // Prepara una sentencia SQL UPDATE para actualizar un vehículo existente.
            $stmt = $pdo->prepare("UPDATE vehiculos SET
                                marca = ?, modelo = ?, tipo = ?, anio = ?, placa = ?, 
                                cliente_id = ?, cliente_nombre = ?
                                WHERE id = ?");
            // Ejecuta la sentencia preparada con los nuevos valores de los campos y el ID del vehículo.
            $stmt->execute([
                $_POST['marca'],
                $_POST['modelo'],
                $_POST['tipo'],
                $_POST['anio'],
                $_POST['placa'],
                $_POST['cliente_id'],
                $cliente_nombre,
                $_POST['id']
            ]);
            echo json_encode(['success' => true]);
            break;
        // Caso para eliminar un vehículo.
        case 'delete':
            $stmt = $pdo->prepare("DELETE FROM vehiculos WHERE id = ?");
            $stmt->execute([$_POST['id']]);
            echo json_encode(['success' => true]);
            break;
        // Caso para obtener un vehículo por su ID.
        default:
            echo json_encode(['error' => 'Acción no válida']);
    }
    // Captura cualquier excepción de PDO (errores de base de datos)
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
