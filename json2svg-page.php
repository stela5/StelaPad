<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en"
  xmlns:svg="http://www.w3.org/2000/svg"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:xlink="http://www.w3.org/1999/xlink">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<script src="assets/scripts/dojo-release-1.7.3-src/dojo/dojo.js" data-dojo-config="async:true,isDebug:false,gfxRenderer:'svg',forceGfxRenderer:'svg'"></script>
<script src="assets/scripts/blur-2.0.js"></script>
<script src="assets/scripts/shadow-2.0.js"></script>
<?php 
	if (!empty($_POST["json"])) {
		echo "<script>var jsonTemp = ".rawurldecode($_POST["json"]).";</script>";
	}
?>
</head>
<body>
	<div id="sp"></div>
	<script type="text/javascript">
		var pad = null;
		if (typeof jsonTemp != "undefined") {
			require(["dojo/ready", "dojox/stelapad/Pad", "dojo/domReady!"],
			function(ready, Pad){
				ready(init);
				function init(){
					pad = new Pad("sp");
					window.setTimeout("pad._json2svg(jsonTemp)",1000);
				}
			});
		}
	</script>
</body>
</html>
