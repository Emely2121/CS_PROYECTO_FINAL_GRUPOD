<?php
// Parámetros de conexión
$host = "localhost"; // local hostde la base de datos
$port = "3306"; //puerto de la base de datos
$dbname = "taller_vehicular"; // nombre de la base de datos
$user = "root"; // usuario de la base de datos
$password = "admin"; // contraseña de la base de datos

// Intenta establecer una conexión a la base de datos utilizando PDO
try {
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    // Crea una instancia de PDO para conectarse a la base de datos
    $pdo = new PDO($dsn, $user, $password, $options);
    // Establece el modo de error de PDO a excepción para manejar errores de conexión
} catch (PDOException $e) {
    die("Error de conexión: " . $e->getMessage());
}
