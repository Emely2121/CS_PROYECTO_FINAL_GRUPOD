<?php
// Incluye el archivo de conexión a la base de datos.
require_once 'db.php';
// Establece la cabecera HTTP para indicar que la respuesta será en formato JSON.
header('Content-Type: application/json');

// Obtiene el valor del parámetro 'action' de la URL (p.ej., ?a.ction=create)
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        // Caso para la acción 'create': insertar un nuevo repuesto en la base de datos.
        case 'create':
            $stmt = $pdo->prepare("INSERT INTO repuestos 
                                  (nombre, categoria, codigo, cantidad, min_stock, precio, proveedor, notas) 
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            // Ejecuta la sentencia preparada, pasando los valores recibidos a través de $_POST.
            $stmt->execute([
                $_POST['nombre'],
                $_POST['categoria'],
                $_POST['codigo'],
                $_POST['cantidad'],
                $_POST['min_stock'],
                $_POST['precio'],
                $_POST['proveedor'],
                $_POST['notas']
            ]);
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
            break;
        // Caso para la acción 'read': obtener todos los repuestos de la base de datos.
        case 'read':
            $stmt = $pdo->query("SELECT * FROM repuestos ORDER BY id DESC");
            echo json_encode($stmt->fetchAll());
            break;
        // Caso para la acción 'update': actualizar un repuesto existente en la base de datos.
        case 'update':
            $stmt = $pdo->prepare("UPDATE repuestos SET 
                                  nombre = ?, categoria = ?, codigo = ?, cantidad = ?, 
                                  min_stock = ?, precio = ?, proveedor = ?, notas = ?
                                  WHERE id = ?");
            // Ejecuta la sentencia preparada con los nuevos valores de los campos y el ID del repuesto.
            $stmt->execute([
                $_POST['nombre'],
                $_POST['categoria'],
                $_POST['codigo'],
                $_POST['cantidad'],
                $_POST['min_stock'],
                $_POST['precio'],
                $_POST['proveedor'],
                $_POST['notas'],
                $_POST['id']
            ]);
            echo json_encode(['success' => true]);
            break;
        // Caso para la acción 'delete': eliminar un repuesto de la base de datos.
        case 'delete':
            $stmt = $pdo->prepare("DELETE FROM repuestos WHERE id = ?");
            $stmt->execute([$_POST['id']]);
            echo json_encode(['success' => true]);
            break;

        default:
            echo json_encode(['error' => 'Acción no válida']);
    }
    // Captura cualquier PDOException
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
