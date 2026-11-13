
<?php
session_start();

if (
    !isset($_SESSION['user']) ||
    $_SESSION['user']['role'] !== 'admin'
) {
    header("Location: ../../frontend/login.html");
    exit;
}

require_once __DIR__ . "/../config/database.php";

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if (!$id || $id < 1) {
    die("ID produk tidak valid.");
}

// Mengambil data produk
$stmt = $conn->prepare("
    SELECT *
    FROM products
    WHERE id = ?
    LIMIT 1
");
$stmt->execute([$id]);
$product = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$product) {
    die("Produk tidak ditemukan.");
}

// Mengambil kategori dan brand
$categories = $conn->query("
    SELECT id, name FROM categories ORDER BY name ASC
")->fetchAll(PDO::FETCH_ASSOC);

$brands = $conn->query("
    SELECT id, name FROM brands ORDER BY name ASC
")->fetchAll(PDO::FETCH_ASSOC);

// Mengambil foto utama produk
$imageStmt = $conn->prepare("
    SELECT *
    FROM product_images
    WHERE product_id = ?
    ORDER BY is_primary DESC, sort_order ASC, id ASC
    LIMIT 1
");
$imageStmt->execute([$id]);
$currentImage = $imageStmt->fetch(PDO::FETCH_ASSOC);

$errors = [];

$form = [
    'sku' => $product['sku'],
    'name' => $product['name'],
    'category_id' => $product['category_id'],
    'brand_id' => $product['brand_id'],
    'price' => $product['price'],
    'stock' => $product['stock'],
    'weight_gram' => $product['weight_gram'],
    'description' => $product['description'],
    'status' => $product['status'],
    'warranty_type' => $product['warranty_type'],
    'warranty_period_months' => $product['warranty_period_months']
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // Mengambil data form
    foreach ($form as $key => $value) {
        if (isset($_POST[$key]) && is_string($_POST[$key])) {
            $form[$key] = trim($_POST[$key]);
        }
    }

    // Validasi CSRF
    if (
        !isset($_POST['csrf_token']) ||
        !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])
    ) {
        $errors[] = "Permintaan tidak valid. Silakan muat ulang halaman.";
    }

    // Validasi input
    if ($form['sku'] === '') {
        $errors[] = "SKU produk wajib diisi.";
    }

    if ($form['name'] === '') {
        $errors[] = "Nama produk wajib diisi.";
    }

    if (
        !is_numeric($form['price']) ||
        (float)$form['price'] < 0
    ) {
        $errors[] = "Harga harus berupa angka minimal 0.";
    }

    if (
        filter_var($form['stock'], FILTER_VALIDATE_INT) === false ||
        (int)$form['stock'] < 0
    ) {
        $errors[] = "Stok harus berupa bilangan bulat minimal 0.";
    }

    if (
        $form['weight_gram'] !== '' &&
        (
            filter_var($form['weight_gram'], FILTER_VALIDATE_INT) === false ||
            (int)$form['weight_gram'] < 0
        )
    ) {
        $errors[] = "Berat harus berupa bilangan bulat minimal 0.";
    }

    if (!in_array($form['status'], ['active', 'inactive', 'draft'], true)) {
        $errors[] = "Status produk tidak valid.";
    }

    if (!in_array($form['warranty_type'], ['lifetime', 'limited', 'none'], true)) {
        $errors[] = "Jenis garansi tidak valid.";
    }

    if (
        $form['warranty_type'] === 'limited' &&
        (
            filter_var($form['warranty_period_months'], FILTER_VALIDATE_INT) === false ||
            (int)$form['warranty_period_months'] < 1
        )
    ) {
        $errors[] = "Periode garansi minimal 1 bulan.";
    }

    // Validasi kategori
    $categoryCheck = $conn->prepare(
        "SELECT COUNT(*) FROM categories WHERE id = ?"
    );
    $categoryCheck->execute([(int)$form['category_id']]);

    if (!$categoryCheck->fetchColumn()) {
        $errors[] = "Kategori tidak valid.";
    }

    // Validasi brand
    $brandCheck = $conn->prepare(
        "SELECT COUNT(*) FROM brands WHERE id = ?"
    );
    $brandCheck->execute([(int)$form['brand_id']]);

    if (!$brandCheck->fetchColumn()) {
        $errors[] = "Brand tidak valid.";
    }

    // Validasi SKU tidak digunakan produk lain
    $skuCheck = $conn->prepare("
        SELECT COUNT(*)
        FROM products
        WHERE sku = ? AND id != ?
    ");
    $skuCheck->execute([$form['sku'], $id]);

    if ($skuCheck->fetchColumn() > 0) {
        $errors[] = "SKU sudah digunakan produk lain.";
    }

    // Validasi foto baru
    $image = $_FILES['product_image'] ?? null;
    $imageExtension = null;

    if ($image && $image['error'] !== UPLOAD_ERR_NO_FILE) {
        if ($image['error'] !== UPLOAD_ERR_OK) {
            $errors[] = "Upload foto gagal.";
        } elseif ($image['size'] > 5 * 1024 * 1024) {
            $errors[] = "Ukuran foto maksimal 5 MB.";
        } else {
            $imageInfo = getimagesize($image['tmp_name']);

            if ($imageInfo === false) {
                $errors[] = "File harus berupa gambar yang valid.";
            } else {
                $allowedTypes = [
                    'image/jpeg' => 'jpg',
                    'image/png' => 'png',
                    'image/webp' => 'webp'
                ];

                if (!isset($allowedTypes[$imageInfo['mime']])) {
                    $errors[] = "Format foto harus JPG, PNG, atau WEBP.";
                } else {
                    $imageExtension = $allowedTypes[$imageInfo['mime']];
                }
            }
        }
    }

    // Simpan perubahan
    if (empty($errors)) {
        $uploadDirectory = __DIR__ . "/../../frontend/uploads/products";
        $newFilePath = null;

        try {
            $slugBase = strtolower(trim($form['name']));
            $slugBase = preg_replace('/[^a-z0-9]+/', '-', $slugBase);
            $slugBase = trim($slugBase, '-');

            $slug = $slugBase . '-' . strtolower(bin2hex(random_bytes(3)));

            $conn->beginTransaction();

            $update = $conn->prepare("
                UPDATE products SET
                    category_id = :category_id,
                    brand_id = :brand_id,
                    sku = :sku,
                    name = :name,
                    slug = :slug,
                    description = :description,
                    price = :price,
                    stock = :stock,
                    weight_gram = :weight_gram,
                    status = :status,
                    warranty_type = :warranty_type,
                    warranty_period_months = :warranty_period_months
                WHERE id = :id
            ");

            $update->execute([
                'category_id' => (int)$form['category_id'],
                'brand_id' => (int)$form['brand_id'],
                'sku' => $form['sku'],
                'name' => $form['name'],
                'slug' => $slug,
                'description' => $form['description'],
                'price' => (float)$form['price'],
                'stock' => (int)$form['stock'],
                'weight_gram' => $form['weight_gram'] === ''
                    ? 0
                    : (int)$form['weight_gram'],
                'status' => $form['status'],
                'warranty_type' => $form['warranty_type'],
                'warranty_period_months' =>
                    $form['warranty_type'] === 'limited'
                        ? (int)$form['warranty_period_months']
                        : null,
                'id' => $id
            ]);
// Menyimpan lokasi foto lama
$oldImagePath = $currentImage['image_path'] ?? null;

            // Jika admin mengunggah foto baru
            if ($image && $image['error'] === UPLOAD_ERR_OK) {

                if (
                    !is_dir($uploadDirectory) &&
                    !mkdir($uploadDirectory, 0755, true)
                ) {
                    throw new Exception("Folder upload tidak dapat dibuat.");
                }

                $fileName = 'product_' . $id . '_' .
                    bin2hex(random_bytes(8)) . '.' . $imageExtension;

                $newFilePath = $uploadDirectory . '/' . $fileName;

                if (!move_uploaded_file($image['tmp_name'], $newFilePath)) {
                    throw new Exception("Foto baru gagal disimpan.");
                }

                $imagePath = 'uploads/products/' . $fileName;

                $columns = $conn->query(
                    "SHOW COLUMNS FROM product_images"
                )->fetchAll(PDO::FETCH_COLUMN);

                $productIdColumn = in_array('product_id', $columns, true)
                    ? 'product_id'
                    : null;

                $pathColumn = null;

                foreach (['image_path', 'image_url', 'file_path', 'path'] as $candidate) {
                    if (in_array($candidate, $columns, true)) {
                        $pathColumn = $candidate;
                        break;
                    }
                }

                if (!$productIdColumn || !$pathColumn) {
                    throw new Exception("Kolom tabel product_images tidak dikenali.");
                }

                // Menonaktifkan status foto utama yang lama
                if (in_array('is_primary', $columns, true)) {
                    $reset = $conn->prepare("
                        UPDATE product_images
                        SET is_primary = 0
                        WHERE product_id = ?
                    ");
                    $reset->execute([$id]);
                }

                // Memeriksa apakah produk sudah memiliki foto
                $existingImageStmt = $conn->prepare("
                    SELECT id
                    FROM product_images
                    WHERE product_id = ?
                    ORDER BY is_primary DESC, sort_order ASC, id ASC
                    LIMIT 1
                ");
                $existingImageStmt->execute([$id]);
                $existingImageId = $existingImageStmt->fetchColumn();

                if ($existingImageId) {
                    // Mengganti foto yang sudah ada
                    $setParts = ["`$pathColumn` = ?"];
                    $values = [$imagePath];

                    if (in_array('is_primary', $columns, true)) {
                        $setParts[] = "is_primary = 1";
                    }

                    if (in_array('alt_text', $columns, true)) {
                        $setParts[] = "alt_text = ?";
                        $values[] = $form['name'];
                    }

                    $values[] = $existingImageId;

                    $imageUpdate = $conn->prepare("
                        UPDATE product_images
                        SET " . implode(', ', $setParts) . "
                        WHERE id = ?
                    ");
                    $imageUpdate->execute($values);

                } else {
                    // Menambahkan foto jika belum ada
                    $insertColumns = [$productIdColumn, $pathColumn];
                    $insertValues = [$id, $imagePath];

                    if (in_array('is_primary', $columns, true)) {
                        $insertColumns[] = 'is_primary';
                        $insertValues[] = 1;
                    }

                    if (in_array('sort_order', $columns, true)) {
                        $insertColumns[] = 'sort_order';
                        $insertValues[] = 1;
                    }

                    if (in_array('alt_text', $columns, true)) {
                        $insertColumns[] = 'alt_text';
                        $insertValues[] = $form['name'];
                    }

                    $quotedColumns = array_map(
                        fn($column) => "`$column`",
                        $insertColumns
                    );

                    $placeholders = implode(
                        ', ',
                        array_fill(0, count($insertValues), '?')
                    );

                    $imageInsert = $conn->prepare(
                        "INSERT INTO product_images (" .
                        implode(', ', $quotedColumns) .
                        ") VALUES ($placeholders)"
                    );

                    $imageInsert->execute($insertValues);
                }
            }

           $conn->commit();

// Hapus foto lama setelah database berhasil diperbarui
if (
    !empty($oldImagePath) &&
    !empty($imagePath) &&
    $oldImagePath !== $imagePath
) {
    $oldImagePath = str_replace('\\', '/', $oldImagePath);

    // Hanya menghapus file di folder upload produk
    $oldFile = realpath(
        __DIR__ . "/../../frontend/" . ltrim($oldImagePath, '/')
    );

    $uploadDirectory = realpath(
        __DIR__ . "/../../frontend/uploads/products"
    );

    if (
        $oldFile &&
        $uploadDirectory &&
        strpos($oldFile, $uploadDirectory . DIRECTORY_SEPARATOR) === 0 &&
        is_file($oldFile)
    ) {
        unlink($oldFile);
    }
}

header("Location: products.php?updated=1");
exit;

        } catch (Throwable $e) {
            if ($conn->inTransaction()) {
                $conn->rollBack();
            }

            if ($newFilePath && file_exists($newFilePath)) {
                unlink($newFilePath);
            }

            $errors[] = $e instanceof PDOException
                ? "Produk gagal diperbarui. Periksa struktur database."
                : $e->getMessage();
        }
    }
}

$adminName = $_SESSION['user']['full_name'] ?? 'Administrator';

// Path foto saat ini untuk preview
$currentImagePath = $currentImage['image_path'] ?? '';
$currentImagePath = str_replace('\\', '/', $currentImagePath);
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Edit Produk | Yukido Motorsport</title>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background: #f4f5f7;
            color: #222;
        }

        .sidebar {
            width: 250px;
            height: 100vh;
            background: #151515;
            color: white;
            position: fixed;
            left: 0;
            top: 0;
            padding: 30px 20px;
        }

        .brand {
            font-size: 23px;
            font-weight: bold;
            color: #e63939;
            margin-bottom: 8px;
        }

        .sidebar small {
            color: #aaa;
        }

        .menu {
            margin-top: 45px;
        }

        .menu a {
            display: block;
            text-decoration: none;
            color: #ccc;
            padding: 14px 15px;
            margin-bottom: 8px;
            border-radius: 7px;
        }

        .menu a.active,
        .menu a:hover {
            background: #e63939;
            color: white;
        }

        .main {
            margin-left: 250px;
            padding: 30px;
        }

        .topbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
            margin-bottom: 30px;
        }

        .topbar h1 {
            font-size: 27px;
            margin-bottom: 6px;
        }

        .admin-info {
            color: #777;
            font-size: 14px;
        }

        .logout-btn,
        .save-btn {
            border: none;
            background: #e63939;
            color: white;
            padding: 12px 20px;
            border-radius: 7px;
            cursor: pointer;
            font-weight: bold;
        }

        .logout-btn:hover,
        .save-btn:hover {
            background: #c92e2e;
        }

        .back-link {
            display: inline-block;
            margin-bottom: 20px;
            color: #e63939;
            text-decoration: none;
            font-weight: bold;
        }

        .form-box {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 3px 12px rgba(0,0,0,.05);
            max-width: 1000px;
        }

        .form-box h2 {
            margin-bottom: 25px;
            font-size: 21px;
        }

        .form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 22px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 9px;
        }

        .form-group.full {
            grid-column: 1 / -1;
        }

        label {
            font-size: 14px;
            font-weight: bold;
        }

        input,
        select,
        textarea {
            width: 100%;
            padding: 12px 13px;
            border: 1px solid #ddd;
            border-radius: 7px;
            font-family: inherit;
            font-size: 14px;
            outline: none;
        }

        input:focus,
        select:focus,
        textarea:focus {
            border-color: #e63939;
        }

        textarea {
            resize: vertical;
            min-height: 120px;
        }

        .hint {
            color: #888;
            font-size: 12px;
        }

        .form-actions {
            display: flex;
            gap: 12px;
            margin-top: 28px;
        }

        .cancel-btn {
            display: inline-block;
            text-decoration: none;
            padding: 12px 20px;
            border-radius: 7px;
            color: #333;
            background: #eee;
            font-weight: bold;
        }

        .error-box {
            background: #ffe7e7;
            color: #b42323;
            padding: 15px 18px;
            border-radius: 7px;
            margin-bottom: 20px;
        }

        .error-box ul {
            margin-left: 20px;
        }

        #imagePreview {
            display: block;
            width: 180px;
            height: 150px;
            object-fit: contain;
            background: #f4f4f4;
            border: 1px solid #ddd;
            border-radius: 8px;
            margin-top: 10px;
        }

        @media (max-width: 650px) {
            .sidebar {
                width: 100%;
                height: auto;
                position: relative;
            }

            .menu {
                margin-top: 20px;
            }

            .main {
                margin-left: 0;
                padding: 20px;
            }

            .form-grid {
                grid-template-columns: 1fr;
            }

            .form-group.full {
                grid-column: auto;
            }

            .topbar {
                align-items: flex-start;
                flex-direction: column;
            }
        }
    </style>
</head>

<body>

<aside class="sidebar">
    <div class="brand">YUKIDO</div>
    <small>Motorsport Admin Panel</small>

    <nav class="menu">
        <a href="dashboard.php">Dashboard</a>
        <a href="products.php" class="active">Manajemen Produk</a>
    </nav>
</aside>

<main class="main">

    <header class="topbar">
        <div>
            <h1>Edit Produk</h1>
            <p class="admin-info">
                Selamat datang, <?= htmlspecialchars($adminName) ?>!
            </p>
        </div>

        <button class="logout-btn" onclick="logout()">Logout</button>
    </header>

    <a href="products.php" class="back-link">
        ← Kembali ke Manajemen Produk
    </a>

    <section class="form-box">

        <h2>Ubah Informasi Produk</h2>

        <?php if (!empty($errors)): ?>
            <div class="error-box">
                <strong>Perubahan belum berhasil disimpan:</strong>
                <ul>
                    <?php foreach ($errors as $error): ?>
                        <li><?= htmlspecialchars($error) ?></li>
                    <?php endforeach; ?>
                </ul>
            </div>
        <?php endif; ?>

        <form method="POST" enctype="multipart/form-data">

            <input
                type="hidden"
                name="csrf_token"
                value="<?= htmlspecialchars($_SESSION['csrf_token']) ?>"
            >

            <div class="form-grid">

                <div class="form-group">
                    <label for="sku">SKU Produk *</label>
                    <input
                        type="text"
                        id="sku"
                        name="sku"
                        value="<?= htmlspecialchars($form['sku']) ?>"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="name">Nama Produk *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value="<?= htmlspecialchars($form['name']) ?>"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="category_id">Kategori *</label>
                    <select id="category_id" name="category_id" required>
                        <?php foreach ($categories as $category): ?>
                            <option
                                value="<?= (int)$category['id'] ?>"
                                <?= (string)$form['category_id'] === (string)$category['id'] ? 'selected' : '' ?>
                            >
                                <?= htmlspecialchars($category['name']) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="form-group">
                    <label for="brand_id">Brand *</label>
                    <select id="brand_id" name="brand_id" required>
                        <?php foreach ($brands as $brand): ?>
                            <option
                                value="<?= (int)$brand['id'] ?>"
                                <?= (string)$form['brand_id'] === (string)$brand['id'] ? 'selected' : '' ?>
                            >
                                <?= htmlspecialchars($brand['name']) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="form-group">
                    <label for="price">Harga Produk (Rp) *</label>
                    <input
                        type="number"
                        id="price"
                        name="price"
                        min="0"
                        step="1"
                        value="<?= htmlspecialchars($form['price']) ?>"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="stock">Stok Produk *</label>
                    <input
                        type="number"
                        id="stock"
                        name="stock"
                        min="0"
                        value="<?= htmlspecialchars($form['stock']) ?>"
                        required
                    >
                </div>

                <div class="form-group">
                    <label for="weight_gram">Berat Produk (Gram)</label>
                    <input
                        type="number"
                        id="weight_gram"
                        name="weight_gram"
                        min="0"
                        value="<?= htmlspecialchars($form['weight_gram']) ?>"
                    >
                </div>

                <div class="form-group">
                    <label for="status">Status Produk</label>
                    <select id="status" name="status">
                        <option value="active" <?= $form['status'] === 'active' ? 'selected' : '' ?>>Active</option>
                        <option value="inactive" <?= $form['status'] === 'inactive' ? 'selected' : '' ?>>Inactive</option>
                        <option value="draft" <?= $form['status'] === 'draft' ? 'selected' : '' ?>>Draft</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="warranty_type">Jenis Garansi</label>
                    <select id="warranty_type" name="warranty_type">
                        <option value="none" <?= $form['warranty_type'] === 'none' ? 'selected' : '' ?>>
                            Tidak Ada Garansi
                        </option>

                        <option value="limited" <?= $form['warranty_type'] === 'limited' ? 'selected' : '' ?>>
                            Garansi Terbatas
                        </option>

                        <option value="lifetime" <?= $form['warranty_type'] === 'lifetime' ? 'selected' : '' ?>>
                            Lifetime Warranty
                        </option>
                    </select>
                </div>

                <div
                    class="form-group"
                    id="warrantyPeriodGroup"
                    style="display:none"
                >
                    <label for="warranty_period_months">
                        Periode Garansi (Bulan)
                    </label>

                    <input
                        type="number"
                        id="warranty_period_months"
                        name="warranty_period_months"
                        min="1"
                        value="<?= htmlspecialchars($form['warranty_period_months'] ?? '') ?>"
                    >
                </div>

                <div class="form-group full">
                    <label for="description">Deskripsi Produk</label>
                    <textarea
                        id="description"
                        name="description"
                    ><?= htmlspecialchars($form['description'] ?? '') ?></textarea>
                </div>

                <div class="form-group full">
                    <label>Foto Produk Saat Ini</label>

                    <?php if ($currentImagePath !== ''): ?>
                        <img
                            id="imagePreview"
                            src="../../frontend/<?= htmlspecialchars(ltrim($currentImagePath, '/')) ?>"
                            alt="Foto produk saat ini"
                            onerror="this.onerror=null;this.src='../../frontend/images/yukido.png';"
                        >
                    <?php else: ?>
                        <img
                            id="imagePreview"
                            src="../../frontend/images/yukido.png"
                            alt="Foto default produk"
                        >
                    <?php endif; ?>
                </div>

                <div class="form-group full">
                    <label for="product_image">Ganti Foto Produk</label>

                    <input
                        type="file"
                        id="product_image"
                        name="product_image"
                        accept=".jpg,.jpeg,.png,.webp"
                    >

                    <span class="hint">
                        Kosongkan jika tidak ingin mengganti foto.
                        Format JPG, PNG, WEBP. Maksimal 5 MB.
                    </span>
                </div>

            </div>

            <div class="form-actions">
                <button type="submit" class="save-btn">
                    Simpan Perubahan
                </button>

                <a href="products.php" class="cancel-btn">
                    Batal
                </a>
            </div>

        </form>
    </section>

</main>

<script>
const warrantySelect = document.getElementById('warranty_type');
const warrantyPeriodGroup = document.getElementById('warrantyPeriodGroup');
const warrantyPeriodInput = document.getElementById('warranty_period_months');

function updateWarrantyField() {
    const isLimited = warrantySelect.value === 'limited';

    warrantyPeriodGroup.style.display = isLimited ? 'flex' : 'none';
    warrantyPeriodInput.required = isLimited;
}

warrantySelect.addEventListener('change', updateWarrantyField);
updateWarrantyField();

// Preview foto baru
document.getElementById('product_image').addEventListener('change', function () {
    const file = this.files[0];

    if (file) {
        document.getElementById('imagePreview').src =
            URL.createObjectURL(file);
    }
});

// Logout
async function logout() {
    if (!confirm("Apakah kamu yakin ingin logout?")) {
        return;
    }

    try {
        const response = await fetch("../auth/logout.php", {
            method: "POST",
            credentials: "same-origin"
        });

        if (response.ok) {
            window.location.href = "../../frontend/login.html";
        } else {
            alert("Logout gagal. Silakan coba lagi.");
        }
    } catch (error) {
        alert("Terjadi kesalahan saat logout.");
    }
}
</script>

</body>
</html>
