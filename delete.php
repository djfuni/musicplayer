<?php
error_reporting(0);
session_start();
header('Content-Type: application/json; charset=utf-8');

if (empty($_SESSION['is_admin'])) {
    die(json_encode(['status' => 'error', 'message' => '请先登录']));
}

if (isset($_POST['filename'])) {
    $filename = basename($_POST['filename']);
    $file = __DIR__ . '/musicsave/' . $filename;
    
    if (file_exists($file)) {
        if(@unlink($file)) echo json_encode(['status' => 'success']);
        else echo json_encode(['status' => 'error', 'message' => '无权删除']);
    } else {
        echo json_encode(['status' => 'error', 'message' => '文件不存在']);
    }
}
?>