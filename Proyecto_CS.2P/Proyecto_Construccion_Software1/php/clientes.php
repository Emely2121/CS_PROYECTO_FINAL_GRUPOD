<?php
// Incluye el archivo de conexión a la base de datos.
require_once 'db.php';
// Establece la cabecera HTTP para indicar que la respuesta será en formato JSON.
header('Content-Type: application/json');

// Obtiene el valor del parámetro 'action' de la URL (p.ej., ?a.ction=create)
$action = $_GET['action'] ?? '';
// Prepara una sentencia SQL INSERT para insertar datos de un cliente.
try {
    switch ($action) {
        case 'create':
            $stmt = $pdo->prepare("INSERT INTO clientes (nombre, cedula, telefono, email, direccion) 
                                  VALUES (?, ?, ?, ?, ?)");
            // Ejecuta la sentencia preparada, pasando los datos del cliente desde $_POST.
            $stmt->execute([
                $_POST['nombre'],
                $_POST['cedula'],
                $_POST['telefono'],
                $_POST['email'],
                $_POST['direccion']
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;
        // Caso para leer (obtener) todos los clientes.
        case 'read':
            $stmt = $pdo->query("SELECT * FROM clientes ORDER BY id DESC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;
        // Caso para actualizar un cliente existente.
        case 'update':
            $stmt = $pdo->prepare("UPDATE clientes SET 
                                  nombre = ?, cedula = ?, telefono = ?, email = ?, direccion = ?
                                  WHERE id = ?");
            $stmt->execute([
                $_POST['nombre'],
                $_POST['cedula'],
                $_POST['telefono'],
                $_POST['email'],
                $_POST['direccion'],
                $_POST['id']
            ]);
            echo json_encode(['success' => true]);
            break;
        // Caso para eliminar un cliente.
        case 'delete':
            $stmt = $pdo->prepare("DELETE FROM clientes WHERE id = ?");
            $stmt->execute([$_POST['id']]);
            echo json_encode(['success' => true]);
            break;

        default:
            echo json_encode(['error' => 'Acción no válida']);
    }
    // Captura cualquier excepción de PDO (errores de base de datos)
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
