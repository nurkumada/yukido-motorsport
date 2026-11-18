
<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

// Validasi login pelanggan
if (
    !isset($_SESSION["user"]["id"]) ||
    ($_SESSION["user"]["role"] ?? "") !== "customer"
) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Silakan login terlebih dahulu."
    ]);
    exit;
}

// Mengambil ID produk pilihan dari frontend
$input = json_decode(file_get_contents("php://input"), true);
$ids = $input["cart_item_ids"] ?? [];

if (!is_array($ids) || empty($ids)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Belum ada produk yang dipilih."
    ]);
    exit;
}

$ids = array_values(array_unique(
    array_filter(
        array_map("intval", $ids),
        fn($id) => $id > 0
    )
));

if (empty($ids)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Produk tidak valid."
    ]);
    exit;
}

try {
    $userId = (int) $_SESSION["user"]["id"];

    // Mencari keranjang aktif
    $stmt = $conn->prepare("
        SELECT id FROM carts
        WHERE user_id = :user_id
        AND status = 'active'
        LIMIT 1
    ");

    $stmt->execute(["user_id" => $userId]);
    $cart = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$cart) {
        throw new Exception("Keranjang tidak ditemukan.");
    }

    // Mengambil produk yang dipilih saja
    $placeholders = implode(",", array_fill(0, count($ids), "?"));

    $sql = "
        SELECT
            ci.id AS cart_item_id,
            ci.product_id,
            ci.quantity,
            p.sku,
            p.name,
            p.price,
            p.stock,
            p.status,
            (
                SELECT pi.image_path
                FROM product_images pi
                WHERE pi.product_id = p.id
                ORDER BY pi.is_primary DESC,
                         pi.sort_order ASC
                LIMIT 1
            ) AS image_path
        FROM cart_items ci
        INNER JOIN products p
            ON p.id = ci.product_id
        WHERE ci.cart_id = ?
        AND ci.id IN ($placeholders)
        ORDER BY ci.created_at DESC
    ";

    $stmt = $conn->prepare($sql);

    $stmt->execute(array_merge(
        [(int) $cart["id"]],
        $ids
    ));

    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($items) !== count($ids)) {
        throw new Exception("Produk tidak ditemukan di keranjang.");
    }

    // Menghitung subtotal
    $subtotal = 0;

    foreach ($items as &$item) {
        $item["cart_item_id"] = (int) $item["cart_item_id"];
        $item["product_id"] = (int) $item["product_id"];
        $item["quantity"] = (int) $item["quantity"];
        $item["price"] = (float) $item["price"];

        $item["subtotal"] =
            $item["price"] * $item["quantity"];

        $subtotal += $item["subtotal"];
    }

    unset($item);

    echo json_encode([
        "success" => true,
        "message" => "Produk berhasil dimuat.",
        "data" => $items,
        "subtotal" => $subtotal
    ]);

} catch (Exception $e) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);

} catch (PDOException $e) {
    error_log($e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Terjadi kesalahan database."
    ]);
}
