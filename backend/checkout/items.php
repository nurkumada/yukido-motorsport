<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . "/../config/database.php";

if (!isset($_SESSION["user"]["id"])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Silakan login terlebih dahulu."]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Metode request tidak diizinkan."]);
    exit;
}

$userId = (int) $_SESSION["user"]["id"];
$input = json_decode(file_get_contents("php://input"), true);
$selectedIds = $input["cart_item_ids"] ?? [];

if (empty($selectedIds) || !is_array($selectedIds)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Tidak ada produk yang dipilih dari keranjang."]);
    exit;
}

try {
    // Ambil data profil user untuk auto-fill form penerima
    $stmtUser = $conn->prepare("SELECT full_name, email, phone FROM users WHERE id = ? LIMIT 1");
    $stmtUser->execute([$userId]);
    $userProfile = $stmtUser->fetch(PDO::FETCH_ASSOC) ?: [];

    // Ambil produk yang dipilih saja dari keranjang aktif
    $selectedIds = array_map("intval", $selectedIds);
    $placeholders = implode(",", array_fill(0, count($selectedIds), "?"));

    $sql = "
        SELECT
            ci.id AS cart_item_id,
            ci.product_id,
            ci.quantity,
            p.sku,
            p.name,
            p.price,
            p.stock,
            p.weight_gram,
            p.warranty_type,
            p.warranty_period_months,
            (SELECT image_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) AS image_path
        FROM cart_items ci
        INNER JOIN carts c ON c.id = ci.cart_id
        INNER JOIN products p ON p.id = ci.product_id
        WHERE c.user_id = ?
          AND c.status = 'active'
          AND ci.id IN ($placeholders)
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute(array_merge([$userId], $selectedIds));
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $subtotal = 0;
    $totalQty = 0;
    $totalWeight = 0;

    foreach ($items as &$item) {
        $item["cart_item_id"] = (int) $item["cart_item_id"];
        $item["product_id"] = (int) $item["product_id"];
        $item["quantity"] = (int) $item["quantity"];
        $item["price"] = (float) $item["price"];
        $item["line_total"] = $item["price"] * $item["quantity"];

        $subtotal += $item["line_total"];
        $totalQty += $item["quantity"];
        $totalWeight += ((int) $item["weight_gram"] * $item["quantity"]);
    }
    unset($item);

    echo json_encode([
        "success" => true,
        "user" => $userProfile,
        "items" => $items,
        "subtotal" => $subtotal,
        "total_qty" => $totalQty,
        "total_weight_gram" => $totalWeight
    ]);
} catch (PDOException $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Gagal memuat data checkout."]);
}