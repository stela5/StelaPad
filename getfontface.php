<?php
// Description: Returns json object with Google font-face in woff and ttf, if available
// Usage:
//	Bold Italic: get-font-face.php?family=Lobster+Two:700italic
//	Italic: get-font-face.php?family=Lobster+Two:400italic
//	Bold: get-font-face.php?family=Lobster+Two:700
//	Regular: get-font-face.php?family=Lobster+Two:400

// setup
$headers[] = 'Connection: Keep-Alive';
$headers[] = 'Content-type: application/x-www-form-urlencoded;charset=UTF-8';
$woff_user_agent = 'Mozilla/5.0 (Windows NT 6.1.1; rv:5.0) Gecko/20100101 Firefox/5.0';
$ttf_user_agent = 'Mozilla/5.0 (X11; Linux) Gecko Firefox/5.0';
$compression = 'gzip'; 
$proxy = null;
$family = '';
if (isset($_GET['family'])) $family = preg_replace('/\s/', '+', $_GET['family']);
$url = 'http://fonts.googleapis.com/css?family='.$family;

// initialize curl
$process = curl_init();
curl_setopt($process, CURLOPT_URL, $url);
curl_setopt($process, CURLOPT_HTTPHEADER, $headers); 
curl_setopt($process, CURLOPT_HEADER, 0); 
curl_setopt($process, CURLOPT_USERAGENT, $woff_user_agent); 
curl_setopt($process, CURLOPT_ENCODING , $compression); 
curl_setopt($process, CURLOPT_TIMEOUT, 10);
if ($proxy) curl_setopt($process, CURLOPT_PROXY, $proxy); 
curl_setopt($process, CURLOPT_RETURNTRANSFER, 1); 
curl_setopt($process, CURLOPT_FOLLOWLOCATION, 1); 

// get woff font
$woff = curl_exec($process);
if (substr($woff,0,10) != "@font-face") $woff = null;
else $woff = preg_replace('/\n/', ' ', $woff);

// get ttf font
curl_setopt($process, CURLOPT_USERAGENT, $ttf_user_agent);
$ttf = curl_exec($process);

// close connection
curl_close($process);

// convert ttf web format to svg font format
if (substr($ttf,0,10) != "@font-face") $ttf = null;
else {
	preg_match("/http\:.*?ttf/", $ttf, $matches);
	if (count($matches) > 0) $ttf = $matches[0];
}

$arr = array('woff' => $woff, 'ttf' => $ttf);
echo json_encode($arr);
return;
