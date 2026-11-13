
<?php
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

// Hanya menerima POST
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);

    echo json_encode([
        "success" => false,
        "message" => "Gunakan metode POST"
    ]);
    exit;
}

// Membaca data JSON
$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Format data tidak valid"
    ]);
    exit;
}

// Mengambil data
$sku = trim($data["sku"] ?? "");
$name = trim($data["name"] ?? "");
$description = trim($data["description"] ?? "");
$price = $data["price"] ?? null;
$stock = $data["stock"] ?? 0;
$weight = $data["weight_gram"] ?? 0;

$categoryId = $data["category_id"] ?? null;
$brandId = $data["brand_id"] ?? null;

$warrantyType = $data["warranty_type"] ?? "lifetime";
$warrantyMonths = $data["warranty_period_months"] ?? null;

// Validasi data
if ($sku === "" || $name === "" || !is_numeric($price)
    || $price < 0 || !is_numeric($stock) || $stock < 0
    || !is_numeric($weight) || $weight < 0) {

    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "SKU, nama, harga, stok, dan berat harus valid"
    ]);
    exit;
}

if (!in_array($warrantyType, ["lifetime", "limited", "none"])) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => "Jenis garansi tidak valid"
    ]);
    exit;
}

if ($warrantyType === "limited") {
    if (!is_numeric($warrantyMonths) ||
        (int)$warrantyMonths <= 0) {

        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Masa garansi harus lebih dari 0 bulan"
        ]);
        exit;
    }
} else {
    $warrantyMonths = null;
}

// Membuat slug dari nama produk
$slug = strtolower(trim($name));
$slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
$slug = trim($slug, '-');

try {
    $sql = "INSERT INTO products (
        category_id,
        brand_id,
        sku,
        name,
        slug,
        description,
        price,
        stock,
        weight_gram,
        warranty_type,
        warranty_period_months
    ) VALUES (
        :category_id,
        :brand_id,
        :sku,
        :name,
        :slug,
        :description,
        :price,
        :stock,
        :weight,
        :warranty_type,
        :warranty_months
    )";

    $stmt = $conn->prepare($sql);

    $stmt->execute([
        ":category_id" => $categoryId ?: null,
        ":brand_id" => $brandId ?: null,
        ":sku" => $sku,
        ":name" => $name,
        ":slug" => $slug,
        ":description" => $description,
        ":price" => $price,
        ":stock" => $stock,
        ":weight" => $weight,
        ":warranty_type" => $warrantyType,
        ":warranty_months" => $warrantyMonths
    ]);

    http_response_code(201);

    echo json_encode([
        "success" => true,
        "message" => "Produk berhasil ditambahkan",
        "product_id" => $conn->lastInsertId()
    ]);

} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Gagal menambahkan produk. Periksa SKU, slug, kategori, dan merek."
    ]);
}
?>
