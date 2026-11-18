
<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

if (($_SESSION["user"]["role"] ?? "") !== "admin") {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Akses khusus admin."
    ]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Metode request tidak diizinkan."
    ]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$orderId = (int) ($data["order_id"] ?? 0);
$newStatus = trim($data["status"] ?? "");
$note = trim($data["note"] ?? "");

$allowedStatuses = [
    "pending_payment",
    "processing",
    "shipped",
    "completed",
    "cancelled"
];

if (
    $orderId <= 0 ||
    !in_array($newStatus, $allowedStatuses, true)
) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Data status tidak valid."
    ]);
    exit;
}

try {
    $conn->beginTransaction();

    $stmt = $conn->prepare("
        SELECT id, order_status
        FROM orders
        WHERE id = ?
        FOR UPDATE
    ");

    $stmt->execute([$orderId]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        throw new Exception("Pesanan tidak ditemukan.");
    }

    $oldStatus = $order["order_status"];

    if ($oldStatus === $newStatus) {
        throw new Exception("Status pesanan tidak berubah.");
    }

    $update = $conn->prepare("
        UPDATE orders
        SET order_status = ?, updated_at = NOW()
        WHERE id = ?
    ");

    $update->execute([$newStatus, $orderId]);

    $history = $conn->prepare("
        INSERT INTO order_status_history
        (order_id, old_status, new_status, note, changed_by)
        VALUES (?, ?, ?, ?, ?)
    ");

    $history->execute([
        $orderId,
        $oldStatus,
        $newStatus,
        $note !== "" ? $note : "Status diperbarui oleh admin.",
        (int) $_SESSION["user"]["id"]
    ]);

    $conn->commit();

    echo json_encode([
        "success" => true,
        "message" => "Status pesanan berhasil diperbarui."
    ]);

} catch (Throwable $e) {
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }

    error_log($e->getMessage());

    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}
