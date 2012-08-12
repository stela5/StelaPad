
/* === global references === */

var pad = null;
var metadata = {
		"ready":false,
		"name":"project 1",
		"filereader":false,
		"isBackground":false,
		"fontCache":{"Helvetica":null},
		"fontCount":1
};
var toolbar = {
	"text":{
		"size":"40px",
		"color":"#000000",
		"family":"Helvetica"
	},
	"addFontFamily":function(f){
		if (f && f.length > 1 && pad && !(f in metadata.fontCache)) {
			// update font count
			metadata.fontCount += 1;
			// save font
			$("#gwf-"+f.replace(/ /g,"-")).attr("id", "sp-"+f.replace(/ /g,"-"));
			metadata.fontCache[f] = null;
			// add font
			$(".dropdown ul").append('<li><a href="#" style="font-family:\''+f+'\'">'+f+'</a></li>');
			$("#tile-"+f.replace(/ /g,"-")).fadeOut(800);
			pad.loadFont(f);
		} else {
			$("#tile-"+f.replace(/ /g,"-")).fadeOut(800);
		}
	},
	"fontClicked":function(f){
		if (f == "Add more...") {
			// load google web font popup
			$("#tinymask").show();
			$("#gwf").show();
			$(".gwf").css("height",$("#gwf").height()*0.85);
		} else {
			// set font
			$(".dropdown dt a span").html((f.length <= 14) ? f : f.substring(0,14)+"...");
			toolbar.text.family = f;
			var id = pad.selected.id;
			var group = (pad.groups[pad.selected.id]) ? pad.groups[pad.selected.id] : null;
			var child = (group && group.child && pad.groups[group.child]) ? pad.groups[group.child] : null;
			if (group && group.text) {
				group.text.updateText({"family":toolbar.text.family});
			} else if (child && child.text) {
				child.text.updateText({"family":toolbar.text.family});
				pad.deselectAll();
				pad.select(id);
			}
		}
		$(".dropdown dd ul").hide();
	}
};
function status(data, type){
	// loosely coupled notification function
	var log = true;
	var cssClass = "info";
	switch(type){
		case "project name":
			log = false;	// not logged
			metadata.name = "" + data;
			$("#project").html(metadata.name);
			break;
		case "selected":
			log = false;	// not logged
			if (data.family) {
				$(".dropdown dt a span").html((data.family.length <= 14) ? data.family : data.family.substring(0,14)+"...");
				toolbar.text.family = data.family;
			}
			if (data.color && data.color.charAt(0) == "#") {
				$("#colorPicker").val(data.color);
				$(".color_picker").css("background-color", data.color);
				toolbar.text.color = data.color;
			}
			break;
		case "font error":
			if (pad.selected.id && pad.groups[pad.selected.id] && pad.groups[pad.selected.id].text) {
				toolbar.text.family = pad.groups[pad.selected.id].text.font.family.replace(/\'/g,'');
			} else {
				toolbar.text.family = "Helvetica";
			}
			$(".dropdown dt a span").html(toolbar.text.family);
			cssClass = "error";
			data = "Invalid Font: "+data;
			$("#statusImg").attr("src","assets/img/icons/exclamation-red-frame.png");
			break;
		case "error":
			cssClass = "error";
			$("#statusImg").attr("src","assets/img/icons/exclamation-red-frame.png");
			break;
		case "warn":
			cssClass = "warn";
			$("#statusImg").attr("src","assets/img/icons/exclamation.png");
			break;
		case "info":
			$("#statusImg").attr("src","assets/img/icons/information-frame.png");
			break;	
		case "wait":
			$("#statusImg").attr("src","assets/img/spinner.gif");
			break;
		case "ready":
			metadata.ready = true;
			// configure modal menu
			$("#btnNew").click(function(){
				var d = (pad && pad.surface) ? pad.surface.getDimensions() : null;
				if (d && d.width && d.height) {
					$("#surfaceWidth").val(d.width);
					$("#surfaceHeight").val(d.height);
				}
				$("#tinymask").hide();
				$("#tinybox").hide();
				$("#resizeSurfaceDialog").dialog("open");
			});
			$("#btnImage").click(function(){
				metadata.isBackground = true;
				$("#tinymask").hide();
				$("#tinybox").hide();
				$("#openImageDialog").dialog("open");
			});
			$("#btnProject").click(function(){
				$("#tinymask").hide();
				$("#tinybox").hide();
				$("#openProjectDialog").dialog("open");
			});
			$("#close").click(function(){
				$("#tinymask").hide();
				$("#tinybox").hide();
			});
			$("#close2").click(function(){
				$("#tinymask").hide();
				$("#gwf").hide();
				// clear temporary stylesheets
				$('[id^="gwf-"]').remove();
				// re-bind the click event for the newly added font links
				$('.dropdown dd ul li a').unbind('click');
				$(".dropdown dd ul li a").click(function() {
					toolbar.fontClicked($(this).html());
				});
			});
			$("#tinybox").css("height", "250px");
			$("#loading").css("display", "none");
			$("#close").css("display", "block");
			$("#loaded").css("display", "block");
			// reset status icon
			$("#statusImg").attr("src","assets/img/icons/application-monitor.png");
			break;
		default:
			$("#statusImg").attr("src","assets/img/icons/application-monitor.png");
	}
	if (log) {
		var warn = false;
		var d = new Date();
		var time = ""+d.getHours()+":"+d.getMinutes()+":"+d.getSeconds()+"."+d.getMilliseconds();
		$('#statusTable > tbody:first').prepend('<tr><td>'+time+'</td><td class="'+cssClass.toString()+'">'+cssClass.toString()+'</td><td>'+data.toString()+'</td></tr>');
		// large base64 images and projects take awhile to load into pad so trigger close with async response
		if (data == "Background loaded" || data == "Image loaded") {
			$("#imageUploadingPleaseWait").css("display","none");
			$("#openImageDialog").dialog("close");
			warn = true;
		} else if (data == "Project loaded") {
			$("#projectLoadingPleaseWait").css("display","none");
			$("#openProjectDialog").dialog("close");
			warn = true;
			// re-bind the click event for the newly added font links
			$('.dropdown dd ul li a').unbind('click');
			$(".dropdown dd ul li a").click(function() {
				toolbar.fontClicked($(this).html());
			});
		} else if (data == "Shape loaded") {
			warn = true;
		}
		// warn user if surface will be cleared
		if (warn) {
			setTimeout(function(){
				$("#projectWarning").css("display","block");
				$("#imageWarning").css("display","block");
				$(".warn").removeClass("hide");
			}, 500);
		}
	}
}

/* === end of global references === */

// load jQuery
$(document).ready(function() {

	// load Dojo
	require(["dojo/ready", "dojo/dom", "dojo/_base/config", "dojo/_base/json", "dojox/gfx", "dojox/stelapad/Pad", "dojo/domReady!"],
	function(ready, dom, config, jsonLib, g, Pad){
		
		// load StelaPad
		ready(init);
	
		function init(){
			
			if (config.isDebug) { console.log("Dojo is ready"); }
			
			// detect if browser supports the FileReader API
			metadata.filereader = (typeof window.FileReader !== 'undefined') ? true : false;
			if (metadata.filereader) $("#html5icon").css("visibility","visible");
			
			// configure accordion
			$("#accordion").accordion({ header: "h3", fillSpace: true });
	
			// set accordion to be resizable
			$("#accordionResizer").resizable({
				minHeight: 200,
				minWidth: 235,
				maxHeight: 450,
				maxWidth: 750,
				resize: function() {
					$( "#accordion" ).accordion( "resize" );
				}
			});
	
			// enable drag/drop
			$(".img-content").draggable({
				helper: 'clone',
				appendTo: 'body'
			});
			$(".droppable-photos-container").droppable({
				accept: ".img-content",
				drop: function( event, ui ) {
					if (pad) {
						pad.addGroup({"json":"assets/img/accordion/"+ui.draggable.context.id+".json","clientX":ui.position.left,"clientY":ui.position.top});
					}
				}
			});

			// hide warning messages until surface has been modified
			$(".warn").addClass("hide");			
			
			// reset font on page refresh
			$(".dropdown dt a span").html("Helvetica");
			$("#colorPicker").val("#000000");
	
			// reset image url
			$('#imageUrl').val("http://");
	
			// color picker configuration
		    $("#colorPicker").change(function(){
		    	if ($("#colorPicker").val() == "transparent") {
		    		toolbar.text.color = "#000000";
		    	} else {
		    		toolbar.text.color = $(this).val();
		    	}
		    	var id = pad.selected.id;
		    	var group = (pad.groups[pad.selected.id]) ? pad.groups[pad.selected.id] : null;
				var child = (group && group.child && pad.groups[group.child]) ? pad.groups[group.child] : null;
				if (group && group.text) {
					group.text.updateText({"color":toolbar.text.color});
				} else if (child && child.text) {
					child.text.updateText({"color":toolbar.text.color});
					pad.deselectAll();
					pad.select(id);
				}
		    });
		
			// initialize color picker
			$('#colorPicker').colorPicker();
	
			status("Pad loading...", "wait");
			
			// configure font dropdown...			
			if (g.renderer == "vml") {
				// since VML doesn't support WOFF/EOT, hide font dropdown
				$("#liDropdown").hide();
			} else {
				// close dropdown if clicked
				$(".dropdown dt a").click(function() {
				    $(".dropdown dd ul").toggle();
				});
				
				// bug fix -- close dropdown if document is clicked
				$(document).bind('click', function(e) {
				    var $clicked = $(e.target);
				    if (! $clicked.parents().hasClass("dropdown"))
				        $(".dropdown dd ul").hide();
				});
				
				// font selected
				$(".dropdown dd ul li a").click(function() {
					toolbar.fontClicked($(this).html());
				});
				
				//initialize variables
				var fonts = {"A":[],"B":[],"C":[],"D":[],"E":[],"F":[],"G":[],"H":[],"I":[],"J":[],"K":[],"L":[],"M":[],"N":[],"O":[],"P":[],"Q":[],"R":[],"S":[],"T":[],"U":[],"V":[],"W":[],"X":[],"Y":[],"Z":[]};
				var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
				
				// set initial letter to load (note: "A" has a lot of fonts which will be slow for users with slow bandwidth so start with a simpler letter like "Q" or "Z")
				var current = alphabet.indexOf("Z");
				
				//display font page for specified letter
				function displayFonts(letter){
					if (/^[A-Z]/.test(letter)) {
						// clear temporary stylesheets
						$('[id^="gwf-"]').remove();
						// clear previous contents
						$(".gwf div:eq("+alphabet.indexOf(letter)+")").empty();
						// load current letter stylesheets
						// IE restriction of 31: http://support.microsoft.com/kb/262161
						var maxStyleSheetCount = ($.browser.msie) ? 25 : 100;
						var currentStylesheetCount = metadata.fontCount;
						$(".alphabet a:eq("+current+")").css("color", "#3AAD46");
						$.each(fonts[letter], function(index, value) {
							if (currentStylesheetCount <= maxStyleSheetCount) {
								// add font tile
								if (!(value in metadata.fontCache)){
									var objHead = document.getElementsByTagName("head");
									if (objHead[0]){
										currentStylesheetCount += 1;
										var objCSS = objHead[0].appendChild(document.createElement("link"));
										objCSS.id = "gwf-"+value.replace(/ /g,"-");
										objCSS.rel = "stylesheet";
										objCSS.href = "//fonts.googleapis.com/css?family="+value.replace(/ /g,"+");
										objCSS.type = "text/css";
									}
									var a = '<a id="tile-'+value.replace(/ /g,"-")+'" href="javascript:toolbar.addFontFamily(\''+value+'\');"><span style="font-family:\''+value+'\';">'+value+'</span></a>';
									$(".gwf div:eq("+alphabet.indexOf(letter)+")").append(a);
								}
							}
						});
						// show new page
						$("#gwfLoading").hide();
						$(".gwf div:eq("+current+")").show();
					}
				}

				//menu letter click
				$(".alphabet a").click(function(){
					
					var letter = $(this).html();
					
					// hide old page
					$(".alphabet a:eq("+current+")").css("color", "gray");
					$(".gwf div:eq("+current+")").hide();
					$("#gwfLoading").show();
					current = alphabet.indexOf(letter);
					$(".alphabet a:eq("+current+")").css("color", "#3AAD46");
					
					setTimeout(function(){
						displayFonts(letter);
					}, 1000);
				});

				// populate font list
				$.ajax({
					url: "webfonts.php",
					dataType: "json",
					context: document.body
				}).done(function(data) {
					// populate initial page
					if (data && data.items) {
						$.each(data.items, function(index, value) { 
							if (value && value.family && /^[A-Z]/.test(value.family) && value.subsets.indexOf("latin") >= 0 && (value.variants.indexOf("regular") >= 0 || value.variants.indexOf("400") >= 0)) {
								fonts[value.family.charAt(0)].push(value.family);
							}
						});
					}
					displayFonts(alphabet.charAt(current));
				});

			}

			// create pad
			pad = new Pad("sp",{"offset":{"right":300,"bottom":192},"status":status,"toolbar":toolbar});
			
			// configure toolbar actions
			$("#newProject").click(function(){
				$("#tinymask").show();
				$("#tinybox").show();
			});
			$("#saveProject").click(function(){
				pad.saveProject({"name":metadata.name});
			});
			$("#saveSvg").click(function(){
				pad.exportProject({"name":metadata.name});
			});
			$("#saveImage").click(function(){
				pad.renderProject({"name":metadata.name});
			});
			$("#savePdf").click(function(){
				pad.renderProject({"name":metadata.name,"format":"pdf"});
			});
			$("#openProject").click(function(){
				$("#openProjectDialog").dialog("open");
			});
			$("#renameProject").click(function(){
				$("input#renameProjectText").val(metadata.name);
				$("#renameProjectDialog").dialog("open");
			});
			$("#clearSurface").click(function(){
				$("#clearSurfaceDialog").dialog("open");
			});
			$("#moveToFront").click(function(){
				pad.moveSelectedToFront();
			});
			$("#moveToBack").click(function(){
				pad.moveSelectedToBack();
			});
			$("#rotateRight").click(function(){
				pad.rotateSelectedBy(15);
			});
			$("#rotateLeft").click(function(){
				pad.rotateSelectedBy(-15);
			});
			$("#rotateReset").click(function(){
				pad.rotateSelectedBy("reset");
			});
			$("#scaleToFit").click(function(){
				pad.scaleToFit();
			});
			$("#removeSelected").click(function(){
				pad.removeSelected();
			});
			$("#deselectAll").click(function(){
				pad.deselectAll();
			});
			$("#setBackground").click(function(){
				metadata.isBackground = true;
				$("#imageWarning").css("display","block");
				$("#openImageDialog").dialog("open");
			});
			$("#addImage").click(function(){
				metadata.isBackground = false;
				$("#imageWarning").css("display","none");
				$("#openImageDialog").dialog("open");
			});
			$("#resizeSurface").click(function(){
				var d = (pad && pad.surface) ? pad.surface.getDimensions() : null;
				if (d && d.width && d.height) {
					$("#surfaceWidth").val(d.width);
					$("#surfaceHeight").val(d.height);
				}
				$("#resizeSurfaceDialog").dialog("open");
			});
			$("#resizeSurfaceButton").click(function(){
				metadata.name = "project 1";
				$("#project").html(metadata.name);
				var w = 0 + parseInt($("#surfaceWidth").val());
				var h = 0 + parseInt($("#surfaceHeight").val());
				if (w > 0 && h > 0) {
					pad.fullSize = {"width":w,"height":h};
					pad.resize(pad.fullSize);
				}
				$("#resizeSurfaceDialog").dialog("close");
			});
			$("#status").click(function(){
	            $("#statusDialog").dialog("open");
			});
			$("#imageUrl").click(function(){
				$(this).val("");
			});
			
			// configure dialogs
			$("#openProjectDialog").dialog({
				resizable: false,
				height:275,
				modal: true,
				autoOpen: false,
				buttons: {
					"Cancel": function() {
						$(this).dialog("close");
					}
				}
			});
			$("#renameProjectDialog").dialog({
				resizable: false,
				height:200,
				modal: true,
				autoOpen: false,
				buttons: {
					"Save": function() {
						var name = $.trim($("input#renameProjectText").val()).replace(/\s/g,' ').replace(/[\\:"<>\/\*\?\|\']/g,'');
						if (name.length > 0 && name != "." && name !="..") {
							metadata.name = name;
							$("#project").html(name);
						}
						$(this).dialog("close");
					},
					"Cancel": function() {
						$(this).dialog("close");
					}
				}
			});
			$("#clearSurfaceDialog").dialog({
				resizable: false,
				height:200,
				modal: true,
				autoOpen: false,
				buttons: {
					"Continue": function() {
						pad.clearSurface();
						$(this).dialog("close");
					},
					"Cancel": function() {
						$(this).dialog("close");
					}
				}
			});
			$("#openImageDialog").dialog({
				resizable: false,
				height:275,
				modal: true,
				autoOpen: false,
				buttons: {
					"Cancel": function() {
						$(this).dialog("close");
					}
				}
			});
			$("#resizeSurfaceDialog").dialog({
				resizable: false,
				height:275,
				modal: true,
				autoOpen: false,
				buttons: {
					"Cancel": function() {
						$(this).dialog("close");
					}
				}
			});
			$("#statusDialog").dialog({
				height:200,
				width:500,
				autoOpen:false
			});
			
			// configure 'Open Project' menu option
			if (metadata.filereader) {	// browser supports File Reader API
				// open project:
				var openProjectInput = document.getElementById("openProjectFile");
				openProjectInput.onchange = function(e) {
					e.preventDefault();  // prevent navigation to "#"
					var file = openProjectInput.files[0];
					$("#projectLoadingPleaseWait").css("display","block");
					status("Loading "+file.name+" ...", "wait");
					toolbar.color="#000000";
					toolbar.family="Helvetica";
					$(".dropdown dt a span").html("Helvetica");
					$("#colorPicker").val("#000000");
					$(".color_picker").css("background-color", "rgb(0, 0, 0)");
					if (/\.json$/i.test(file.name)) {
						var reader = new FileReader();
						reader.onload = function(event) {
							if(/^data:(.*);?base64,/i.test(event.target.result)) {
								var base64 = event.target.result.replace(/^data:(.*);?base64,/i,'');
								var jsonString = $.ostermiller.decodeBase64(base64);
								if (jsonString.substr(0,4) == "{}&&") {
									// reset font dropdown
									metadata.fontCache = {"Helvetica":null};
									$('.dropdown li:not(:first)').remove();
									$(".dropdown ul").append('<li><a href="#" style="font-family:\'Helvetica\'">Helvetica</a></li>');
									var json = jsonLib.fromJson(jsonString);
									pad._loadProjectCallback(json);
								} else {
									$("#openProjectDialog").dialog("close");
									status("Invalid project","error");
								}
							} else {
								$("#openProjectDialog").dialog("close");
								status("Invalid project","error");
							}
						};
						reader.readAsDataURL(file);
					} else {
						$("#openProjectDialog").dialog("close");
						status("Invalid project","error");
					}
					return false;
				};
			} else {	// browser does not support File Reader API
				// initialize jquery file upload
				$('#openProjectFile').fileupload({
					dropZone: null,
					dataType: 'json',
					url: 'uploads/',
					paramName: 'files[]',
					send: function (e, data) {
						$.each(data.files, function (index, file) {
							$("#projectLoadingPleaseWait").css("display","block");
							status("Loading "+file.name+" ...", "wait");
						});
					},
					done: function (e, data) {
						$.each(data.result, function (index, file) {
							pad.loadProject({"json":file.url});
						});
					}
				});
			}		
					
			// configure 'Open Image' option
			// url
			$("#imageUrlButton").click(function(){
				var url = $("#imageUrl").val();
				if (/^(https?|ftp):\/\/(.*?)\.(jpe?g|png|gif)$/i.test(url)) {
					if (metadata.isBackground === true) {
						metadata.name = "project 1";
						$("#project").html(metadata.name);
					}
					$("<img>", {
				        src: url + "?" + new Date().getTime(),	// prevent IE caching
				        error: function() { $("#imageUrl").val("Invalid image"); },
				        load: function() {
				        	if (metadata.isBackground === true) {
					        	pad.setBackground({"image":url});
					        	$("#openImageDialog").dialog("close");
					        	metadata.isBackground = false;
				        	} else {
				        		pad.addGroup({"image":url,"clientX":0,"clientY":0});
				        		$("#openImageDialog").dialog("close");
				        	}
				        }
				    });
				} else {
					$("#imageUrl").val("Invalid image");
				}
			});
			// local upload
			if (metadata.filereader) {	// browser supports File Reader API
				// open image:
				var openImageInput = document.getElementById("image");
				openImageInput.onchange = function(e) {
					if (metadata.isBackground === true) {
						metadata.name = "project 1";
						$("#project").html(metadata.name);
					}
					$("#imageUploadingPleaseWait").css("display","block");
					e.preventDefault();  // prevent navigation to "#"
					var file = openImageInput.files[0];
					if (/\.(jpe?g|png|gif)$/i.test(file.name)) {
						var reader = new FileReader();
						reader.onload = function(event) {
							if(/^data:image\/(png|jpeg|gif);?base64,/i.test(event.target.result)) {
								var result = "";
								var max = 8000;
								if (event.target.result.length <= max || event.target.result.charAt(max) == "\n") {
									result = event.target.result;
								} else {
									// add newline breaks
									var l = event.target.result.length;
									for (var c = 0; c < l; c += max) {
										result += event.target.result.substring(c, (c + max)) + "\n";
									};
									result += event.target.result.substring(c);
									// catch hanging new line
									if (result.charAt(result.length-1) == "\n") result = result.slice(0, -1); 
								}
								if (metadata.isBackground === true) {
									pad.setBackground({"image":result});
									metadata.isBackground = false;
					        	} else {
					        		pad.addGroup({"image":result,"clientX":0,"clientY":0});
					        	}
							} else {
								$("#openImageDialog").dialog("close");
								status("Invalid image","error");
							}
						};
						reader.readAsDataURL(file);
					} else {
						$("#openImageDialog").dialog("close");
						status("Invalid image","error");
					}
					return false;
				};
			} else {	// browser does not support File Reader API
				// upload to imm.io
				$("#xd").load(function(){
					var result = jQuery.parseJSON($("#xd").contents().find("body").html());
					if (result && result.payload && result.payload.uri && /\.(jpe?g|png|gif)$/i.test(result.payload.uri)) {
						if (metadata.isBackground === true) {
							pad.setBackground({"image":result.payload.uri});
							setTimeout(function(){
								$("#imageUploadingPleaseWait").css("display","none");
								$("#openImageDialog").dialog("close");
							},1500);
							metadata.isBackground = false;
						} else {
							pad.addGroup({"image":result.payload.uri,"clientX":0,"clientY":0});
							$("#openImageDialog").dialog("close");
						}
					} else if (result) {
						$("#imageUploadingPleaseWait").css("display","none");
						$("#openImageDialog").dialog("close");
						status("Invalid image","error");
					}
				});
				var openImageInput = document.getElementById("image");
				openImageInput.onchange = function(e) {
					if (metadata.isBackground === true) {
						metadata.name = "project 1";
						$("#project").html(metadata.name);
					}
					$("#imageUploadingPleaseWait").css("display","block");
					$("#imageForm").submit();
				};
			}		
			
		}
		
	});

});
