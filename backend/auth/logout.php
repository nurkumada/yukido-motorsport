
<?php
session_start();

header("Content-Type: application/json; charset=UTF-8");

// Menghapus seluruh data session
$_SESSION = [];

// Menghapus cookie session
if (ini_get("session.use_cookies")) {

    $params = session_get_cookie_params();

    setcookie(
        session_name(),
        "",
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Menghancurkan session
session_destroy();

echo json_encode([
    "success" => true,
    "message" => "Logout berhasil."
]);
