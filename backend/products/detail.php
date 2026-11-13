
<?php
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

$id = $_GET["id"] ?? null;
$slug = trim($_GET["slug"] ?? "");

if (empty($id) && $slug === "") {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Masukkan ID atau slug produk"
    ]);
    exit;
}

try {
    $sql = "SELECT
                p.*,
                c.name AS category_name,
                b.name AS brand_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            WHERE " . (!empty($id) ? "p.id = :value" : "p.slug = :value") . "
            LIMIT 1";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ":value" => !empty($id) ? $id : $slug
    ]);

    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Produk tidak ditemukan"
        ]);
        exit;
    }

    // Mengambil foto produk
    $imageStmt = $conn->prepare(
        "SELECT id, image_path, alt_text, is_primary, sort_order
         FROM product_images
         WHERE product_id = ?
         ORDER BY is_primary DESC, sort_order ASC"
    );
    $imageStmt->execute([$product["id"]]);
    $product["images"] = $imageStmt->fetchAll(PDO::FETCH_ASSOC);

    // Mengambil video produk
    $videoStmt = $conn->prepare(
        "SELECT id, video_url, video_title, video_type
         FROM product_videos
         WHERE product_id = ? AND is_active = 1"
    );
    $videoStmt->execute([$product["id"]]);
    $product["videos"] = $videoStmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "message" => "Detail produk berhasil diambil",
        "data" => $product
    ], JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Gagal mengambil detail produk"
    ]);
}
?>
