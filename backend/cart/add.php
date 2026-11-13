
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

// Hanya pelanggan yang dapat menambahkan produk
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

$productId = filter_var(
    $data["product_id"] ?? null,
    FILTER_VALIDATE_INT
);

$quantity = filter_var(
    $data["quantity"] ?? 1,
    FILTER_VALIDATE_INT
);

if (!$productId || $productId < 1 || !$quantity || $quantity < 1) {
    http_response_code(422);
    echo json_encode([
        "success" => false,
        "message" => "ID produk dan jumlah produk tidak valid."
    ]);
    exit;
}

$userId = (int) $_SESSION["user"]["id"];

try {
    $conn->beginTransaction();

    // Memeriksa produk dan mengunci data selama transaksi
    $stmt = $conn->prepare("
        SELECT id, name, price, stock, status
        FROM products
        WHERE id = :product_id
        FOR UPDATE
    ");

    $stmt->execute([
        "product_id" => $productId
    ]);

    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product || $product["status"] !== "active") {
        $conn->rollBack();

        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Produk tidak ditemukan atau tidak tersedia."
        ]);
        exit;
    }

    // Memeriksa stok
    if ($quantity > (int) $product["stock"]) {
        $conn->rollBack();

        http_response_code(422);
        echo json_encode([
            "success" => false,
            "message" => "Jumlah melebihi stok yang tersedia.",
            "stock_available" => (int) $product["stock"]
        ]);
        exit;
    }

    // Mencari keranjang aktif pengguna
    $stmt = $conn->prepare("
        SELECT id
        FROM carts
        WHERE user_id = :user_id
          AND status = 'active'
        LIMIT 1
        FOR UPDATE
    ");

    $stmt->execute([
        "user_id" => $userId
    ]);

    $cart = $stmt->fetch(PDO::FETCH_ASSOC);

    // Membuat keranjang jika belum ada
    if (!$cart) {
        $stmt = $conn->prepare("
            INSERT INTO carts (user_id, status)
            VALUES (:user_id, 'active')
        ");

        $stmt->execute([
            "user_id" => $userId
        ]);

        $cartId = (int) $conn->lastInsertId();

    } else {
        $cartId = (int) $cart["id"];
    }

    // Memeriksa apakah produk sudah ada
    $stmt = $conn->prepare("
        SELECT id, quantity
        FROM cart_items
        WHERE cart_id = :cart_id
          AND product_id = :product_id
        LIMIT 1
    ");

    $stmt->execute([
        "cart_id" => $cartId,
        "product_id" => $productId
    ]);

    $existingItem = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existingItem) {

        $newQuantity = (int) $existingItem["quantity"] + $quantity;

        if ($newQuantity > (int) $product["stock"]) {
            $conn->rollBack();

            http_response_code(422);
            echo json_encode([
                "success" => false,
                "message" => "Total jumlah produk melebihi stok tersedia.",
                "stock_available" => (int) $product["stock"]
            ]);
            exit;
        }

        $stmt = $conn->prepare("
            UPDATE cart_items
            SET quantity = :quantity
            WHERE id = :id
        ");

        $stmt->execute([
            "quantity" => $newQuantity,
            "id" => $existingItem["id"]
        ]);

    } else {

        $stmt = $conn->prepare("
            INSERT INTO cart_items (
                cart_id,
                product_id,
                quantity
            )
            VALUES (
                :cart_id,
                :product_id,
                :quantity
            )
        ");

        $stmt->execute([
            "cart_id" => $cartId,
            "product_id" => $productId,
            "quantity" => $quantity
        ]);
    }

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Produk berhasil ditambahkan ke keranjang.",
        "product" => [
            "id" => (int) $product["id"],
            "name" => $product["name"],
            "price" => (float) $product["price"],
            "quantity_added" => $quantity
        ]
    ]);

} catch (Throwable $e) {

    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Terjadi kesalahan saat menambahkan produk."
    ]);
}
