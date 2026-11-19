<?php
session_start();
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

$userId = $_SESSION["user"]["id"] ?? $_SESSION["user_id"] ?? null;

if (!$userId) {
    http_response_code(401);
    echo json_encode([
        "success" => false,
        "message" => "Silakan login terlebih dahulu.",
        "data" => []
    ]);
    exit;
}

$userId  = (int) $userId;
$isAdmin = ($_SESSION["user"]["role"] ?? $_SESSION["role"] ?? "") === "admin";

try {
    $whereClause = $isAdmin ? "" : "WHERE o.user_id = :user_id";

    $sql = "
        SELECT
            o.*,
            COUNT(DISTINCT oi.id) AS total_items,
            COALESCE(SUM(oi.quantity), 0) AS total_qty,
            p.payment_reference,
            p.method AS payment_method,
            p.payment_channel,
            p.payment_status,
            p.paid_at

        FROM orders o

        LEFT JOIN order_items oi
            ON oi.order_id = o.id

        LEFT JOIN payments p
            ON p.id = (
                SELECT p2.id
                FROM payments p2
                WHERE p2.order_id = o.id
                ORDER BY p2.created_at DESC, p2.id DESC
                LIMIT 1
            )

        {$whereClause}
        GROUP BY o.id
        ORDER BY o.created_at DESC
    ";

    $stmt = $conn->prepare($sql);

    if (!$isAdmin) {
        $stmt->bindValue(":user_id", $userId, PDO::PARAM_INT);
    }

    $stmt->execute();
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "data" => $orders
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    error_log($e->getMessage());

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Gagal mengambil daftar pesanan.",
        "data" => []
    ]);
}