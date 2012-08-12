<?php

$svg = "<svg />";

if (!empty($_POST["data"]) && substr($_POST["data"], 0, 5) == "{}&&[") {

	$json = $_POST["data"];
	$timeout = 15000;	// 15-second timeout

	// http://www.webcheatsheet.com/PHP/get_current_page_url.php
	$pageURL = 'http';
	if (isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] == "on") {
		$pageURL .= "s";
	}
	$pageURL .= "://";
	if ($_SERVER["SERVER_PORT"] != "80") {
		$pageURL .= $_SERVER["SERVER_NAME"].":".$_SERVER["SERVER_PORT"].$_SERVER["REQUEST_URI"];
	} else {
		$pageURL .= $_SERVER["SERVER_NAME"].$_SERVER["REQUEST_URI"];
	}
	$webpage = dirname($pageURL)."/json2svg-page.php";

	$width = 1024;
	$height = 768;
	$j = json_decode(substr($json,4));
	if (isset($j[0]->{"bbox"}) && isset($j[0]->{"bbox"}->{"width"})) {
		$width = intval($j[0]->{"bbox"}->{"width"});
	}
	if (isset($j[0]->{"bbox"}) && isset($j[0]->{"bbox"}->{"height"})) {
		$height = intval($j[0]->{"bbox"}->{"height"});
	}

	$phantomjs = 	"var page = require(\"webpage\").create();\n".
			"page.viewportSize = { \"width\":".$width.", \"height\":".$height." };\n".
			"page.onConsoleMessage = function(msg){\n".
			"	console.log(msg);\n".
			"	if (msg.substring(0,5) == \"<svg \") phantom.exit();\n".
			"};\n".
			"page.includeJs(\"http://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js\", function(){\n".
			"	page.onLoadFinished = function(status){\n".
			"		window.setTimeout(phantom.exit, ".$timeout.");\n".
			"	};\n".
			"	page.open('".$webpage."', 'post', 'json=".rawurlencode($json)."');\n".	
			"});";

	$js_file = tempnam(sys_get_temp_dir(), "tjs");
	$handle = fopen($js_file, "w");
	fwrite($handle, $phantomjs);
	fclose($handle);

	$svg = shell_exec("phantomjs \"".$js_file."\"");

	unlink($js_file);

}

echo "<html><body><textarea>".$svg."</textarea></body></html>";

exit();
