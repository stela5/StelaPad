<?php

if (!empty($_GET["filename"]) &&!empty($_GET["temp"]) && substr(rawurldecode($_GET["temp"]), 0, 4) == "tmp-" && file_exists(rawurldecode($_GET["temp"]))) {

	header('Content-Description: File Transfer');
	header('Content-Type: application/octet-stream');
	header('Content-Disposition: attachment; filename='.basename(rawurldecode($_GET["filename"])));
	header('Content-Transfer-Encoding: binary');
	header('Expires: 0');
	header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
	header('Pragma: public');
	header('Content-Length: '.filesize(rawurldecode($_GET["temp"])));
	ob_clean();
	flush();
	readfile(basename(rawurldecode($_GET["temp"])));
	unlink(basename(rawurldecode($_GET["temp"])));
	exit();

}

exit();
