<?php

error_reporting(E_ALL | E_STRICT);

require('upload.class.php');

$upload_handler = new UploadHandler();

header('Pragma: no-cache');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Content-Disposition: inline; filename="files.json"');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: OPTIONS, HEAD, GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: X-File-Name, X-File-Type, X-File-Size');

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
	$upload_handler->post();
} else {
	header('HTTP/1.1 405 Method Not Allowed');
}
