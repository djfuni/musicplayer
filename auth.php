<?php
error_reporting(0);
session_start();
header('Content-Type: application/json; charset=utf-8');

$ADMIN_USER = 'yubaoadmin';
$ADMIN_PASS = 'yubaoremix666'; // 改成你自己的密码

$action = $_GET['action'] ?? '';

if ($action === 'login') {
    $user = $_POST['username'] ?? '';
    $pass = $_POST['password'] ?? '';
    if ($user === $ADMIN_USER && $pass === $ADMIN_PASS) {
        $_SESSION['is_admin'] = true;
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => '识别码或安全密钥错误']);
    }
} elseif ($action === 'logout') {
    session_destroy();
    echo json_encode(['status' => 'success']);
} elseif ($action === 'check') {
    $isLoggedIn = isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;
    echo json_encode(['status' => 'success', 'is_logged_in' => $isLoggedIn]);
}
?>