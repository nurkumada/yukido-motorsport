
<?php
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

try {
    $sql = "SELECT
                p.id,
                p.category_id,
                p.sku,
                p.name,
                p.slug,
                p.description,
                p.price,
                p.stock,
                p.weight_gram,
                p.warranty_type,
                p.warranty_period_months,
                p.created_at,
                c.name AS category_name,
                (
                    SELECT pi.image_path
                    FROM product_images pi
                    WHERE pi.product_id = p.id
                    ORDER BY pi.is_primary DESC, pi.sort_order ASC
                    LIMIT 1
                ) AS image_path
            FROM products p
            LEFT JOIN categories c ON c.id = p.category_id
            WHERE p.status = 'active'
            ORDER BY p.created_at DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "message" => "Data produk berhasil diambil",
        "total" => count($products),
        "data" => $products
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Gagal mengambil data produk"
    ]);
}
?>
