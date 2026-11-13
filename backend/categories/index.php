
<?php
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

try {
    $sql = "
    SELECT
        c.id,
        c.name,
        c.slug,
        c.image_path,
        COUNT(p.id) AS total_products
    FROM categories c
    LEFT JOIN products p
        ON p.category_id = c.id
        AND p.status = 'active'
    GROUP BY c.id, c.name, c.slug, c.image_path
    ORDER BY c.name ASC
";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "total" => count($categories),
        "data" => $categories
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Gagal mengambil kategori"
    ]);
}
?>
