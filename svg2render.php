<?php

if (!empty($_POST["filename"]) && !empty($_POST["data"]) && substr($_POST["data"], 0, 5) == "<svg ") {
	$filename = $_POST["filename"];
	$svg = new SimpleXMLElement(trim($_POST["data"]));
	$path_info = pathinfo($filename);
	$ext = $path_info['extension'];
	if ($svg && $ext && in_array(strtolower($ext), array("png", "jpg", "jpeg", "pdf"))) {
		$timeout = 200;
		$width = $svg['width'];
		$height = $svg['height'];
		$svg_filename = "svg-".rand()."-".rand().".svg";
		$svg_file = getcwd().DIRECTORY_SEPARATOR.$svg_filename;
		$render_filename = "tmp-".rand()."-".rand().".".strtolower($ext);
		$handle = fopen($svg_file, "w");

		// !! bug fix since WebKit doesn't currently support local or woff format in @font-face !!
		//	http://code.google.com/p/phantomjs/issues/detail?id=247
		$svg_mod = $_POST["data"];
		$svg_mod = preg_replace("/local.*?\,/i", "", $svg_mod);
		$svg_mod = preg_replace("/format\(\'woff\'\)/i", "", $svg_mod);
		$woff = array();
		$ttf = array();
		preg_match_all("/static\/fonts\/.*?(woff|ttf)/", $svg_mod, $matches);
		foreach ($matches[0] as $value) {
			$arr = preg_split("/\//", $value);
			if (strrpos($value, ".woff")) {
				$woff[$arr[2]] = $value;
			} else if (strrpos($value, ".ttf")) {
				$ttf[$arr[2]] = $value;
			}
		}
		foreach ($woff as $key => $value) {
			if ($ttf[$key]) {
				$svg_mod = str_replace($value, $ttf[$key], $svg_mod);
			}
		}
		$svg_mod = preg_replace("/\<font-face.*?\/font-face\>/", "", $svg_mod);
		// !! end of bug fix !!

		fwrite($handle, $svg_mod);
		fclose($handle);

		$phantomjs = 	"var page = require(\"webpage\").create();\n".
				"page.viewportSize = { \"width\":".$width.", \"height\":".$height." };\n".
				"page.open('".$svg_filename."', function (status) {\n".
				"	if (status !== 'success') {\n".
				"		phantom.exit();\n".
				"	} else {\n".
				"		window.setTimeout(function () {\n".
				"			page.render('".$render_filename."');\n".
				"			phantom.exit();\n".
				"		}, ".$timeout.");\n".
				"	}\n".
				"});";

		$js_file = tempnam(getcwd(), "tjs");
		$handle = fopen($js_file, "w");
		fwrite($handle, $phantomjs);
		fclose($handle);

		$svg = shell_exec("phantomjs \"".$js_file."\"");

		unlink($js_file);
		unlink($svg_file);

		header('refresh: 0; url=render2prompt.php?filename='.rawurlencode($filename).'&temp='.rawurlencode($render_filename));
		echo "redirect";
		exit();

	}
}

// error handling
header('Content-Description: File Transfer');
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename=error.txt');
header('Content-Transfer-Encoding: binary');
header('Expires: 0');
header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
header('Pragma: public');
header('Content-Length: '.strlen("render error"));
echo "render error";
exit();
