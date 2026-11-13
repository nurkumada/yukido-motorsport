
<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");

require_once __DIR__ . "/../config/database.php";

try {

    // Hanya menerima POST
    if ($_SERVER["REQUEST_METHOD"] !== "POST") {
        http_response_code(405);

        echo json_encode([
            "success" => false,
            "message" => "Metode request tidak diizinkan."
        ]);
        exit;
    }

    // Mengambil data JSON
    $data = json_decode(file_get_contents("php://input"), true);

    if (!is_array($data)) {
        http_response_code(400);

        echo json_encode([
            "success" => false,
            "message" => "Format data tidak valid."
        ]);
        exit;
    }

    $identifier = trim($data["email"] ?? "");
    $password = $data["password"] ?? "";

    // Validasi input
    if ($identifier === "" || $password === "") {
        http_response_code(422);

        echo json_encode([
            "success" => false,
            "message" => "Email/nomor WhatsApp dan password wajib diisi."
        ]);
        exit;
    }

    // Mencari akun berdasarkan email atau nomor WhatsApp
    $stmt = $conn->prepare("
        SELECT
            id,
            full_name,
            email,
            password_hash,
            role
        FROM users
        WHERE email = :email OR phone = :phone
        LIMIT 1
    ");

    $stmt->execute([
        "email" => $identifier,
        "phone" => $identifier
    ]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Memeriksa akun dan password
    if (
        !$user ||
        !password_verify($password, $user["password_hash"])
    ) {
        http_response_code(401);

        echo json_encode([
            "success" => false,
            "message" => "Email/nomor WhatsApp atau password salah."
        ]);
        exit;
    }

    // Membuat session baru
    session_regenerate_id(true);

    $_SESSION["user"] = [
        "id" => $user["id"],
        "full_name" => $user["full_name"],
        "email" => $user["email"],
        "role" => $user["role"]
    ];

    // Menentukan tujuan berdasarkan role
    $redirect = ($user["role"] === "admin")
        ? "../backend/admin/dashboard.php"
        : "produk.html";

    echo json_encode([
        "success" => true,
        "message" => "Login berhasil.",
        "user" => $_SESSION["user"],
        "redirect" => $redirect
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Terjadi kesalahan database."
    ]);
}
