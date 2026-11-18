
<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

// =====================================
// 1. VALIDASI LOGIN
// =====================================

if (!isset($_SESSION["user"]["id"])) {
    http_response_code(401);

    echo json_encode([
        "success" => false,
        "message" => "Silakan login terlebih dahulu."
    ]);

    exit;
}

$userId = (int) $_SESSION["user"]["id"];
$isAdmin = ($_SESSION["user"]["role"] ?? "") === "admin";

// =====================================
// 2. AMBIL NOMOR PESANAN
// =====================================

$orderNumber = trim($_GET["order"] ?? "");

if ($orderNumber === "") {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Nomor pesanan tidak ditemukan."
    ]);

    exit;
}

try {

    // =====================================
    // 3. AMBIL DATA PESANAN DAN PEMBAYARAN
    // =====================================

    $sql = "
        SELECT
            o.*,

            p.payment_reference,
            p.provider,
            p.method,
            p.payment_channel,
            p.amount,
            p.payment_status,
            p.paid_at,
            p.expires_at,
            p.provider_response

        FROM orders o

        LEFT JOIN payments p
            ON p.id = (
                SELECT p2.id
                FROM payments p2
                WHERE p2.order_id = o.id
                ORDER BY p2.created_at DESC, p2.id DESC
                LIMIT 1
            )

        WHERE o.order_number = ?
    ";

    $params = [$orderNumber];

    // Pelanggan hanya boleh melihat pesanan miliknya
    if (!$isAdmin) {
        $sql .= " AND o.user_id = ?";
        $params[] = $userId;
    }

    $sql .= " LIMIT 1";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        http_response_code(404);

        echo json_encode([
            "success" => false,
            "message" => "Pesanan tidak ditemukan."
        ]);

        exit;
    }

    // =====================================
    // 4. DECODE PROVIDER RESPONSE
    // =====================================

    $providerResponse = [];

    if (!empty($order["provider_response"])) {
        $decoded = json_decode(
            $order["provider_response"],
            true
        );

        if (is_array($decoded)) {
            $providerResponse = $decoded;
        }
    }

    $order["provider_response"] = $providerResponse;

    // =====================================
    // 5. AMBIL DETAIL PRODUK
    // =====================================

    $itemStmt = $conn->prepare("
        SELECT
            id,
            order_id,
            product_id,
            sku_snapshot,
            product_name_snapshot,
            unit_price,
            quantity,
            line_total,
            warranty_type,
            warranty_period_months

        FROM order_items

        WHERE order_id = ?

        ORDER BY id ASC
    ");

    $itemStmt->execute([(int) $order["id"]]);

    $order["items"] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);

    // =====================================
    // 6. FORMAT DATA PEMBAYARAN
    // =====================================

    $order["amount"] = (float) ($order["amount"] ?? 0);
    $order["grand_total"] = (float) $order["grand_total"];
    $order["shipping_cost"] = (float) $order["shipping_cost"];

    // =====================================
    // 7. KIRIM JSON
    // =====================================

    echo json_encode([
        "success" => true,
        "order" => $order
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    error_log("Checkout detail error: " . $e->getMessage());

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Gagal mengambil detail pesanan."
    ]);
}
