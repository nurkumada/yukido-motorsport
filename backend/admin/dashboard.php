
<?php
session_start();

// Proteksi halaman: hanya admin yang boleh masuk
if (
    !isset($_SESSION['user']) ||
    $_SESSION['user']['role'] !== 'admin'
) {
    header("Location: ../../frontend/login.html");
    exit;
}

require_once __DIR__ . "/../config/database.php";

// Mengambil data ringkasan dari database
try {
    $totalProducts = $conn->query(
        "SELECT COUNT(*) FROM products"
    )->fetchColumn();

    $totalCategories = $conn->query(
        "SELECT COUNT(*) FROM categories"
    )->fetchColumn();

    $totalOrders = $conn->query(
        "SELECT COUNT(*) FROM orders"
    )->fetchColumn();

    $totalClaims = $conn->query(
        "SELECT COUNT(*) FROM warranty_claims"
    )->fetchColumn();

    // Mengambil lima produk terbaru
    $stmt = $conn->query("
        SELECT id, sku, name, price, stock, status
        FROM products
        ORDER BY id DESC
        LIMIT 5
    ");

    $recentProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    die("Gagal mengambil data dashboard.");
}

$adminName = $_SESSION['user']['full_name'] ?? 'Administrator';
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard | Yukido Motorsport</title>

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
        }

        .admin-info {
            color: #555;
            font-size: 14px;
        }

        .cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }

        .card {
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 3px 12px rgba(0,0,0,.05);
        }

        .card p {
            color: #777;
            font-size: 14px;
            margin-bottom: 15px;
        }

        .card h2 {
            font-size: 30px;
        }

        .content-box {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 3px 12px rgba(0,0,0,.05);
            overflow-x: auto;
        }

        .content-box h2 {
            margin-bottom: 20px;
            font-size: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 600px;
        }

        th, td {
            padding: 14px;
            text-align: left;
            border-bottom: 1px solid #eee;
            font-size: 14px;
        }

        th {
            background: #f8f8f8;
            color: #555;
        }

        .status {
            padding: 6px 10px;
            border-radius: 20px;
            font-size: 12px;
            background: #e5f7eb;
            color: #218344;
        }

        .logout-btn {
            border: none;
            background: #e63939;
            color: white;
            padding: 11px 18px;
            border-radius: 7px;
            cursor: pointer;
            font-weight: bold;
        }

        .logout-btn:hover {
            background: #c92e2e;
        }

        @media (max-width: 1000px) {
            .cards {
                grid-template-columns: repeat(2, 1fr);
            }
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

            .cards {
                grid-template-columns: 1fr;
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
    <a href="dashboard.php" class="active">Dashboard</a>
    <a href="products.php">Manajemen Produk</a>
    <a href="categories.php">Manajemen Kategori</a>
</nav>
    </aside>

    <main class="main">

        <header class="topbar">
            <div>
                <h1>Dashboard</h1>
                <p class="admin-info">
                    Selamat datang, <?= htmlspecialchars($adminName) ?>!
                </p>
            </div>

            <button class="logout-btn" onclick="logout()">
                Logout
            </button>
        </header>

        <section class="cards">

            <div class="card">
                <p>Total Produk</p>
                <h2><?= number_format((int)$totalProducts) ?></h2>
            </div>

            <div class="card">
                <p>Total Kategori</p>
                <h2><?= number_format((int)$totalCategories) ?></h2>
            </div>

            <div class="card">
                <p>Total Pesanan</p>
                <h2><?= number_format((int)$totalOrders) ?></h2>
            </div>

            <div class="card">
                <p>Klaim Garansi</p>
                <h2><?= number_format((int)$totalClaims) ?></h2>
            </div>

        </section>

        <section class="content-box">
            <h2>Produk Terbaru</h2>

            <table>
                <thead>
                    <tr>
                        <th>SKU</th>
                        <th>Nama Produk</th>
                        <th>Harga</th>
                        <th>Stok</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    <?php if (count($recentProducts) > 0): ?>

                        <?php foreach ($recentProducts as $product): ?>
                            <tr>
                                <td>
                                    <?= htmlspecialchars($product['sku'] ?? '-') ?>
                                </td>

                                <td>
                                    <?= htmlspecialchars($product['name']) ?>
                                </td>

                                <td>
                                    Rp <?= number_format(
                                        (float)$product['price'],
                                        0,
                                        ',',
                                        '.'
                                    ) ?>
                                </td>

                                <td>
                                    <?= (int)$product['stock'] ?>
                                </td>

                                <td>
                                    <span class="status">
                                        <?= htmlspecialchars($product['status']) ?>
                                    </span>
                                </td>
                            </tr>
                        <?php endforeach; ?>

                    <?php else: ?>

                        <tr>
                            <td colspan="5">
                                Belum ada produk.
                            </td>
                        </tr>

                    <?php endif; ?>
                </tbody>
            </table>
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
