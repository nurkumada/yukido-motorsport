
<?php
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

// Hanya menerima PUT
if ($_SERVER["REQUEST_METHOD"] !== "PUT") {
    http_response_code(405);
    echo json_encode([
        "success" => false,
        "message" => "Gunakan metode PUT"
    ]);
    exit;
}

// Ambil data JSON
$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Format JSON tidak valid"
    ]);
    exit;
}

// Ambil data produk
$id = $data["id"] ?? null;
$sku = trim($data["sku"] ?? "");
$name = trim($data["name"] ?? "");
$description = trim($data["description"] ?? "");
$price = $data["price"] ?? null;
$stock = $data["stock"] ?? null;
$weight = $data["weight_gram"] ?? null;

$categoryId = $data["category_id"] ?? null;
$brandId = $data["brand_id"] ?? null;

$warrantyType = $data["warranty_type"] ?? "lifetime";
$warrantyMonths = $data["warranty_period_months"] ?? null;

// Validasi
if (
    !filter_var($id, FILTER_VALIDATE_INT) || $id <= 0 ||
    $sku === "" || $name === "" ||
    !is_numeric($price) || $price < 0 ||
    !is_numeric($stock) || $stock < 0 ||
    !is_numeric($weight) || $weight < 0
) {
    http_response_code(400);
    echo json_encode([
        "success" => false,
        "message" => "Data produk tidak lengkap atau tidak valid"
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
    if (!is_numeric($warrantyMonths) || (int)$warrantyMonths <= 0) {
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

// Membuat slug
$slug = strtolower(trim($name));
$slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
$slug = trim($slug, '-');

try {
    $sql = "UPDATE products SET
        category_id = :category_id,
        brand_id = :brand_id,
        sku = :sku,
        name = :name,
        slug = :slug,
        description = :description,
        price = :price,
        stock = :stock,
        weight_gram = :weight,
        warranty_type = :warranty_type,
        warranty_period_months = :warranty_months
        WHERE id = :id";

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
        ":warranty_months" => $warrantyMonths,
        ":id" => $id
    ]);

    if ($stmt->rowCount() === 0) {
        $check = $conn->prepare(
            "SELECT id FROM products WHERE id = ?"
        );
        $check->execute([$id]);

        if (!$check->fetch()) {
            http_response_code(404);
            echo json_encode([
                "success" => false,
                "message" => "Produk tidak ditemukan"
            ]);
            exit;
        }
    }

    echo json_encode([
        "success" => true,
        "message" => "Produk berhasil diperbarui"
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Gagal memperbarui produk. Periksa SKU dan data terkait."
    ]);
}
?>
