
<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

// Memeriksa login
if (!isset($_SESSION["user"]["id"])) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Silakan login terlebih dahulu."
    ]);
    exit;
}

// Hanya pelanggan
if ($_SESSION["user"]["role"] !== "customer") {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Akses hanya untuk pelanggan."
    ]);
    exit;
}

// Hanya menerima POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Metode request tidak diizinkan."
    ]);
    exit;
}

// Mengambil data JSON
$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Format data tidak valid."
    ]);
    exit;
}

$itemId = filter_var(
    $data["cart_item_id"] ?? null,
    FILTER_VALIDATE_INT
);

if (!$itemId || $itemId < 1) {
    http_response_code(422);
    echo json_encode([
        "success" => false,
        "message" => "ID item keranjang tidak valid."
    ]);
    exit;
}

$userId = (int) $_SESSION["user"]["id"];

try {

    // Menghapus hanya item milik pengguna yang login
    $stmt = $conn->prepare("
        DELETE ci
        FROM cart_items ci
        INNER JOIN carts c ON c.id = ci.cart_id
        WHERE ci.id = :item_id
          AND c.user_id = :user_id
          AND c.status = 'active'
    ");

    $stmt->execute([
        "item_id" => $itemId,
        "user_id" => $userId
    ]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Produk tidak ditemukan dalam keranjang."
        ]);
        exit;
    }

    echo json_encode([
        "success" => true,
        "message" => "Produk berhasil dihapus dari keranjang."
    ]);

} catch (PDOException $e) {

    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Terjadi kesalahan saat menghapus produk."
    ]);
}
