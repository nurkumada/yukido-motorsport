
<?php
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

if ($_SERVER["REQUEST_METHOD"] !== "DELETE") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Gunakan metode DELETE"
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$id = $data["id"] ?? null;

if (!filter_var($id, FILTER_VALIDATE_INT) || $id <= 0) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "ID produk tidak valid"
    ]);
    exit;
}

try {
    // Cek apakah produk memiliki riwayat transaksi
    $check = $conn->prepare(
        "SELECT COUNT(*) FROM order_items WHERE product_id = ?"
    );
    $check->execute([$id]);

    if ($check->fetchColumn() > 0) {
        http_response_code(409);
        echo json_encode([
            "success" => false,
            "message" => "Produk memiliki riwayat transaksi. Nonaktifkan produk, jangan hapus."
        ]);
        exit;
    }

    $stmt = $conn->prepare(
        "DELETE FROM products WHERE id = ?"
    );
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Produk tidak ditemukan"
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Produk berhasil dihapus"
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Produk tidak dapat dihapus karena masih digunakan."
    ]);
}
?>
