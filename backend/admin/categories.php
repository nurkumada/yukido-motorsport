

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

$message = "";
$error = "";

function makeSlug($text) {
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    return trim($text, '-');
}

function validateToken() {
    return isset($_POST['csrf_token']) &&
        hash_equals($_SESSION['csrf_token'], $_POST['csrf_token']);
}

// Upload foto kategori
function uploadCategoryImage($file) {
    if (!$file || $file['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception("Upload foto kategori gagal.");
    }

    if ($file['size'] > 5 * 1024 * 1024) {
        throw new Exception("Ukuran foto maksimal 5 MB.");
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);

    $allowedTypes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp'
    ];

    if (!isset($allowedTypes[$mime])) {
        throw new Exception("Format foto harus JPG, PNG, atau WEBP.");
    }

    if (getimagesize($file['tmp_name']) === false) {
        throw new Exception("File bukan gambar yang valid.");
    }

    $uploadDirectory = __DIR__ . "/../../frontend/uploads/categories";

    if (
        !is_dir($uploadDirectory) &&
        !mkdir($uploadDirectory, 0755, true)
    ) {
        throw new Exception("Folder upload kategori gagal dibuat.");
    }

    $fileName = 'category_' . bin2hex(random_bytes(12)) .
        '.' . $allowedTypes[$mime];

    $absolutePath = $uploadDirectory . DIRECTORY_SEPARATOR . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $absolutePath)) {
        throw new Exception("Foto kategori gagal disimpan.");
    }

    return [
        'relative' => 'uploads/categories/' . $fileName,
        'absolute' => $absolutePath
    ];
}

// Hanya menghapus foto dari folder upload kategori milik aplikasi
function deleteCategoryImage($relativePath) {
    if (!$relativePath) {
        return;
    }

    $relativePath = str_replace('\\', '/', $relativePath);
    $baseDirectory = realpath(__DIR__ . "/../../frontend/uploads/categories");

    if (!$baseDirectory) {
        return;
    }

    $filePath = realpath(
        __DIR__ . "/../../frontend/" . ltrim($relativePath, '/')
    );

    if (
        $filePath &&
        strpos($filePath, $baseDirectory . DIRECTORY_SEPARATOR) === 0 &&
        is_file($filePath)
    ) {
        unlink($filePath);
    }
}

// Proses tambah, edit, dan hapus kategori
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    if (!validateToken()) {
        $error = "Permintaan tidak valid. Muat ulang halaman.";
    } else {

        $action = $_POST['action'] ?? '';
        $newImage = null;

        try {

            // TAMBAH KATEGORI
            if ($action === 'add') {

                $name = trim($_POST['name'] ?? '');

                if ($name === '') {
                    throw new Exception("Nama kategori wajib diisi.");
                }

                $slug = makeSlug($name);

                if ($slug === '') {
                    throw new Exception("Nama kategori tidak valid.");
                }

                $check = $conn->prepare("
                    SELECT COUNT(*) FROM categories
                    WHERE name = ? OR slug = ?
                ");
                $check->execute([$name, $slug]);

                if ($check->fetchColumn() > 0) {
                    throw new Exception("Kategori sudah tersedia.");
                }

                $newImage = uploadCategoryImage($_FILES['category_image'] ?? null);

                $stmt = $conn->prepare("
                    INSERT INTO categories (name, slug, image_path)
                    VALUES (?, ?, ?)
                ");

                $stmt->execute([
                    $name,
                    $slug,
                    $newImage['relative'] ?? null
                ]);

                $message = "Kategori berhasil ditambahkan.";

            }

            // EDIT KATEGORI
            elseif ($action === 'edit') {

                $id = (int)($_POST['id'] ?? 0);
                $name = trim($_POST['name'] ?? '');

                if ($id < 1 || $name === '') {
                    throw new Exception("Data kategori tidak valid.");
                }

                $slug = makeSlug($name);

                if ($slug === '') {
                    throw new Exception("Nama kategori tidak valid.");
                }

                $check = $conn->prepare("
                    SELECT COUNT(*) FROM categories
                    WHERE (name = ? OR slug = ?) AND id != ?
                ");
                $check->execute([$name, $slug, $id]);

                if ($check->fetchColumn() > 0) {
                    throw new Exception("Nama kategori sudah digunakan.");
                }

                $oldStmt = $conn->prepare("
                    SELECT image_path FROM categories WHERE id = ?
                ");
                $oldStmt->execute([$id]);
                $oldImagePath = $oldStmt->fetchColumn();

                if ($oldImagePath === false) {
                    throw new Exception("Kategori tidak ditemukan.");
                }

                $newImage = uploadCategoryImage($_FILES['category_image'] ?? null);

                if ($newImage) {
                    $update = $conn->prepare("
                        UPDATE categories
                        SET name = ?, slug = ?, image_path = ?
                        WHERE id = ?
                    ");

                    $update->execute([
                        $name,
                        $slug,
                        $newImage['relative'],
                        $id
                    ]);

                    // Foto lama dihapus setelah database berhasil diperbarui
                    if ($oldImagePath && $oldImagePath !== $newImage['relative']) {
                        deleteCategoryImage($oldImagePath);
                    }

                } else {
                    $update = $conn->prepare("
                        UPDATE categories
                        SET name = ?, slug = ?
                        WHERE id = ?
                    ");

                    $update->execute([$name, $slug, $id]);
                }

                $message = "Kategori berhasil diperbarui.";

            }

            // HAPUS KATEGORI
            elseif ($action === 'delete') {

                $id = (int)($_POST['id'] ?? 0);

                if ($id < 1) {
                    throw new Exception("ID kategori tidak valid.");
                }

                $check = $conn->prepare("
                    SELECT COUNT(*)
                    FROM products
                    WHERE category_id = ?
                ");
                $check->execute([$id]);

                $totalProducts = (int)$check->fetchColumn();

                if ($totalProducts > 0) {
                    throw new Exception(
                        "Kategori tidak bisa dihapus karena masih digunakan oleh {$totalProducts} produk."
                    );
                }

                $imageStmt = $conn->prepare("
                    SELECT image_path FROM categories WHERE id = ?
                ");
                $imageStmt->execute([$id]);
                $oldImagePath = $imageStmt->fetchColumn();

                $delete = $conn->prepare("
                    DELETE FROM categories WHERE id = ?
                ");
                $delete->execute([$id]);

                if ($oldImagePath) {
                    deleteCategoryImage($oldImagePath);
                }

                $message = "Kategori berhasil dihapus.";

            } else {
                throw new Exception("Aksi tidak dikenali.");
            }

        } catch (PDOException $e) {
            if ($newImage && file_exists($newImage['absolute'])) {
                unlink($newImage['absolute']);
            }

            $error = "Terjadi kesalahan database. Periksa kembali data kategori.";

        } catch (Throwable $e) {
            if ($newImage && file_exists($newImage['absolute'])) {
                unlink($newImage['absolute']);
            }

            $error = $e->getMessage();
        }
    }
}

// Mengambil kategori dan jumlah produk
$stmt = $conn->query("
    SELECT
        c.id,
        c.name,
        c.slug,
        c.image_path,
        COUNT(p.id) AS total_products
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id, c.name, c.slug, c.image_path
    ORDER BY c.name ASC
");

$categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

$adminName = $_SESSION['user']['full_name'] ?? 'Administrator';
?>


<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Manajemen Kategori | Yukido Motorsport</title>

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
        .add-btn {
            border: none;
            background: #e63939;
            color: white;
            padding: 12px 18px;
            border-radius: 7px;
            cursor: pointer;
            font-weight: bold;
        }

        .add-btn:hover,
        .logout-btn:hover {
            background: #c92e2e;
        }

        .content-box {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 3px 12px rgba(0,0,0,.05);
        }

        .toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            gap: 15px;
        }

        .toolbar h2 {
            font-size: 20px;
        }

        .message {
            padding: 13px 16px;
            border-radius: 7px;
            margin-bottom: 20px;
            background: #e5f7eb;
            color: #218344;
        }

        .error {
            padding: 13px 16px;
            border-radius: 7px;
            margin-bottom: 20px;
            background: #ffe7e7;
            color: #b42323;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            padding: 15px 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
            font-size: 14px;
        }

        th {
            background: #f8f8f8;
            color: #555;
        }

        .action-btn {
            border: none;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
        }

        .edit-btn {
            background: #222;
            color: white;
        }

        .delete-btn {
            background: #ffe7e7;
            color: #c92e2e;
        }

        .modal {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,.55);
            z-index: 1000;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }

        .modal.show {
            display: flex;
        }

        .modal-content {
            width: 100%;
            max-width: 450px;
            background: white;
            border-radius: 12px;
            padding: 25px;
        }

        .modal-content h2 {
            margin-bottom: 20px;
        }

        .modal-content label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: bold;
        }

        .modal-content input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 7px;
            margin-bottom: 20px;
            font-size: 14px;
        }

        .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }

        .cancel-btn {
            background: #eee;
            color: #333;
            border: none;
            padding: 11px 16px;
            border-radius: 7px;
            cursor: pointer;
        }

        .save-btn {
            background: #e63939;
            color: white;
            border: none;
            padding: 11px 18px;
            border-radius: 7px;
            cursor: pointer;
            font-weight: bold;
        }

        .empty {
            text-align: center;
            color: #888;
            padding: 25px;
        }

        @media(max-width: 650px) {
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

            .topbar,
            .toolbar {
                align-items: flex-start;
                flex-direction: column;
            }

            table {
                min-width: 600px;
            }

            .content-box {
                overflow-x: auto;
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
        <a href="products.php">Manajemen Produk</a>
        <a href="categories.php" class="active">Manajemen Kategori</a>
    </nav>
</aside>

<main class="main">

    <header class="topbar">
        <div>
            <h1>Manajemen Kategori</h1>
            <p class="admin-info">
                Selamat datang, <?= htmlspecialchars($adminName) ?>!
            </p>
        </div>

        <button class="logout-btn" onclick="logout()">Logout</button>
    </header>

    <section class="content-box">

        <?php if ($message): ?>
            <div class="message"><?= htmlspecialchars($message) ?></div>
        <?php endif; ?>

        <?php if ($error): ?>
            <div class="error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <div class="toolbar">
            <h2>Daftar Kategori Produk</h2>

            <button class="add-btn" onclick="openAddModal()">
                + Tambah Kategori
            </button>
        </div>

        <table>
            
<thead>
    <tr>
        <th>No.</th>
        <th>Foto</th>
        <th>Nama Kategori</th>
        <th>Slug</th>
        <th>Jumlah Produk</th>
        <th>Aksi</th>
    </tr>
</thead>


            <tbody>
                <?php if (count($categories) > 0): ?>

                    <?php foreach ($categories as $index => $category): ?>
                        <tr>
                            <td><?= $index + 1 ?></td>

                            <td>
                                <?php if (!empty($category['image_path'])): ?>
                                    <img
                                        src="../../frontend/<?= htmlspecialchars($category['image_path']) ?>"
                                        alt="<?= htmlspecialchars($category['name']) ?>"
                                        style="width:65px;height:55px;object-fit:cover;border-radius:7px;"
                                    >
                                <?php else: ?>
                                    <span style="color:#999;">Belum ada foto</span>
                                <?php endif; ?>
                            </td>


                            <td>
                                <?= htmlspecialchars($category['name']) ?>
                            </td>

                            <td>
                                <?= htmlspecialchars($category['slug']) ?>
                            </td>

                            <td>
                                <?= (int)$category['total_products'] ?> Produk
                            </td>

                            <td>
                                <button
                                    class="action-btn edit-btn"
                                    
                                onclick='openEditModal(
                                    <?= (int)$category["id"] ?>,
                                    <?= json_encode($category["name"], JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_TAG | JSON_HEX_AMP) ?>,
                                    <?= json_encode($category["image_path"] ?? "", JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_TAG | JSON_HEX_AMP) ?>
                                )'

                                >
                                    Edit
                                </button>

                                <form method="POST"
                                      style="display:inline"
                                      onsubmit="return confirm('Yakin ingin menghapus kategori ini?')">

                                    <input type="hidden" name="csrf_token"
                                           value="<?= htmlspecialchars($_SESSION['csrf_token']) ?>">

                                    <input type="hidden" name="action" value="delete">

                                    <input type="hidden" name="id"
                                           value="<?= (int)$category['id'] ?>">

                                    <button type="submit" class="action-btn delete-btn">
                                        Hapus
                                    </button>
                                </form>
                            </td>
                        </tr>
                    <?php endforeach; ?>

                <?php else: ?>

                    <tr>
                        <td colspan="6" class="empty">
                            Belum ada kategori.
                        </td>
                    </tr>

                <?php endif; ?>
            </tbody>
        </table>

    </section>

</main>

<!-- Modal Tambah dan Edit -->
<div class="modal" id="categoryModal">
    <div class="modal-content">

        <h2 id="modalTitle">Tambah Kategori</h2>

        <form method="POST" enctype="multipart/form-data">
            <input type="hidden" name="csrf_token"
                   value="<?= htmlspecialchars($_SESSION['csrf_token']) ?>">

            <input type="hidden" name="action" id="formAction" value="add">
            <input type="hidden" name="id" id="categoryId">

            <label for="categoryName">Nama Kategori</label>

            <input
                type="text"
                id="categoryName"
                name="name"
                placeholder="Contoh: Power Tools"
                required
            >


            <label for="categoryImage">Foto Kategori</label>

            <input
                type="file"
                id="categoryImage"
                name="category_image"
                accept=".jpg,.jpeg,.png,.webp"
                onchange="previewCategoryImage(event)"
            >

            <small style="display:block;color:#888;margin-top:-12px;margin-bottom:12px;">
                Format JPG, PNG, WEBP. Maksimal 5 MB.
                Kosongkan saat edit jika tidak ingin mengganti foto.
            </small>

            <img
                id="categoryImagePreview"
                src="../../frontend/images/yukido.png"
                alt="Preview foto kategori"
                style="width:130px;height:100px;object-fit:cover;border-radius:8px;margin-bottom:20px;"
            >


            <div class="modal-actions">
                <button type="button" class="cancel-btn" onclick="closeModal()">
                    Batal
                </button>

                <button type="submit" class="save-btn">
                    Simpan
                </button>
            </div>
        </form>

    </div>
</div>

<script>
const modal = document.getElementById('categoryModal');


function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Tambah Kategori';
    document.getElementById('formAction').value = 'add';
    document.getElementById('categoryId').value = '';
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryImage').value = '';
    document.getElementById('categoryImagePreview').src =
        '../../frontend/images/yukido.png';

    modal.classList.add('show');
}

function openEditModal(id, name, imagePath) {
    document.getElementById('modalTitle').textContent = 'Edit Kategori';
    document.getElementById('formAction').value = 'edit';
    document.getElementById('categoryId').value = id;
    document.getElementById('categoryName').value = name;
    document.getElementById('categoryImage').value = '';

    const preview = document.getElementById('categoryImagePreview');

    if (imagePath) {
        imagePath = imagePath.replace(/\\/g, '/');

        preview.src = imagePath.startsWith('http')
            ? imagePath
            : '../../frontend/' + imagePath.replace(/^\/+/, '');
    } else {
        preview.src = '../../frontend/images/yukido.png';
    }

    modal.classList.add('show');
}

function previewCategoryImage(event) {
    const file = event.target.files[0];

    if (file) {
        document.getElementById('categoryImagePreview').src =
            URL.createObjectURL(file);
    }
}


function closeModal() {
    modal.classList.remove('show');
}

modal.addEventListener('click', function(event) {
    if (event.target === modal) {
        closeModal();
    }
});

async function logout() {
    if (!confirm("Apakah kamu yakin ingin logout?")) return;

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
