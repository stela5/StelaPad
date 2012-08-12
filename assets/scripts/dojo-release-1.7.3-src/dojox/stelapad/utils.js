"use strict";	// ES5 Strict
require(["dojo/_base/lang", "dojo/_base/config", "dojo/_base/xhr", "dojo/_base/Deferred", "dojo/_base/window", "dojox/gfx", "dojox/gfx/shape", "dojo/_base/array", "dojox/gfx/utils"],
    function(lang, config, xhr, Deferred, win, g, shape, arr, gu){

	// gfx.utils overrides
	lang.mixin(g.utils, {

		serialize: function(
			/* dojox.gfx.Surface|dojox.gfx.Shape */ object
		){
			// summary:
			//		Takes a shape or a surface and returns a DOM object, which describes underlying shapes.
			var t = {}, v, isSurface = object instanceof g.Surface;
			if(isSurface || object instanceof g.Group){
				// set id
				if (object.getUID) {
					t.id = object.getUID();
				} else {
					t.id = null;
				}
				// get children
				t.children = arr.map(object.children, gu.serialize);
				if(isSurface){
					return t.children;	// Array
				}
			}else{
				t.shape = object.getShape();
				if (object instanceof g.TextPath) {
					if (t.shape.path){ t.textpath = t.shape.path; }
					t.shape = object.text;
				}
			}
			if(object.getTransform){
				v = object.getTransform();
				var isIdentity = (v && v.xx===1 && v.xy===0 && v.yx===0 && v.yy===1 && v.dx===0 && v.dy===0);
				if(v && !isIdentity){ t.transform = v; }
			}
			if(object.getStroke){
				v = object.getStroke();
				if(g.renderer=="vml" && v && v.color){
					// weird bug on VML import project
					v.color = {"r":v.color.r,"g":v.color.g,"b":v.color.b,"a":v.color.a}; 
				}
				if (g.renderer=="vml" && metadata && metadata.xx && v && v.width) {
					// vml bug: http://bugs.dojotoolkit.org/ticket/14558
					v.width = v.width / metadata.xx;
				}
				if(v){ t.stroke = v; }
			}
			if(object.getFill){
				v = object.getFill();
				if(v){ t.fill = v; }
			}
			if(object.getFont){
				v = object.getFont();
				if(v){ t.font = v; }
			}
			if(object instanceof g.Group && object.bbox){
				t.bbox = object.bbox;
			}
			if(object.getEffect){
				v = object.getEffect();
				if(v){ t.effect = v; }
			}
			return t;	// Object
		},

		deserialize: function(
			/* dojox.gfx.Surface|dojox.gfx.Shape */ parent,
			/* dojox.gfx.Shape|Array */ object
		){
			// summary:
			//		Takes a surface or a shape and populates it with an object produced by serialize().
			if(object instanceof Array){
				return arr.map(object, lang.hitch(null, gu.deserialize, parent));	// Array
			}
			var shape = ("shape" in object) ? parent.createShape(object.shape) : parent.createGroup();
			if("transform" in object){
				shape.setTransform(object.transform); 
			}
			if("stroke" in object){
				if (g.renderer=="vml" && metadata && metadata.xx && object.stroke.width) {
					// vml bug: http://bugs.dojotoolkit.org/ticket/14558
					object.stroke.width = object.stroke.width * metadata.xx;
				}
				shape.setStroke(object.stroke);
			}
			if("fill" in object){
				shape.setFill(object.fill);
			}
			if("font" in object){
				shape.setFont(object.font);
			}
			if("textpath" in object){
				shape.setShape(object.textpath);
			}
			if("effect" in object){
				// https://github.com/mrbluecoat/Dojox.gfx-Plugins/
			        if(typeof(object.effect) == "object" && "type" in object.effect){
					// determine if blur or shadow
					switch(object.effect.type){
						case "blur":
							shape.setBlur(object.effect);
							break;
						case "shadow":
							shape.setShadow(object.effect);
							break;
					}
					shape.effect = object.effect;
				}
			}
			if("errors" in object){
				if (config.isDebug) console.error(object.errors);
			}
			if("children" in object){
				arr.forEach(object.children, lang.hitch(null, gu.deserialize, shape));
			}
			return shape;	// dojox.gfx.Shape
		},

		getQuadrant: function(anchorType, angle){
			var q = null;	// quadrant
			switch(anchorType){
				case "n":
					if (Math.abs(angle) < 23) q = "n";
					else if (Math.abs(angle) < 68) q = (angle > 0) ? "ne" : "nw";
					else if (Math.abs(angle) < 113) q = (angle > 0) ? "e" : "w";
					else if (Math.abs(angle) < 158) q = (angle > 0) ? "se" : "sw";
					else q = "s";
					break;
				case "ne":
					if (Math.abs(angle) < 23) q = "ne";
					else if (Math.abs(angle) < 68) q = (angle > 0) ? "e" : "n";
					else if (Math.abs(angle) < 113) q = (angle > 0) ? "se" : "nw";
					else if (Math.abs(angle) < 158) q = (angle > 0) ? "s" : "w";
					else q = "sw";
					break;
				case "e":
					if (Math.abs(angle) < 23) q = "e";
					else if (Math.abs(angle) < 68) q = (angle > 0) ? "se" : "ne";
					else if (Math.abs(angle) < 113) q = (angle > 0) ? "s" : "n";
					else if (Math.abs(angle) < 158) q = (angle > 0) ? "sw" : "nw";
					else q = "w";
					break;
				case "se":
					if (Math.abs(angle) < 23) q = "se";
					else if (Math.abs(angle) < 68) q = (angle > 0) ? "s" : "e";
					else if (Math.abs(angle) < 113) q = (angle > 0) ? "sw" : "ne";
					else if (Math.abs(angle) < 158) q = (angle > 0) ? "w" : "n";
					else q = "nw";
					break;
				case "s":
					if (Math.abs(angle) < 23) q = "s";
					else if (Math.abs(angle) < 68) q = (angle > 0) ? "sw" : "se";
					else if (Math.abs(angle) < 113) q = (angle > 0) ? "w" : "e";
					else if (Math.abs(angle) < 158) q = (angle > 0) ? "nw" : "ne";
					else q = "n";
					break;
				case "sw":
					if (Math.abs(angle) < 23) q = "sw";
					else if (Math.abs(angle) < 68) q = (angle > 0) ? "w" : "s";
					else if (Math.abs(angle) < 113) q = (angle > 0) ? "nw" : "se";
					else if (Math.abs(angle) < 158) q = (angle > 0) ? "n" : "e";
					else q = "ne";
					break;
				case "w":
					if (Math.abs(angle) < 23) q = "w";
					else if (Math.abs(angle) < 68) q = (angle > 0) ? "nw" : "sw";
					else if (Math.abs(angle) < 113) q = (angle > 0) ? "n" : "s";
					else if (Math.abs(angle) < 158) q = (angle > 0) ? "ne" : "se";
					else q = "e";
					break;
				case "nw":
					if (Math.abs(angle) < 23) q = "nw";
					else if (Math.abs(angle) < 68) q = (angle > 0) ? "n" : "w";
					else if (Math.abs(angle) < 113) q = (angle > 0) ? "ne" : "sw";
					else if (Math.abs(angle) < 158) q = (angle > 0) ? "e" : "s";
					else q = "se";
					break;
			}
			return q;	// quadrant (nw, n, ne, e, se, s, sw, w)
		},

		fontCache: {"Helvetica":"universal"},
		fontsUsed: null,

		defNode: null,

		isFontInstalled: function(fontFamily) {
			// http://lucassmith.name/2009/05/test-if-a-font-is-installed-via-javascript.html
			// Code licensed under BSD license: http://lucassmith.name/license.html
			// https://gist.github.com/118155
			fontFamily = fontFamily.replace(/\+/g,' ').replace(/[\'"<>]/g,'');
			var body = document.body,
				test  = document.createElement('div'),
				installed = false,
				template =
					'<b style="display:inline !important; width:auto !important; font:normal 10px \'X\',sans-serif !important">ii</b>'+
					'<b style="display:inline !important; width:auto !important; font:normal 10px \'X\',monospace !important">ii</b>',
				ab;
			if (fontFamily) {
				test.innerHTML = template.replace(/X/g, fontFamily);
				test.style.cssText = 'position: absolute; visibility: hidden; display: block !important';
				body.insertBefore(test, body.firstChild);
				ab = test.getElementsByTagName('b');
				installed = ab[0].offsetWidth === ab[1].offsetWidth;
				body.removeChild(test);
			}
			return installed;
		},

		getTextDimensions: function(text, fontFamily, fontSize) {
			var dimensions = new Object();
			dimensions.width = 0;
			dimensions.height = 0;
			if ((text.toString().length > 0) && (fontFamily.toString().length > 0) && !isNaN(parseFloat(fontSize))) {
				text = text.toString();
				fontFamily = fontFamily.replace(/\+/g,' ').replace(/[\'"<>]/g,'');
				var span = document.createElement("span");
				span.style.lineHeight = "100%";
				span.style.width = "auto";
				span.style.border = 0;
				span.style.padding = 0;
				span.style.margin = 0;
				span.style.fontFamily = "'"+fontFamily+"', 'Helvetica'";
				span.style.fontSize = parseFloat(fontSize) + "px";
				span.innerHTML = text.replace(/\s/g,'&nbsp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
				document.body.insertBefore(span, document.body.firstChild);
				dimensions.width = span.offsetWidth * 1.1;
				dimensions.height = span.offsetHeight;
				document.body.removeChild(span);
			}
			return dimensions;
		},

		loadFont: function(fontFamily) {
			var style = "400";	// TODO: support bold italic, italic, and bold
			var deferred = new Deferred();
			fontFamily = fontFamily.replace(/\+/g,' ').replace(/[\'"<>]/g,'');
			if (fontFamily in gu.fontCache) {
				// font already in cache
				deferred.callback(true);
			} else {
				xhr.get({
					// http://docs.dojocampus.org/dojo/xhrGet#dojo-xhrget-supported-object-properties
					"url": "getfontface.php",
					"content":{"family":fontFamily.replace(/\s/g,"+")+":"+style},
					"preventCache": false,
					"handleAs": "json",
					"sync": true,	// for phantomjs headless processing
					"load": function(json){
							gu._loadFontCallback(fontFamily, json).then(
								function(result) { deferred.callback(result); }
							);
						},
					"error": function(e){ deferred.callback(false); }
				});
			}
			return deferred;
		},

		_loadFontCallback: function(fontFamily, json) {
			// internal function - do not call directly
			var deferred = new Deferred();
			fontFamily = fontFamily.replace(/\+/g,' ').replace(/[\'"<>]/g,'');
			if (json && json.woff && json.woff == null) {
				// not a valid Google web font
				deferred.callback(false);
			} else {
				if (gu.isFontInstalled(fontFamily)) {
					// locally installed Google web font
					gu.fontCache[fontFamily] = json;
					deferred.callback(true);
				} else if (g.renderer == "vml") {
					// vml does not support web fonts (unless locally installed)
					deferred.callback(false);
				} else {
					// load Google Web Font (http://www.google.com/webfonts) into cache
					// requires WebFont Loader: http://code.google.com/apis/webfonts/docs/webfont_loader.html
					if (WebFont) {
						WebFont.load({
							google: {
								families: [ fontFamily ]
							},
							loading: function() {
								//console.log('font loading',fontFamily);
							},
							fontloading: function(fontFamily, fontDescription) {
								//console.log('font loading',fontFamily);
							},
							fontactive: function(fontFamily, fontDescription) {
								//console.log('font active',fontFamily);
							},
							fontinactive: function(fontFamily, fontDescription) {
								//console.log('font inactive',fontFamily);
							},
							active: function() {
								gu.fontCache[fontFamily] = json;
								deferred.callback(true);
							},
							inactive: function() {
								deferred.callback(false);
							}
						});
					} else { deferred.callback(false); }
				}
			}
			return deferred;
		},

		_cleanSvg: function(svg) {
			// summary:
			//		Internal function that cleans up artifacts in extracted SVG content.
			// tags:
			//		private
			if(svg){
				//Make sure the namespace is set.
				if(svg.indexOf("xmlns=\"http://www.w3.org/2000/svg\"") == -1){
					svg = svg.substring(4, svg.length);
					svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"" + svg;
				}
				//Do some other cleanup, like stripping out the
				//dojoGfx attributes and quoting ids.
				svg = svg.replace(/\bdojoGfx\w*\s*=\s*(['"])\w*\1/g, "");
				svg = svg.replace(/[=]([^"']+?)(\s|>)/g,'="$1"$2');

				// update xmlns references
				var xmlnsData = 'xmlns="http://www.w3.org/2000/svg" ';
				xmlnsData += 'xmlns:xlink="http://www.w3.org/1999/xlink" ';
				xmlnsData += 'xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" ';
				xmlnsData += 'version="1.1"';
				svg = svg.replace(/xmlns\=\"http\:\/\/www\.w3\.org\/2000\/svg\"/, xmlnsData);

				// weird bug fix where canvas and vml renderers don't apply xlink namespace for images
				svg = svg.replace(/xlink\:href\=/ig, "href=");
				svg = svg.replace(/href\=/ig, "xlink:href=");

				// lame IE9...
				svg = svg.replace(/tspan\sxmlns\:NS[1-9][0-9]?[0-9]?\=\"\"\sNS[1-9][0-9]?[0-9]?\:sodipodi/g, "tspan sodipodi");
				svg = svg.replace(/xmlns\:NS[1-9][0-9]?[0-9]?\=\"\"\sNS[1-9][0-9]?[0-9]?\:xml/g, "xml");
								
				// normalize spaces
				svg = svg.replace(/\&nbsp\;/ig, " ");
				svg = svg.replace(/\u00a0/g, " ");

				// add font info to defs
				var fontData = '';
				var fontList = (gu.fontsUsed) ? gu.fontsUsed : gu.fontCache;
				for (var font in fontList) {
					if (font != "Helvetica") {
						var f = gu.fontCache[font];
						if (f && f.woff && f.woff != null) {
							fontData += '<style xmlns="http://www.w3.org/1999/xhtml" type="text/css">';
							fontData += '<![CDATA[ ' + f.woff + ' ]]>';
							fontData += '</style>';
						}
						if (f && f.ttf && f.ttf != null) {
							fontData += '<font-face font-family="' + font + '" font-style="normal" font-weight="400">';
							fontData += '<font-face-src><font-face-uri xlink:href="' + f.ttf + '"/>';
							fontData += '</font-face-src></font-face>';
						}
					}
				}
				if (fontData.length > 0) {
					svg = svg.replace(/\<\/defs\>/, fontData+"</defs>");
					svg = svg.replace(/\<defs\/\>/, "<defs>"+fontData+"</defs>");
				}
			}
			return svg;  //Cleaned SVG text.
		}

	});

	// prototype modifications
	g.Group.prototype.setBoundingBox = function(b){ this.bbox = b; };
	shape.Shape.prototype.getEffect = function(){ return (this.effect) ? this.effect : null; };

	if (g.renderer == "canvas" || g.renderer == "canvasWithEvents") {
		// gfx.Text update to handle multi-line text in Canvas renderer
		g.Text.prototype._renderShape = function(ctx){
			// summary: a text shape (Canvas)
			// ctx : Object: the drawing context.
			var ta, s = this.shape;
			if(!s.text || s.text.length == 0){
				return;
			}
			// text align
			ta = s.align === 'middle' ? 'center' : s.align;
			ctx.textAlign = ta;
			if(this.canvasFont){
				ctx.font = this.canvasFont;
			}
			if(this.canvasFill){
				// support multi-line text
				var dimensions, lines = s.text.split("\n");
				for(var i = 0, n = lines.length; i < n; i++){
					dimensions = gu.getTextDimensions(lines[i], this.fontStyle.family, this.fontStyle.size);
					ctx.fillText(lines[i], s.x, s.y + (i * dimensions.height));
				}
			}
			if(this.strokeStyle){
				ctx.beginPath(); // fix bug in FF3.6. Fixed in FF4b8
				ctx.strokeText(s.text, s.x, s.y);
				ctx.closePath();
			}
		};

		// gfx Canvas update to handle shadow effect
		g.canvas.Shape.prototype._render = function(ctx){
			// summary: render the shape
			ctx.save();
			// process effect, if exists
			if (this._gfxEffect && this.getUID() in this._gfxEffect) {
				var effect = this._gfxEffect[this.getUID()];
				if (effect && effect.type && effect.type == "shadow") {
					ctx.shadowOffsetX = parseFloat(effect.dx);
					ctx.shadowOffsetY = parseFloat(effect.dy);
					ctx.shadowBlur    = parseFloat(effect.size);
					var color = g.normalizeColor(effect.color);
					ctx.shadowColor   = "rgba(" + color.r + ", " + color.g + ", " + color.b + ", " + color.a + ")";
				}
			}
			this._renderTransform(ctx);
			this._renderShape(ctx);
			this._renderFill(ctx, true);
			this._renderStroke(ctx, true);
			ctx.restore();
		};

	}

	// gfx.Text update to handle multi-line text in SVG renderer (see http://bugs.dojotoolkit.org/attachment/ticket/10973/multi-line-text.patch)
	if (g.renderer == "svg") {
		var _createElementNS = function(ns, nodeType){
			// summary:
			//		Internal helper to deal with creating elements that
			//		are namespaced.  Mainly to get SVG markup output
			//		working on IE.
			if(win.doc.createElementNS){
				return win.doc.createElementNS(ns,nodeType);
			}else{
				return win.doc.createElement(nodeType);
			}
		};

		g.Text.prototype.setShape = function(newShape){
			// summary: sets a text shape object (SVG)
			// newShape: Object: a text shape object
			this.shape = g.makeParameters(this.shape, newShape);
			this.bbox = null;
			var r = this.rawNode, s = this.shape;
			r.setAttribute("x", s.x);
			r.setAttribute("y", s.y);
			r.setAttribute("text-anchor", s.align);
			r.setAttribute("text-decoration", s.decoration);
			r.setAttribute("rotate", s.rotated ? 90 : 0);
			r.setAttribute("kerning", s.kerning ? "auto" : 0);
			r.setAttribute("text-rendering", "optimizeLegibility");
			// update the text content, consider multiple lines
			// credit: http://bugs.dojotoolkit.org/attachment/ticket/10973/multi-line-text.patch
			// handle multiple spaces
			// credit: http://www.codingforums.com/showpost.php?s=bd2574c7ecee019f6ae86ee3f6c29d92&p=28743&postcount=5
			while(r.firstChild) { r.removeChild(r.firstChild); }
			if(s.text){
				var texts = s.text.split("\n");
				for(var i = 0, n = texts.length; i < n; i++){
					var tspan = _createElementNS(g.svg.xmlns.svg, "tspan");
					tspan.setAttribute("sodipodi:role", "line");
					tspan.setAttribute("x", s.x);
					tspan.setAttribute("dy", (i==0) ? "0em" : "1.2em");
					tspan.setAttribute("xml:space", "preserve");
					tspan.appendChild(win.doc.createTextNode(texts[i].replace(/\s/g,"\u00a0")));
					r.appendChild(tspan);
				}
			}
			return this;	// self
		};
	}

});
