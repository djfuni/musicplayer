<?php
error_reporting(0);
session_start();
header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['is_admin'])) {
    die(json_encode(['status' => 'error', 'message' => '请先登录']));
}

$targetDir = __DIR__ . "/musicsave/";
if (!file_exists($targetDir)) mkdir($targetDir, 0777, true);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['musicFile']) && $_FILES['musicFile']['error'] === UPLOAD_ERR_OK) {
    $originalName = basename($_FILES['musicFile']['name']);
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    
    if (!in_array($ext, ['mp3', 'wav', 'ogg'])) die(json_encode(['status' => 'error', 'message' => '格式不支持']));

    $songName = !empty($_POST['songName']) ? trim($_POST['songName']) : pathinfo($originalName, PATHINFO_FILENAME);
    $safeName = str_replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], '', $songName);
    $fileName = $safeName . '.' . $ext;
    
    if (move_uploaded_file($_FILES['musicFile']['tmp_name'], $targetDir . $fileName)) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => '写入失败，检查目录权限']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => '未收到音频数据']);
}
?>