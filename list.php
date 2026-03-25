<?php
error_reporting(0); // 必须保留，防止报warning毁掉前端JSON
header('Content-Type: application/json; charset=utf-8');

$dir = __DIR__ . "/musicsave/";
$musicList = [];

// 如果文件夹不存在，自动创建
if (!file_exists($dir)) {
    mkdir($dir, 0777, true);
}

$files = @scandir($dir);
if (is_array($files)) {
    $files = array_diff($files, array('..', '.'));
    foreach ($files as $file) {
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (in_array($ext, ['mp3', 'wav', 'ogg'])) {
            $musicList[] = [
                'name' => htmlspecialchars(pathinfo($file, PATHINFO_FILENAME)),
                'filename' => htmlspecialchars($file),
                'url' => 'musicsave/' . rawurlencode($file),
                'date' => date("Y-m-d", filemtime($dir . $file))
            ];
        }
    }
}

usort($musicList, function($a, $b) { return strtotime($b['date']) - strtotime($a['date']); });
echo json_encode(['status' => 'success', 'data' => $musicList]);
?>