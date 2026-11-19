<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user']) && !empty($_SESSION['user']['id'])) {
    echo json_encode([
        'logged_in' => true,
        'user' => [
            'id' => $_SESSION['user']['id'],
            'full_name' => $_SESSION['user']['full_name'] ?? 'Member YUKIDO',
            'email' => $_SESSION['user']['email'] ?? '',
            'role' => $_SESSION['user']['role'] ?? 'customer'
        ]
    ]);
} else {
    echo json_encode([
        'logged_in' => false,
        'user' => null
    ]);
}