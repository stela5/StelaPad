"use strict";	// ES5 Strict
define(["dojo/_base/declare", "dojo/_base/kernel", "dojo/_base/xhr", "dojo/_base/lang", "dojo/_base/config", "dojo/_base/connect", "dojo/_base/json", "dojo/_base/window", "dojo/window", "dojo/_base/html", "dojo/has", "dojo/dom", "dojo/dom-geometry", "dojo/dom-attr", "dojo/dom-style", "dojo/dom-construct", "dojo/io/iframe", "dojox/gfx", "dojox/gfx/utils", "dojox/stelapad/utils", "dojox/stelapad/Group", "dojox/stelapad/Mouse", "dojo/_base/sniff"],
    function(declare, kernel, xhr, lang, config, connect, jsonLib, win, window, html, has, dom, domGeom, domAttr, domStyle, domConstruct, iframe, g, utils, extendUtils, Group, Mouse){
	return declare("dojox.stelapad.Pad", null, {
		constructor: function(divId, params){
			this.ready = false;
			this.div = divId;
			this.position = null;
			this.surface = null;
			this.gfx = null;	// main group
			this.background = null;	// background group
			this.groups = {};
			this.selected = {};
			this.mouse = null;
			this.shiftKey = false;
			this.ctrlKey = false;
			this.keyDownHandle = null;
			this.keyUpHandle = null;
			this.keysEnabled = false;
			this.scale = 1.0;
			this.postDeferred = null;
			this.offset = (params && params.offset) ? params.offset : {"right":0,"bottom":0};
			this.status = (params && params.status) ? params.status : function(data, type){};
			this.DEFAULT_CURSOR = (has("ie") <= 7) ? "default" : "inherit";
			this.toolbar = (params && params.toolbar) ? params.toolbar : {};
			this.fullSize = null;
			this.relationships = {};	// oldChildId:oldParentId
			this.projectIdMap = {};		// oldId:newId

			this._init(params);
		},
		
		_init: function(params){
			this.surface = g.createSurface(this.div, 1, 1);	// initial load
			// 'whenLoaded' fires when asyncronous surface creation completes; add slight delay for some browsers
			this.surface.whenLoaded(this, function(){
				setTimeout(lang.hitch(this, function(){
					if (this.surface.defNode) utils.defNode = this.surface.defNode;
					this.gfx = this.surface.createGroup();	// use group as pseudo-surface (main)
					this.gfx.setTransform({"xx":1,"xy":0,"yx":0,"yy":1,"dx":0,"dy":0});
					this.background = this.gfx.createGroup();
					this.resize();
					this.mouse = new Mouse(this);
					connect.connect(this.mouse, "onMouseDown", this, "_onMouseDown");
					connect.connect(this.mouse, "onDblClick", this, "_onDblClick");
					this.enableKeys();
					this.ready = true;
					domStyle.set(this.div, "visibility", "visible");
					if (config.isDebug) { console.log("Surface created"); };
					// set body cursor back to normal
					this.status("Pad ready", "ready");
					this.status("Renderer = " + g.renderer);
				}),500);
			});
		},

		setBackground: function(bgObj, isProjectLoading){
			this.status("Background loading...", "wait");
			if (bgObj && bgObj.image && (/\.(jpe?g|png|gif)$/i.test(bgObj.image) || /^data:image\/(png|jpeg|gif);base64,/i.test(bgObj.image))) {
				if (isProjectLoading && this.fullSize) {
					// loading image from json project file
					this.background.setBoundingBox({"x":0,"y":0,"width":this.position.w,"height":this.position.h});
					var grp = {"background":bgObj.image};
					grp.marginBox = {"w":this.fullSize.width,"h":this.fullSize.height};
					if (bgObj.transform && bgObj.transform.xx) grp.transform = bgObj.transform;
					new Group(this, grp);
					this.deselectAll();
					this.status("Background loaded");
				} else {
					// temporarily load image into browser to get dimmensions
					var img = domConstruct.create("img", {"style":{"visibility":"hidden"}}, win.body());
					var handle = null;
					handle = connect.connect(img, "load", this, function(){
						// temp image loaded into browser, get size properties
						var mb = domGeom.getMarginBox(img);	// get image width (w) and height (h)
						domConstruct.destroy(img);	// remove temp image from browser
						connect.disconnect(handle);	// disconnect load callback
						this.fullSize = {"width":mb.w,"height":mb.h};
						// calculate surface size
						if (!isProjectLoading) this.resize(this.fullSize);
						this.background.setBoundingBox({"x":0,"y":0,"width":this.position.w,"height":this.position.h});
						// set image as background
						new Group(this, {"background":bgObj.image,"marginBox":mb});
						this.status("Background loaded");
					});
					domAttr.set(img, "src", bgObj.image);
				}
			} else {
				this.status("Background load failed", "error");
			}
		},

		_onMouseDown: function(e){
			this.deselectAll();
		},

		enableKeys: function(){
			if (!this.keysEnabled) {
				this.keysEnabled = true;
				this._detectSpecialKeys();
				this.keyUpHandle = connect.connect(document, "onkeyup", this, "_onKeyUp");
			}
		},

		_detectSpecialKeys: function(){			
			this.keyDownHandle = connect.connect(document, "onkeydown", this, function(e){
				if (e.keyCode == dojo.keys.SHIFT) this.shiftKey = true;
				if (e.keyCode == dojo.keys.CTRL) this.ctrlKey = true;
				connect.disconnect(this.keyDownHandle);
				this.keyDownHandle = null;
			});
		},
		
		_onKeyUp: function(e){
			// keyboard hook
			this._detectSpecialKeys();
			switch(e.keyCode){
				case dojo.keys.LEFT_ARROW:
					(e.shiftKey) ? this.moveSelectedBy(-10,0) : this.moveSelectedBy(-1,0);
					break;
				case dojo.keys.RIGHT_ARROW:
					(e.shiftKey) ? this.moveSelectedBy(10,0) : this.moveSelectedBy(1,0);
					break;
				case dojo.keys.UP_ARROW:
					(e.shiftKey) ? this.moveSelectedBy(0,-10) : this.moveSelectedBy(0,-1);
					break;
				case dojo.keys.DOWN_ARROW:
					(e.shiftKey) ? this.moveSelectedBy(0,10) : this.moveSelectedBy(0,1);
					break;
				case dojo.keys.SHIFT:
					this.shiftKey = false;
					break;
				case dojo.keys.CTRL:
					this.ctrlKey = false;
					break;
				case dojo.keys.DELETE:
					this.removeSelected();
					break;
				case dojo.keys.ESCAPE:
					this.deselectAll();
					break;
				case dojo.keys.HOME:
					if (e.shiftKey && e.ctrlKey) this.moveSelectedToFront();
					break;
				case dojo.keys.END:
					if (e.shiftKey && e.ctrlKey) this.moveSelectedToBack();
					break;
				case 219:	// "["
					if (e.shiftKey) {	// Firefox uses Ctrl+[ so use Shift+[ instead
						this.rotateSelectedBy(-90);
					} else if (e.altKey) {
						this.rotateSelectedBy(-1);
					} else {
						this.rotateSelectedBy(-15);
					}
					break;
				case 221:	// "]"
					if (e.shiftKey) {	// Firefox uses Ctrl+] so use Shift+] instead
						this.rotateSelectedBy(90);
					} else if (e.altKey) {
						this.rotateSelectedBy(1);
					} else {
						this.rotateSelectedBy(15);
					}
					break;
				case "0".charCodeAt(0):
					this.rotateSelectedBy("reset");
					break;
				case "S".charCodeAt(0):
					this.scaleToFit();
					break;
				/*	
				case "Z".charCodeAt(0):
					console.log((e.shiftKey) ? "Z" : "z");
					break;
				default:
					console.log(e.keyCode);
					break;
				*/
			}
		},

		disableKeys: function(){
			if (this.keysEnabled) {
				if (this.keyDownHandle) {
					connect.disconnect(this.keyDownHandle);
					this.keyDownHandle = null;
				}
				if (this.keyUpHandle) {
					connect.disconnect(this.keyUpHandle);
					this.keyUpHandle = null;
				}
				this.shiftKey = false;
				this.ctrlKey = false;
				this.keysEnabled = false;
			}
		},
		
		scaleToFit: function(){
			if (this.selected.id && this.groups[this.selected.id]) {
				this.groups[this.selected.id].scaleToFit();
			}
		},

		moveSelectedToBack: function(){
			if (this.selected.id && this.groups[this.selected.id]) {
				this.groups[this.selected.id].moveToBack();
				this.background.moveToBack();
			}
		},

		moveSelectedToFront: function(){
			if (this.selected.id && this.groups[this.selected.id]) {
				this.groups[this.selected.id].moveToFront();
			}
		},

		moveSelectedBy: function(x,y){
			if (this.selected.id && this.groups[this.selected.id]) {
				var shift = {"dx":(x)?x:0,"dy":(y)?y:0};
				var group = this.groups[this.selected.id];
				group.gfx.applyLeftTransform(shift);
				group.border.applyLeftTransform(shift);
				group.overlay.applyLeftTransform(shift);
				if (group.child && this.groups[group.child]) {
					this.groups[group.child].gfx.applyLeftTransform(shift);
				}
				group._updatePoints();
			}
		},

		rotateSelectedBy: function(d){
			if (d && this.selected.id && this.groups[this.selected.id]) {
				if (d == "reset") d = -this.groups[this.selected.id].angle;
				if (d >= -360 && d <= 360) this.groups[this.selected.id]._applyScaleRotate(null, d);
			}
		},

		addGroup: function(params){
			if (this.ready) return new Group(this, params);
		},

		removeSelected: function(){
			// remove selected group
			if (this.selected.id && this.groups[this.selected.id]) {
				if (this.groups[this.selected.id].child && this.groups[this.groups[this.selected.id].child]) {
					this.groups[this.groups[this.selected.id].child].destroy();
					delete this.groups[this.groups[this.selected.id].child];
				}
				this.groups[this.selected.id].destroy();
				delete this.groups[this.selected.id];
			}
		},

		select: function(id){
			// select a group (FIXME: currently only one group at a time may be selected)
			if (id !== this.selected.id) {
				this.deselectAll();
				this.selected.id = id;
				this.groups[id].select();
				if (config.isDebug) { console.log("Selected:",id); };
				var data = new Object();
				var group = (this.groups[this.selected.id]) ? this.groups[this.selected.id] : null;
				var child = (group && group.child && this.groups[group.child]) ? this.groups[group.child] : null;
				if (group && group.text) {
					var c = new dojo.Color(group.text.color);
					data.family = group.text.font.family.replace(/'/g,'');
					data.color = c.toHex();
				} else if (child && child.text) {
					var c = new dojo.Color(child.text.color);
					data.family = child.text.font.family.replace(/'/g,'');
					data.color = c.toHex();
				}
				this.status(data,"selected");
			}
		},

		deselectAll: function(){
			// deselect a group (FIXME: currently only one group at a time may be selected)
			if (dom.byId('tempDiv')) domConstruct.destroy('tempDiv');
			if (this.selected.id && this.groups[this.selected.id]) this.groups[this.selected.id].deselect();
			this.selected = {};
		},

		saveProject: function(params){
			// saves project as json file
			if (this.ready && params && params.name) {
				this.status("Saving project...", "wait");
				this.deselectAll();	// remove anchors
				var json = g.utils.serialize(this.surface);
				if (json) {
					json[0].name = params.name;	// add project name
					// save child:parent relationships
					var relationships = {};
					for (var group in this.groups) {
						if (this.groups[group].child) {
							relationships[this.groups[group].child] = group;
						}
					}
					json[0].relationships = relationships;
					// record full size dimmensions
					json[0].fullSize = this.fullSize;
					// security prefixing & pretty print
					var data = "{}&&" + jsonLib.toJson(json, true);
					// prompt user for "Save As..."
					if (this.postDeferred) {
						this.postDeferred.cancel();
						this.postDeferred = null;
					}
					var form = domConstruct.create("form", {"method":"POST"}, win.body());
					this.postDeferred = iframe.send({
						// http://docs.dojocampus.org/dojo/io/iframe
						"url": "post2prompt.php",
						"form": form,
						"content": {"filename":params.name.replace(/\s/g,'-').replace(/[\'"<>]/g,'')+".json","data":data}
					});
					domConstruct.destroy(form);
					this.status("Project saved");
				} else {
					this.status("Surface failed to serialize","error");
				}
			} else {
				this.status("Pad not ready","error");
			}
		},

		loadProject: function(params){
			// loads project from json file
			var extCheck = /(.json)$/i;	// verify url has .json extension
			if (this.ready && params && params.json && extCheck.test(params.json.toString())) {
				// load json surface via Ajax
				xhr.get({
					// http://docs.dojocampus.org/dojo/xhrGet#dojo-xhrget-supported-object-properties
					"url": params.json.toString(),
					"preventCache": false,
					"handleAs": "json",
					"load": lang.hitch(this, "_loadProjectCallback"),
					"error": lang.hitch(this, function(e){
							if (config.isDebug) { console.error(e); }
							this.status("Project load failed", "error");
						})
				});
			} else {
				this.status("Project load failed", "error");
			}
		},

		_json2svg: function(json){
			// this function reserved for external phantomjs processing
			this._loadProjectCallback(json);
			var svgExport = g.utils.toSvg(this.surface);	// object
			// 'toSvg' is asyncronous, so process result via callback
			svgExport.addCallback(lang.hitch(this,function(svg) {
				console.log(svg);
			}));
			// 'toSvg' is asyncronous, so process errors via callback
			svgExport.addErrback(lang.hitch(this,function(e) {
				console.log("<svg />");
			}));
		},

		_loadProjectCallback: function(xhrResult){
			// json has been pulled, now process
			if (xhrResult instanceof Array && xhrResult.length > 0) {
				var main = xhrResult[0];
				var mainBBox = (main.bbox) ? main.bbox : null;
				var mainGroups = (main.children) ? main.children : [];
				var mainBackground = (mainGroups.length > 0) ? mainGroups.shift() : null;
				if (main.relationships) this.relationships = main.relationships;
				if (main.fullSize) this.fullSize = main.fullSize;
				// initialize surface (oversize so resize will fit to current viewport)
				this.resize({"width":(mainBBox.width * 10000),"height":(mainBBox.height * 10000)});
				this.scale = this.position.w / mainBBox.width;
				if (main.transform && main.transform.xx) this.scale *= main.transform.xx;
				this.gfx.setTransform(g.matrix.scale(this.scale));
				// add background
				if (mainBackground && mainBackground.children && mainBackground.children.length > 0) {
					var bg = mainBackground.children[0].children[0];
					if (bg.shape && bg.shape.type && bg.shape.type == "image") {
						// set background image
						var bgObj = {"image":bg.shape.src};
						if (mainBackground.children[0].transform) bgObj.transform = mainBackground.children[0].transform;
						this.setBackground(bgObj, true);
					}
				}
				// add groups
				for(var i=0,len=mainGroups.length; i<len; ++i ){
					if (g.renderer == "vml" && metadata) {
						// vml bug: http://bugs.dojotoolkit.org/ticket/14558
						if (mainGroups[i].transform && mainGroups[i].transform.xx) {
							metadata.xx = mainGroups[i].transform.xx;
						} else {
							metadata.xx = null;
						} 
					}
					// loop through each child (group) and add to main layer
					new Group(this,{"shape":mainGroups[i]});
				}
				// set project name
				if (main.name) this.status(main.name,"project name");
				// Done!
				this.status("Project loaded");
			} else {
				this.status("Error parsing project", "error");
			}
		},

		renderProject: function(params){
			// save project as png or pdf
			if (this.ready && params && params.name) {
				this.status("Rendering project to raster format...", "wait");
				var ext = (params.format && params.format == "pdf") ? ".pdf" : ".png";
				this.deselectAll();	// remove anchors
				if (g.renderer == "svg") {
					var svgExport = g.utils.toSvg(this.surface);	// object
					// 'toSvg' is asyncronous, so process result via callback
					svgExport.addCallback(lang.hitch(this,function(svg) {
						this._renderProjectCallback(params.name.replace(/\s/g,'-').replace(/[\'"<>]/g,'')+ext, svg);
					}));
					// 'toSvg' is asyncronous, so process errors via callback
					svgExport.addErrback(lang.hitch(this,function(e) {
						if (config.isDebug) { console.error(e); }
						this.status("Error rendering project (breakpoint: toSvg)", "error");
					}));
				} else {
					// FIXME: non-svg renderers too much of a hassle (especially defs); using phantomjs to export to svg...
					var json = g.utils.serialize(this.surface);				
					if (json) {
						json[0].name = params.name;	// add project name
						// save child:parent relationships
						var relationships = {};
						for (var group in this.groups) {
							if (this.groups[group].child) {
								relationships[this.groups[group].child] = group;
							}
						}
						json[0].relationships = relationships;
						// record full size dimmensions
						json[0].fullSize = this.fullSize;
						// security prefixing
						json = "{}&&" + jsonLib.toJson(json);							
						// convert json to svg
						if (this.postDeferred) {
							this.postDeferred.cancel();
							this.postDeferred = null;
						}
						var handle = null;
						handle = connect.connect(iframe, "_iframeOnload", this, function(){
							connect.disconnect(handle);
							this._renderProjectSvgCallback(params.name.replace(/\s/g,'-').replace(/[\'"<>]/g,'')+ext);
						});
						var form = domConstruct.create("form", {"method":"POST"}, win.body());
						this.postDeferred = iframe.send({
							"url": "json2svg.php",
							"form": form,
							"content": {"data":json}
						});
						domConstruct.destroy(form);
					} else {
						this.status("Error rendering project (breakpoint: toJson)", "error");
					}
				}
			}
		},

		_renderProjectSvgCallback: function(filename){
			if (filename && dom.byId(kernel._scopeName+"IoIframe")) {
				if (this.postDeferred) {
					this.postDeferred.cancel();
					this.postDeferred = null;
				}
				// FIXME: ugly hack for vml and canvas renderers...
				svg = dom.byId(kernel._scopeName+"IoIframe").contentWindow.document.body.innerHTML;
				svg = svg.replace(/\<TEXTAREA\>/ig, "");
				svg = svg.replace(/\<\/TEXTAREA\>/ig, "");
				svg = svg.replace(/\&lt\;/ig, "<");
				svg = svg.replace(/\&gt\;/ig, ">");
				svg = svg.replace(/\&nbsp\;/ig, " ");
				// send svg to render engine
				this._renderProjectCallback(filename, svg);
			}
		},

		_renderProjectCallback: function(filename, svg){
			if (filename && svg) {
				// set original dimmensions
				if (this.fullSize && this.fullSize.width && this.fullSize.width > 0) {
					var d = this.surface.getDimensions();
					svg = svg.replace(new RegExp('width="'+d.width+'"','i'), 'width="'+this.fullSize.width+'"');
					svg = svg.replace(new RegExp('height="'+d.height+'"','i'), 'height="'+this.fullSize.height+'"');
					svg = svg.replace(/matrix\((.*?)\)/i,'matrix('+(this.fullSize.width/d.width)+',0,0,'+(this.fullSize.width/d.width)+',0,0)');
				}
				// prompt user for "Save As..."
				if (this.postDeferred) {
					this.postDeferred.cancel();
					this.postDeferred = null;
				}
				var form = domConstruct.create("form", {"method":"POST"}, win.body());
				this.postDeferred = iframe.send({
					"url": "svg2render.php",
					"form": form,
					"content": {"filename":filename,"data":svg}
				});
				domConstruct.destroy(form);
			}
			var handle = null;
			handle = connect.connect(iframe, "_iframeOnload", this, function(){
				connect.disconnect(handle);
				this.status("Project rendered");
			});
		},

		exportProject: function(params){
			// exports project as svg file
			if (this.ready && params && params.name) {
				this.status("Exporting project to SVG format...", "wait");
				this.deselectAll();	// remove anchors
				if (g.renderer == "svg") {
					// determine which fonts were actually used
					var fontsUsed = {};
					for (var group in this.groups) {
						var grp = this.groups[group];
						if (grp.text && grp.text.font && grp.text.font.family) {
							fontsUsed[grp.text.font.family.replace(/'/g,'')] = null;
						}
					}
					g.utils.fontsUsed = fontsUsed;
					// export svg
					var svgExport = g.utils.toSvg(this.surface);	// object
					// 'toSvg' is asyncronous, so process result via callback
					svgExport.addCallback(lang.hitch(this,function(svg) {
						this._exportProjectCallback(params.name.replace(/\s/g,'-').replace(/[\'"<>]/g,'')+".svg", svg);
					}));
					// 'toSvg' is asyncronous, so process errors via callback
					svgExport.addErrback(lang.hitch(this,function(e) {
						if (config.isDebug) { console.error(e); }
						this.status("Error exporting project (breakpoint: toSvg)", "error");
					}));
				} else {
					// FIXME: non-svg renderers too much of a hassle (especially defs); using phantomjs to export to svg...
					var json = g.utils.serialize(this.surface);					
					if (json) {
						json[0].name = params.name;	// add project name
						// save child:parent relationships
						var relationships = {};
						for (var group in this.groups) {
							if (this.groups[group].child) {
								relationships[this.groups[group].child] = group;
							}
						}
						json[0].relationships = relationships;
						// record full size dimmensions
						json[0].fullSize = this.fullSize;
						// security prefixing & pretty print
						json = "{}&&" + jsonLib.toJson(json);	// security prefixing
						// convert json to svg
						if (this.postDeferred) {
							this.postDeferred.cancel();
							this.postDeferred = null;
						}
						var handle = null;
						handle = connect.connect(iframe, "_iframeOnload", this, function(){
							connect.disconnect(handle);
							this._exportProjectCallback(params.name.replace(/\s/g,'-').replace(/[\'"<>]/g,'')+".svg", null);
						});
						var form = domConstruct.create("form", {"method":"POST"}, win.body());
						this.postDeferred = iframe.send({
							"url": "json2svg.php",
							"form": form,
							"content": {"data":json}
						});
						domConstruct.destroy(form);
					} else {
						this.status("Error exporting project (breakpoint: toJson)", "error");
					}
				}
			}
		},

		_exportProjectCallback: function(filename, svg){
			if (filename && (svg || dom.byId(kernel._scopeName+"IoIframe"))) {
				if (this.postDeferred) {
					this.postDeferred.cancel();
					this.postDeferred = null;
				}
				if (!svg) {
					// FIXME: ugly hack for vml and canvas renderers...
					svg = dom.byId(kernel._scopeName+"IoIframe").contentWindow.document.body.innerHTML;
					svg = svg.replace(/\<TEXTAREA\>/ig, "");
					svg = svg.replace(/\<\/TEXTAREA\>/ig, "");
					svg = svg.replace(/\&lt\;/ig, "<");
					svg = svg.replace(/\&gt\;/ig, ">");
					svg = svg.replace(/\&nbsp\;/ig, " ");
				}
				// set original dimmensions
				if (this.fullSize && this.fullSize.width && this.fullSize.width > 0) {
					var d = this.surface.getDimensions();
					svg = svg.replace(new RegExp('width="'+d.width+'"','i'), 'width="'+this.fullSize.width+'"');
					svg = svg.replace(new RegExp('height="'+d.height+'"','i'), 'height="'+this.fullSize.height+'"');
					svg = svg.replace(/matrix\((.*?)\)/i,'matrix('+(this.fullSize.width/d.width)+',0,0,'+(this.fullSize.width/d.width)+',0,0)');
				}
				// prompt user for "Save As..."
				var form = domConstruct.create("form", {"method":"POST"}, win.body());
				this.postDeferred = iframe.send({
					"url": "post2prompt.php",
					"form": form,
					"content": {"filename":filename,"data":svg}
				});
				domConstruct.destroy(form);
			}
			this.status("Project exported");
		},

		resize: function(params){
			// reset div and surface size to match viewport (or width/height specified in params)
			this.clearSurface();
			var viewport = window.getBox();
			var width = Math.floor(viewport.w - this.offset.right);
			var height = Math.floor(viewport.h - this.offset.bottom);
			var w = 0;
			var h = 0;
			if (params && params.width && params.height && params.width <= width && params.height <= height) {
				width = params.width;
				height = params.height;
			} else if (params && params.width && params.height) {
				h = height;
				w = Math.floor((height * params.width) / params.height);
				if (w > width) {
					w = width;
					h = Math.floor((width * params.height) / params.width);
				}
				width = w;
				height = h;
			}
			domStyle.set(this.div,{"width":width+"px","height":height+"px"});
			var currentWidth = (dom.byId("toolbar-container")) ? domStyle.get("toolbar-container", "width") : 0;
			if (dom.byId("memu-container")) domStyle.set("memu-container",{"width":Math.max(width,currentWidth)+"px","height":height+30+"px"});
			if (dom.byId("toolbar-container")) domStyle.set("toolbar-container",{"width":Math.max(width,currentWidth)+"px","height":"28px"});
			this.position = html.position(this.div,true);
			this.surface.setDimensions(width, height);
			this.gfx.setBoundingBox({"x":0,"y":0,"width":width,"height":height});
		},

		clearSurface: function(){
			// remove temp div
			if (dom.byId('tempDiv')) domConstruct.destroy('tempDiv');
			// remove handles
			this.deselectAll();
			// remove groups
			for (var group in this.groups) {
				this.groups[group].destroy();
			}
			// clear all layers
			this.gfx.clear();
			this.gfx.setTransform({"xx":1,"xy":0,"yx":0,"yy":1,"dx":0,"dy":0});		
			this.scale = 1.0;
			this.background = this.gfx.createGroup();
			this.groups = {};
			this.selected = {};
			if (this.surface.defNode) {
				while (this.surface.defNode.hasChildNodes()) {
					this.surface.defNode.removeChild(this.surface.defNode.lastChild);
				}
			}
			utils.fontCache = {"Helvetica":"universal"};
			utils.fontsUsed = null;
			if (config.isDebug) { console.log("Surface cleared"); };
		},

		loadFont: function(fontFamily){
			this.status("Font loading...", "wait");
			utils.loadFont(fontFamily).then(lang.hitch(this, function(result){
				if (result) {
					this.status("Font loaded: "+fontFamily);
					if (this.selected.id && this.groups[this.selected.id]) {
						var id = this.selected.id;
						var group = this.groups[this.selected.id];
						var child = (group.child && this.groups[group.child]) ? this.groups[group.child] : null;
						if (group.text) {
							group.text.updateText({"family":fontFamily});
						} else if (child && child.text) {
							child.text.updateText({"family":fontFamily});
							this.deselectAll();
							this.select(id);
						}
					}
				} else {
					this.status(fontFamily,"font error");
				}
			}));
		},
		
		_onDblClick: function(e){
			if (!this.selected.id || (this.background && this.background.children && this.background.children[0] && this.background.children[0].getUID && this.background.children[0].getUID() == this.selected.id)) {	
				this._promptForText(e.clientX, e.clientY);
			}
		},

		_promptForText: function(x, y){
			// prompt user to create a new text group (x,y coordinates indicate top-left corner of textarea prompt)
			this.disableKeys();	// disable keys hook so letters like 'b' don't initiate 'moveToBack'
			if (dom.byId('tempDiv')) domConstruct.destroy('tempDiv');	// remove any previous temp div

			// --------------------------------------------------
			// BEGIN jQuery dependency
			// FIXME: Yes, I know it's a cardinal sin to mix js libraries but Dojo was buggy (textarea misplacement in some browsers)
			// --------------------------------------------------
				// add temp div to page
				var div = $("<div id='tempDiv' class='editable_textarea' style='position:absolute;"+
						"left:"+(x-4)+"px;top:"+(y-11)+"px;width:300px;height:100px;'></div>");
				$('body').append(div);

				// jeditable plugin: http://www.appelsiini.net/projects/jeditable
				$('.editable_textarea').editable(lang.hitch(this, function(value, settings) {
					// text has been entered, remove temp div
					domConstruct.destroy('tempDiv');
					var txt = (this.toolbar.text) ? this.toolbar.text : {};
					txt.content = value;
					this.addGroup({"text":txt,"clientX":x,"clientY":y});
					return(value);
				}),{
					type: 'textarea',
					select: true,
					submit: 'Save',
					cancel: 'Cancel',
					cssclass: "editable",
					event: "dblclick",
					onblur: "ignore",
					onreset: function() { domConstruct.destroy('tempDiv'); },
					callback: lang.hitch(this, this.enableKeys)
				});
				// simulate double-click to trigger textarea to display
				$('#tempDiv').dblclick();

			// --------------------------------------------------
			// END jQuery dependency
			// --------------------------------------------------

		}

	});
});

