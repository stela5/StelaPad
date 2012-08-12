<?php

$filename = "error.txt";
if (!empty($_POST["filename"])) $filename = $_POST["filename"];
$data = "error";
if (!empty($_POST["data"])) $data = $_POST["data"];

header('Content-Description: File Transfer');
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename='.basename($filename));
header('Content-Transfer-Encoding: binary');
header('Expires: 0');
header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
header('Pragma: public');
header('Content-Length: '.strlen($data));

echo $data;

exit();
