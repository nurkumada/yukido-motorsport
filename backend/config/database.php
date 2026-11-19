<?php
$host = "127.0.0.1";
$port = "3306";
$dbname = "yukido_db";
$username = "root";
$password = "";

try {
    $conn = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );

    $conn->setAttribute(
        PDO::ATTR_ERRMODE,
        PDO::ERRMODE_EXCEPTION
    );

} catch (PDOException $e) {
    die("Koneksi database gagal: " . $e->getMessage());
}
?>