
<?php
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

    // Mengambil input
    $fullName = trim($data["full_name"] ?? "");
    $email = strtolower(trim($data["email"] ?? ""));
    $phone = trim($data["phone"] ?? "");
    $password = $data["password"] ?? "";

    // Validasi input
    if (
        $fullName === "" ||
        $email === "" ||
        $phone === "" ||
        $password === ""
    ) {
        http_response_code(422);

        echo json_encode([
            "success" => false,
            "message" => "Semua kolom wajib diisi."
        ]);
        exit;
    }

    // Validasi email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(422);

        echo json_encode([
            "success" => false,
            "message" => "Format email tidak valid."
        ]);
        exit;
    }

    // Validasi password
    if (strlen($password) < 8) {
        http_response_code(422);

        echo json_encode([
            "success" => false,
            "message" => "Password minimal 8 karakter."
        ]);
        exit;
    }

    // Memeriksa apakah email sudah digunakan
    $check = $conn->prepare("
        SELECT id
        FROM users
        WHERE email = :email
        LIMIT 1
    ");

    $check->execute([
        "email" => $email
    ]);

    if ($check->fetch(PDO::FETCH_ASSOC)) {
        http_response_code(409);

        echo json_encode([
            "success" => false,
            "message" => "Email sudah terdaftar."
        ]);
        exit;
    }

    // Mengenkripsi password
    $passwordHash = password_hash(
        $password,
        PASSWORD_DEFAULT
    );

    // Menyimpan akun ke database
    $stmt = $conn->prepare("
        INSERT INTO users (
            full_name,
            email,
            phone,
            password_hash,
            role
        ) VALUES (
            :full_name,
            :email,
            :phone,
            :password_hash,
            'customer'
        )
    ");

    $stmt->execute([
        "full_name" => $fullName,
        "email" => $email,
        "phone" => $phone,
        "password_hash" => $passwordHash
    ]);

    http_response_code(201);

    echo json_encode([
        "success" => true,
        "message" => "Registrasi berhasil. Silakan login.",
        "user_id" => $conn->lastInsertId()
    ]);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Terjadi kesalahan database."
    ]);
}
