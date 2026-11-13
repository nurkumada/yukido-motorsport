
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

// Mengambil JSON
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

$quantity = filter_var(
    $data["quantity"] ?? null,
    FILTER_VALIDATE_INT
);

if (!$itemId || $itemId < 1 || $quantity === false || $quantity < 1) {
    http_response_code(422);
    echo json_encode([
        "success" => false,
        "message" => "ID item dan jumlah produk tidak valid."
    ]);
    exit;
}

$userId = (int) $_SESSION["user"]["id"];

try {
    $conn->beginTransaction();

    // Memastikan item milik pengguna yang login
    $stmt = $conn->prepare("
        SELECT
            ci.id,
            ci.cart_id,
            ci.product_id,
            p.name,
            p.price,
            p.stock,
            p.status
        FROM cart_items ci
        INNER JOIN carts c ON c.id = ci.cart_id
        INNER JOIN products p ON p.id = ci.product_id
        WHERE ci.id = :item_id
          AND c.user_id = :user_id
          AND c.status = 'active'
        FOR UPDATE
    ");

    $stmt->execute([
        "item_id" => $itemId,
        "user_id" => $userId
    ]);

    $item = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        $conn->rollBack();

        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Produk tidak ditemukan dalam keranjang."
        ]);
        exit;
    }

    // Memeriksa status produk
    if ($item["status"] !== "active") {
        $conn->rollBack();

        http_response_code(422);
        echo json_encode([
            "success" => false,
            "message" => "Produk sudah tidak tersedia."
        ]);
        exit;
    }

    // Memeriksa stok
    if ($quantity > (int) $item["stock"]) {
        $conn->rollBack();

        http_response_code(422);
        echo json_encode([
            "success" => false,
            "message" => "Jumlah melebihi stok tersedia.",
            "stock_available" => (int) $item["stock"]
        ]);
        exit;
    }

    // Memperbarui kuantitas
    $stmt = $conn->prepare("
        UPDATE cart_items
        SET quantity = :quantity
        WHERE id = :item_id
    ");

    $stmt->execute([
        "quantity" => $quantity,
        "item_id" => $itemId
    ]);

    $subtotal = (float) $item["price"] * $quantity;

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Kuantitas produk berhasil diperbarui.",
        "cart_item_id" => (int) $itemId,
        "quantity" => $quantity,
        "subtotal" => $subtotal
    ]);

} catch (Throwable $e) {

    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Terjadi kesalahan saat memperbarui keranjang."
    ]);
}
