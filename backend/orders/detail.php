
<?php
require_once __DIR__ . '/../config/database.php';

header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Pastikan pengguna sudah login
if (!isset($_SESSION['user']['id'])) {
    http_response_code(401);

    echo json_encode([
        'success' => false,
        'message' => 'Silakan login terlebih dahulu'
    ]);
    exit;
}

// Ambil data pengguna
$userId = (int) $_SESSION['user']['id'];
$isAdmin = ($_SESSION['user']['role'] ?? '') === 'admin';

// Ambil nomor pesanan dari URL
$orderNumber = trim($_GET['order_number'] ?? '');

if ($orderNumber === '') {
    http_response_code(400);

    echo json_encode([
        'success' => false,
        'message' => 'Nomor pesanan tidak ditemukan'
    ]);
    exit;
}

try {
    // =====================================
    // 1. AMBIL DATA PESANAN
    // =====================================

    $sql = "
        SELECT *
        FROM orders
        WHERE order_number = ?
    ";

    $params = [$orderNumber];

    // Pelanggan hanya boleh melihat pesanan miliknya
    if (!$isAdmin) {
        $sql .= " AND user_id = ?";
        $params[] = $userId;
    }

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        http_response_code(404);

        echo json_encode([
            'success' => false,
            'message' => 'Pesanan tidak ditemukan'
        ]);
        exit;
    }

    $orderId = (int) $order['id'];


    // =====================================
    // 2. AMBIL DETAIL PRODUK PESANAN
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

    $itemStmt->execute([$orderId]);

    $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);


    // =====================================
    // 3. AMBIL RIWAYAT STATUS PESANAN
    // =====================================

    $historyStmt = $conn->prepare("
        SELECT
            id,
            order_id,
            old_status,
            new_status,
            note,
            changed_by,
            created_at
        FROM order_status_history
        WHERE order_id = ?
        ORDER BY created_at ASC
    ");

    $historyStmt->execute([$orderId]);

    $history = $historyStmt->fetchAll(PDO::FETCH_ASSOC);


    // =====================================
    // 4. AMBIL RIWAYAT PEMBAYARAN
    // =====================================

    $paymentStmt = $conn->prepare("
        SELECT
            id,
            order_id,
            payment_reference,
            provider,
            method,
            payment_channel,
            amount,
            payment_status,
            paid_at,
            expires_at,
            created_at,
            updated_at
        FROM payments
        WHERE order_id = ?
        ORDER BY created_at DESC
    ");

    $paymentStmt->execute([$orderId]);

    $payments = $paymentStmt->fetchAll(PDO::FETCH_ASSOC);


    // =====================================
    // 5. KIRIM RESPONSE JSON
    // =====================================

    echo json_encode([
        'success' => true,
        'order' => $order,
        'items' => $items,
        'history' => $history,
        'payments' => $payments
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan database',
        'error' => $e->getMessage()
    ]);

} catch (Throwable $e) {

    http_response_code(500);

    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan pada server',
        'error' => $e->getMessage()
    ]);
}
