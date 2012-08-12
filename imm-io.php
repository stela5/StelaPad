<?php

if (isset($_FILES['image']) && is_uploaded_file($_FILES['image']['tmp_name'])) {
	$post = array("image"=>"@".$_FILES['image']['tmp_name']);
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_HEADER, false);
	curl_setopt($ch, CURLOPT_VERBOSE, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/4.0 (compatible;)");
	curl_setopt($ch, CURLOPT_URL, "http://imm.io/store/");
	curl_setopt($ch, CURLOPT_POST, true);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $post); 
	$response = curl_exec($ch);
	if (!empty($response) && substr($response,0,26)=='{"success":true,"payload":') echo $response;
	else echo '{"success":false,"payload":"error uploading"}';
}
