
<?php
header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

// Parameter pencarian
$keyword = trim($_GET["keyword"] ?? "");
$categoryId = $_GET["category_id"] ?? "";
$minPrice = $_GET["min_price"] ?? "";
$maxPrice = $_GET["max_price"] ?? "";

$page = max(1, (int)($_GET["page"] ?? 1));
$limit = min(50, max(1, (int)($_GET["limit"] ?? 12)));
$offset = ($page - 1) * $limit;

// Pilihan pengurutan
$sort = $_GET["sort"] ?? "newest";

$sortOptions = [
    "newest" => "p.id DESC",
    "oldest" => "p.id ASC",
    "price_low" => "p.price ASC",
    "price_high" => "p.price DESC",
    "name" => "p.name ASC"
];

$orderBy = $sortOptions[$sort] ?? $sortOptions["newest"];

try {
    $where = [];
    $params = [];

    // Pencarian nama, SKU, dan deskripsi
    if ($keyword !== "") {
        $where[] = "(
            p.name LIKE :keyword
            OR p.sku LIKE :keyword
            OR p.description LIKE :keyword
        )";

        $params[":keyword"] = "%" . $keyword . "%";
    }

    // Filter kategori
    if ($categoryId !== "") {
        if (!filter_var($categoryId, FILTER_VALIDATE_INT)
            || (int)$categoryId <= 0) {
            throw new InvalidArgumentException("Kategori tidak valid");
        }

        $where[] = "p.category_id = :category_id";
        $params[":category_id"] = (int)$categoryId;
    }

    // Filter harga minimum
    if ($minPrice !== "") {
        if (!is_numeric($minPrice) || $minPrice < 0) {
            throw new InvalidArgumentException("Harga minimum tidak valid");
        }

        $where[] = "p.price >= :min_price";
        $params[":min_price"] = $minPrice;
    }

    // Filter harga maksimum
    if ($maxPrice !== "") {
        if (!is_numeric($maxPrice) || $maxPrice < 0) {
            throw new InvalidArgumentException("Harga maksimum tidak valid");
        }

        $where[] = "p.price <= :max_price";
        $params[":max_price"] = $maxPrice;
    }

    if ($minPrice !== "" && $maxPrice !== ""
        && (float)$minPrice > (float)$maxPrice) {
        throw new InvalidArgumentException(
            "Harga minimum tidak boleh melebihi harga maksimum"
        );
    }

    $whereSql = count($where) > 0
        ? "WHERE " . implode(" AND ", $where)
        : "";

    // Menghitung total produk
    $countSql = "SELECT COUNT(*)
                 FROM products p
                 $whereSql";

    $countStmt = $conn->prepare($countSql);
    $countStmt->execute($params);

    $total = (int)$countStmt->fetchColumn();

    // Mengambil produk
    $sql = "SELECT
                p.id,
                p.sku,
                p.name,
                p.slug,
                p.description,
                p.price,
                p.stock,
                p.warranty_type,
                p.warranty_period_months,
                c.name AS category_name,
                b.name AS brand_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN brands b ON p.brand_id = b.id
            $whereSql
            ORDER BY $orderBy
            LIMIT :limit OFFSET :offset";

    $stmt = $conn->prepare($sql);

    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }

    $stmt->bindValue(":limit", $limit, PDO::PARAM_INT);
    $stmt->bindValue(":offset", $offset, PDO::PARAM_INT);

    $stmt->execute();

    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "success" => true,
        "message" => "Pencarian produk berhasil",
        "pagination" => [
            "page" => $page,
            "limit" => $limit,
            "total" => $total,
            "total_pages" => (int)ceil($total / $limit)
        ],
        "data" => $products
    ], JSON_PRETTY_PRINT);

} catch (InvalidArgumentException $e) {
    http_response_code(400);

    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);

} catch (PDOException $e) {
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Gagal mencari produk"
    ]);
}
?>
