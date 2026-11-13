
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

// Memeriksa role pelanggan
if ($_SESSION["user"]["role"] !== "customer") {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Akses keranjang hanya untuk pelanggan."
    ]);
    exit;
}

$userId = (int) $_SESSION["user"]["id"];

try {
    // Mencari keranjang aktif
    $stmt = $conn->prepare("
        SELECT id
        FROM carts
        WHERE user_id = :user_id
          AND status = 'active'
        LIMIT 1
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

    // Mengambil produk dari keranjang
    $stmt = $conn->prepare("
        SELECT
            ci.id AS cart_item_id,
            ci.product_id,
            ci.quantity,
            p.sku,
            p.name,
            p.price,
            p.stock,
            p.status,
            p.warranty_type,
            p.warranty_period_months,
            (p.price * ci.quantity) AS subtotal
        FROM cart_items ci
        INNER JOIN products p
            ON p.id = ci.product_id
        WHERE ci.cart_id = :cart_id
        ORDER BY ci.created_at DESC
    ");

    $stmt->execute([
        "cart_id" => $cartId
    ]);

    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $totalQuantity = 0;
    $grandTotal = 0;

    foreach ($items as &$item) {
        $item["cart_item_id"] = (int) $item["cart_item_id"];
        $item["product_id"] = (int) $item["product_id"];
        $item["quantity"] = (int) $item["quantity"];
        $item["price"] = (float) $item["price"];
        $item["stock"] = (int) $item["stock"];
        $item["subtotal"] = (float) $item["subtotal"];

        $totalQuantity += $item["quantity"];
        $grandTotal += $item["subtotal"];
    }

    unset($item);

    // Format data disesuaikan dengan cart-api.js
    echo json_encode([
        "success" => true,
        "message" => "Keranjang berhasil ditampilkan.",
        "cart_id" => $cartId,
        "total_quantity" => $totalQuantity,
        "grand_total" => $grandTotal,
        "data" => $items
    ]);

} catch (PDOException $e) {
    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Terjadi kesalahan saat mengambil data keranjang."
    ]);
}
