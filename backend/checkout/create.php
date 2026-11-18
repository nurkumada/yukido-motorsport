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
$data = json_decode(file_get_contents("php://input"), true);

$cartItemIds     = $data["cart_item_ids"] ?? [];
$recipientName   = trim($data["recipient_name"] ?? "");
$recipientPhone  = trim($data["recipient_phone"] ?? "");
$recipientEmail  = trim($data["recipient_email"] ?? "");
$shippingAddress = trim($data["shipping_address"] ?? "");
$province        = trim($data["province"] ?? "");
$city            = trim($data["city"] ?? "");
$district        = trim($data["district"] ?? "");
$postalCode      = trim($data["postal_code"] ?? "");
$courier         = trim($data["courier"] ?? "JNE Trucking");
$shippingCost    = (float) ($data["shipping_cost"] ?? 0);
$discount        = (float) ($data["discount"] ?? 0);
$notes           = trim($data["notes"] ?? "");

// Validasi enum method sesuai tabel `payments` di yukido_db
$allowedMethods  = ["virtual_account", "qris", "ewallet", "debit_card", "credit_card"];
$method          = in_array($data["method"] ?? "", $allowedMethods) ? $data["method"] : "virtual_account";
$paymentChannel  = trim($data["payment_channel"] ?? "BCA");

if (empty($cartItemIds) || !$recipientName || !$recipientPhone || !$shippingAddress) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Nama penerima, telepon, alamat lengkap, dan produk wajib diisi."]);
    exit;
}

try {
    $conn->beginTransaction();

    $cartItemIds = array_map("intval", $cartItemIds);
    $placeholders = implode(",", array_fill(0, count($cartItemIds), "?"));

    $stmt = $conn->prepare("
        SELECT
            ci.id AS cart_item_id,
            ci.quantity,
            p.id AS product_id,
            p.sku,
            p.name,
            p.price,
            p.stock,
            p.warranty_type,
            p.warranty_period_months
        FROM cart_items ci
        INNER JOIN carts c ON c.id = ci.cart_id
        INNER JOIN products p ON p.id = ci.product_id
        WHERE c.user_id = ? AND c.status = 'active' AND ci.id IN ($placeholders)
        FOR UPDATE
    ");
    $stmt->execute(array_merge([$userId], $cartItemIds));
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($items)) {
        throw new Exception("Produk keranjang tidak ditemukan atau sudah di-checkout.");
    }

    $subtotal = 0;
    foreach ($items as $item) {
        if ((int)$item["stock"] < (int)$item["quantity"]) {
            throw new Exception("Stok '{$item['name']}' tidak mencukupi (tersisa {$item['stock']}).");
        }
        $subtotal += ((float)$item["price"] * (int)$item["quantity"]);
    }

    $grandTotal  = max(0, ($subtotal + $shippingCost) - $discount);
    $orderNumber = "YKD-" . date("Ymd") . "-" . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));

    // 1. Simpan ke tabel `orders`
    $stmtOrder = $conn->prepare("
        INSERT INTO orders (
            order_number, user_id, recipient_name, recipient_phone, recipient_email,
            shipping_address, province, city, district, postal_code,
            courier, shipping_cost, subtotal, discount, grand_total, order_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', ?)
    ");
    $stmtOrder->execute([
        $orderNumber, $userId, $recipientName, $recipientPhone, $recipientEmail,
        $shippingAddress, $province, $city, $district, $postalCode,
        $courier, $shippingCost, $subtotal, $discount, $grandTotal, $notes
    ]);
    $orderId = (int) $conn->lastInsertId();

    // 2. Simpan ke tabel `order_items` & kurangi stok `products`
    $stmtItem = $conn->prepare("
        INSERT INTO order_items (
            order_id, product_id, sku_snapshot, product_name_snapshot,
            unit_price, quantity, line_total, warranty_type, warranty_period_months
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmtStock = $conn->prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

    foreach ($items as $item) {
        $lineTotal = (float)$item["price"] * (int)$item["quantity"];
        $stmtItem->execute([
            $orderId,
            $item["product_id"],
            $item["sku"],
            $item["name"],
            $item["price"],
            $item["quantity"],
            $lineTotal,
            $item["warranty_type"],
            $item["warranty_period_months"]
        ]);
        $stmtStock->execute([$item["quantity"], $item["product_id"]]);
    }

    // 3. Siapkan detail pembayaran & simpan ke tabel `payments`
    $paymentRef = "PAY-" . date("YmdHis") . "-" . random_int(100, 999);
    $expiresAt  = date("Y-m-d H:i:s", strtotime("+2 hours"));
    $cleanPhone = preg_replace("/\D/", "", $recipientPhone) ?: "81234567890";

    $providerData = [
        "channel" => $paymentChannel,
        "account_name" => "PT YUKIDO POWER TEKNIK"
    ];

    if ($method === "virtual_account") {
        $prefixes = [
            "BCA" => "8271",
            "MANDIRI" => "8902",
            "BNI" => "8241",
            "BRI" => "2621",
            "PERMATA" => "8528"
        ];
        $prefix = $prefixes[strtoupper($paymentChannel)] ?? "8800";
        $providerData["va_number"] = $prefix . substr(str_pad($cleanPhone, 12, "0", STR_PAD_RIGHT), 0, 12);
    } elseif ($method === "qris") {
        $providerData["qris_payload"] = "00020101021226580014ID.YUKIDO.WWW0118936005030000089824520455335303360540" . (int)$grandTotal . "5802ID5916YUKIDO MOTORSPORT6304" . strtoupper(substr(md5($orderNumber), 0, 4));
    } elseif ($method === "ewallet") {
        $providerData["ewallet_phone"] = trim($data["ewallet_phone"] ?? $recipientPhone);
        $providerData["payment_code"] = strtoupper(substr($paymentChannel, 0, 3)) . "-" . random_int(100000, 999999);
    } elseif ($method === "debit_card" || $method === "credit_card") {
        $rawCard = preg_replace("/\D/", "", $data["card_number"] ?? "");
        $providerData["card_masked"] = "**** **** **** " . (strlen($rawCard) >= 4 ? substr($rawCard, -4) : "4242");
        $providerData["card_holder"] = strtoupper(trim($data["card_holder"] ?? $recipientName));
    }

    $stmtPay = $conn->prepare("
        INSERT INTO payments (
            order_id, payment_reference, provider, method, payment_channel,
            amount, payment_status, expires_at, provider_response
        ) VALUES (?, ?, 'YukidoPay Sandbox', ?, ?, ?, 'pending', ?, ?)
    ");
    $stmtPay->execute([
        $orderId,
        $paymentRef,
        $method,
        $paymentChannel,
        $grandTotal,
        $expiresAt,
        json_encode($providerData)
    ]);

    // 4. Hapus item yang sudah di-checkout dari `cart_items`
    $stmtDel = $conn->prepare("DELETE FROM cart_items WHERE id IN ($placeholders)");
    $stmtDel->execute($cartItemIds);

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Pesanan berhasil dibuat.",
        "order_number" => $orderNumber,
        "grand_total" => $grandTotal,
        "expires_at" => $expiresAt
    ]);
} catch (Exception $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    http_response_code(400);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}