
<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

function sendResponse($success, $message, $status = 200) {
    http_response_code($status);
    echo json_encode([
        "success" => $success,
        "message" => $message
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Validasi login
if (!isset($_SESSION["user"]["id"])) {
    sendResponse(false, "Silakan login terlebih dahulu.", 401);
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    sendResponse(false, "Metode request tidak diizinkan.", 405);
}

$userId = (int) $_SESSION["user"]["id"];
$isAdmin = ($_SESSION["user"]["role"] ?? "") === "admin";

$data = json_decode(file_get_contents("php://input"), true);
$orderNumber = trim($data["order_number"] ?? "");

if ($orderNumber === "") {
    sendResponse(false, "Nomor pesanan tidak ditemukan.", 400);
}

try {
    $conn->beginTransaction();

    // Ambil pesanan
    $sql = "
        SELECT *
        FROM orders
        WHERE order_number = ?
    ";

    $params = [$orderNumber];

    if (!$isAdmin) {
        $sql .= " AND user_id = ?";
        $params[] = $userId;
    }

    $sql .= " LIMIT 1 FOR UPDATE";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        $conn->rollBack();
        sendResponse(false, "Pesanan tidak ditemukan.", 404);
    }

    $orderId = (int) $order["id"];

    // Ambil pembayaran terbaru
    $paymentStmt = $conn->prepare("
        SELECT *
        FROM payments
        WHERE order_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 1
        FOR UPDATE
    ");

    $paymentStmt->execute([$orderId]);
    $payment = $paymentStmt->fetch(PDO::FETCH_ASSOC);

    if (!$payment) {
        $conn->rollBack();
        sendResponse(false, "Data pembayaran tidak ditemukan.", 404);
    }

    // Jika sudah lunas, jangan proses ulang
    if ($payment["payment_status"] === "settlement") {
        $conn->commit();
        sendResponse(true, "Pembayaran sudah dikonfirmasi sebelumnya.");
    }

    // Hanya pembayaran pending yang boleh disimulasikan
    if ($payment["payment_status"] !== "pending") {
        $conn->rollBack();
        sendResponse(false, "Status pembayaran tidak dapat dikonfirmasi.", 400);
    }

    // Periksa batas waktu pembayaran
    if (
        !empty($payment["expires_at"]) &&
        strtotime($payment["expires_at"]) < time()
    ) {
        $conn->rollBack();
        sendResponse(false, "Batas waktu pembayaran sudah habis.", 400);
    }

    $oldStatus = $order["order_status"];

    // Pastikan pesanan memang menunggu pembayaran
    if ($oldStatus !== "pending_payment") {
        $conn->rollBack();
        sendResponse(false, "Status pesanan tidak dapat dikonfirmasi.", 400);
    }

    // Update pembayaran
    $updatePayment = $conn->prepare("
        UPDATE payments
        SET
            payment_status = 'settlement',
            paid_at = NOW(),
            updated_at = NOW()
        WHERE id = ?
    ");

    $updatePayment->execute([(int) $payment["id"]]);

    // Update pesanan menjadi diproses
    $updateOrder = $conn->prepare("
        UPDATE orders
        SET
            order_status = 'processing',
            updated_at = NOW()
        WHERE id = ?
    ");

    $updateOrder->execute([$orderId]);

    // Catat riwayat perubahan status
    $historyStmt = $conn->prepare("
        INSERT INTO order_status_history (
            order_id,
            old_status,
            new_status,
            note,
            changed_by
        ) VALUES (?, ?, ?, ?, ?)
    ");

    $historyStmt->execute([
        $orderId,
        $oldStatus,
        "processing",
        "Pembayaran berhasil dikonfirmasi.",
        $userId
    ]);

    $conn->commit();

    sendResponse(
        true,
        "Pembayaran berhasil dikonfirmasi. Pesanan sekarang sedang diproses."
    );

} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log("Confirm payment error: " . $e->getMessage());

    sendResponse(
        false,
        "Terjadi kesalahan saat mengonfirmasi pembayaran. Periksa log PHP.",
        500
    );
}
