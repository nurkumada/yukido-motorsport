
<?php
session_start();

// Proteksi halaman admin
if (
    !isset($_SESSION['user']) ||
    $_SESSION['user']['role'] !== 'admin'
) {
    header("Location: ../../frontend/login.html");
    exit;
}

require_once __DIR__ . "/../config/database.php";

// Token keamanan untuk form
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Proses pencarian
$keyword = trim($_GET['search'] ?? '');

// Proses menonaktifkan produk
$message = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['deactivate_id'])) {
    if (
        !isset($_POST['csrf_token']) ||
        !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])
    ) {
        die("Permintaan tidak valid.");
    }

    $id = (int) $_POST['deactivate_id'];

    if ($id > 0) {
        $stmt = $conn->prepare("
            UPDATE products
            SET status = 'inactive'
            WHERE id = :id
        ");

        $stmt->execute(['id' => $id]);
        $message = "Produk berhasil dinonaktifkan.";
    }
}

// Proses mengaktifkan kembali produk
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['activate_id'])) {

    if (
        !isset($_POST['csrf_token']) ||
        !hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])
    ) {
        die("Permintaan tidak valid.");
    }

    $id = (int) $_POST['activate_id'];

    if ($id > 0) {
        $stmt = $conn->prepare("
            UPDATE products
            SET status = 'active'
            WHERE id = ?
        ");

        $stmt->execute([$id]);
        $message = "Produk berhasil diaktifkan kembali.";
    }
}

// Mengambil data produk
$sql = "
    SELECT
        p.id,
        p.sku,
        p.name,
        p.price,
        p.stock,
        p.status,
        c.name AS category_name,
        b.name AS brand_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN brands b ON p.brand_id = b.id
";

$params = [];

if ($keyword !== '') {
    $sql .= "
        WHERE p.name LIKE :keyword
        OR p.sku LIKE :keyword
    ";
    $params['keyword'] = "%{$keyword}%";
}

$sql .= " ORDER BY p.id DESC";

$stmt = $conn->prepare($sql);
$stmt->execute($params);
$products = $stmt->fetchAll(PDO::FETCH_ASSOC);

$adminName = $_SESSION['user']['full_name'] ?? 'Administrator';
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Manajemen Produk | Yukido Motorsport</title>

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
            transition: .2s;
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
            margin-bottom: 30px;
            gap: 15px;
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
            text-decoration: none;
            display: inline-block;
        }

        .logout-btn:hover,
        .add-btn:hover {
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
            gap: 15px;
            margin-bottom: 25px;
        }

        .search-form {
            display: flex;
            gap: 8px;
            flex: 1;
            max-width: 450px;
        }

        .search-form input {
            flex: 1;
            min-width: 0;
            padding: 11px 13px;
            border: 1px solid #ddd;
            border-radius: 7px;
            font-size: 14px;
        }

        .search-form button {
            border: none;
            background: #222;
            color: white;
            padding: 0 18px;
            border-radius: 7px;
            cursor: pointer;
        }

        .table-wrapper {
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 750px;
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

        .status {
            display: inline-block;
            padding: 6px 11px;
            border-radius: 20px;
            font-size: 12px;
        }

        .active-status {
            background: #e5f7eb;
            color: #218344;
        }

        .inactive-status {
            background: #ffe7e7;
            color: #c92e2e;
        }

        .draft-status {
            background: #fff2d8;
            color: #9a6900;
        }

        .action-btn {
            border: none;
            padding: 8px 11px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            text-decoration: none;
            display: inline-block;
            margin: 2px;
        }

        .edit-btn {
            background: #222;
            color: white;
        }

        .delete-btn {
            background: #ffe7e7;
            color: #c92e2e;
        }

        .message {
            background: #e5f7eb;
            color: #218344;
            padding: 12px 15px;
            border-radius: 7px;
            margin-bottom: 20px;
        }

        .empty {
            text-align: center;
            color: #888;
            padding: 30px;
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

            .topbar,
            .toolbar {
                align-items: stretch;
                flex-direction: column;
            }

            .search-form {
                max-width: none;
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
        <a href="categories.php">Manajemen Kategori</a>
    </nav>
</aside>

<main class="main">

    <header class="topbar">
        <div>
            <h1>Manajemen Produk</h1>
            <p class="admin-info">
                Selamat datang, <?= htmlspecialchars($adminName) ?>!
            </p>
        </div>

        <button class="logout-btn" onclick="logout()">
            Logout
        </button>
    </header>

    <section class="content-box">

        <?php if ($message !== ''): ?>
            <div class="message">
                <?= htmlspecialchars($message) ?>
            </div>
        <?php endif; ?>

        <div class="toolbar">

            <form method="GET" class="search-form">
                <input
                    type="text"
                    name="search"
                    placeholder="Cari nama atau SKU produk..."
                    value="<?= htmlspecialchars($keyword) ?>"
                >

                <button type="submit">Cari</button>
            </form>

            <a href="add-product.php" class="add-btn">
                + Tambah Produk
            </a>

        </div>

        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>SKU</th>
                        <th>Nama Produk</th>
                        <th>Kategori</th>
                        <th>Brand</th>
                        <th>Harga</th>
                        <th>Stok</th>
                        <th>Status</th>
                        <th>Aksi</th>
                    </tr>
                </thead>

                <tbody>

                <?php if (count($products) > 0): ?>

                    <?php foreach ($products as $index => $product): ?>

                        <tr>
                            <td><?= $index + 1 ?></td>

                            <td>
                                <?= htmlspecialchars($product['sku'] ?? '-') ?>
                            </td>

                            <td>
                                <?= htmlspecialchars($product['name']) ?>
                            </td>

                            <td>
                                <?= htmlspecialchars($product['category_name'] ?? '-') ?>
                            </td>

                            <td>
                                <?= htmlspecialchars($product['brand_name'] ?? '-') ?>
                            </td>

                            <td>
                                Rp <?= number_format(
                                    (float)$product['price'],
                                    0,
                                    ',',
                                    '.'
                                ) ?>
                            </td>

                            <td><?= (int)$product['stock'] ?></td>

                            <td>
                                <?php
                                $statusClass = match ($product['status']) {
                                    'active' => 'active-status',
                                    'inactive' => 'inactive-status',
                                    default => 'draft-status'
                                };
                                ?>

                                <span class="status <?= $statusClass ?>">
                                    <?= htmlspecialchars($product['status']) ?>
                                </span>
                            </td>

                            <td>
                                <a
                                    href="edit-product.php?id=<?= (int)$product['id'] ?>"
                                    class="action-btn edit-btn"
                                >
                                    Edit
                                </a>

                           
<?php if ($product['status'] === 'inactive'): ?>

    <form method="POST" style="display:inline"
          onsubmit="return confirm('Aktifkan kembali produk ini?')">

        <input type="hidden" name="activate_id"
               value="<?= (int)$product['id'] ?>">

        <input type="hidden" name="csrf_token"
               value="<?= htmlspecialchars($_SESSION['csrf_token']) ?>">

        <button type="submit"
                class="action-btn edit-btn">
            Aktifkan
        </button>
    </form>

<?php else: ?>

    <form method="POST" style="display:inline"
          onsubmit="return confirm('Nonaktifkan produk ini?')">

        <input type="hidden" name="deactivate_id"
               value="<?= (int)$product['id'] ?>">

        <input type="hidden" name="csrf_token"
               value="<?= htmlspecialchars($_SESSION['csrf_token']) ?>">

        <button type="submit"
                class="action-btn delete-btn">
            Nonaktifkan
        </button>
    </form>

<?php endif; ?>

                            </td>
                        </tr>

                    <?php endforeach; ?>

                <?php else: ?>

                    <tr>
                        <td colspan="9" class="empty">
                            Produk tidak ditemukan.
                        </td>
                    </tr>

                <?php endif; ?>

                </tbody>
            </table>
        </div>

    </section>

</main>

<script>
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
