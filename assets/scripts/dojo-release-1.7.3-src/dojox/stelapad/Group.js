"use strict";	// ES5 Strict
define(["dojo/_base/declare", "dojo/_base/config", "dojo/_base/lang", "dojo/_base/xhr", "dojo/_base/connect", "dojo/_base/window", "dojo/dom-geometry", "dojo/dom", "dojo/dom-attr", "dojo/dom-style", "dojo/dom-construct", "dojox/gfx", "dojox/gfx/utils", "dojox/gfx/decompose", "dojox/stelapad/Mouse", "dojox/stelapad/Handle", "dojox/stelapad/Text"],
    function(declare, config, lang, xhr, connect, win, domGeom, dom, domAttr, domStyle, domConstruct, g, utils, loadDecompose, Mouse, Handle, Text){
	return declare("dojox.stelapad.Group", null, {
		constructor: function(pad, params){
			this.pad = pad;
			this.gfx = null;
			this.overlay = null;
			this.border = null;
			this.borderStroke = {"color":"#b3b3b3","style":"ShortDash","width":(g.renderer == "vml") ? 3 : (3 / this.pad.scale)};
			this.points = {};
			this._initialPoints = {};
			this.mouse = null;
			this.handles = {};
			this.scale = 1.0;
			this.angle = 0;
			this.text = null;
			this.child = null;	// group child -- TODO: change to array to support more children than just text

			this._init(params);
		},
		
		_init: function(params){
			if (params && params.background) {
				this.gfx = this.pad.background.createGroup();
			} else {
				this.gfx = this.pad.gfx.createGroup();
			}
			if (params && params.transform) {
				this.gfx.setTransform(params.transform);
			} else {
				this.gfx.setTransform({"xx":1,"xy":0,"yx":0,"yy":1,"dx":0,"dy":0});	
			}
			this.mouse = new Mouse(this);
			connect.connect(this.mouse, "onMove", this, "_onMove");
			connect.connect(this.mouse, "onMouseUp", this, "_onMouseUp");
			connect.connect(this.mouse, "onMouseDown", this, "_onMouseDown");
			connect.connect(this.mouse, "onMouseOver", this, "_onMouseOver");
			connect.connect(this.mouse, "onMouseOut", this, "_onMouseOut");
			connect.connect(this.mouse, "onDblClick", this, "_onDblClick");

			var x = (params && params.clientX) ? (params.clientX - this.pad.position.x) / this.pad.scale : 0;
			var y = (params && params.clientY) ? (params.clientY - this.pad.position.y) / this.pad.scale : 0;
			var point = {"x":x,"y":y};

			if (params && params.background && params.marginBox) this._addBackground(params.background, params.marginBox);
			else if (params && params.shape) this._loadShape(params.shape);
			else if (params && params.json) this._addJson(params.json, point);
			else if (params && params.image) this._addImage(params.image, point);
			else if (params && params.text) this._addText(params.text, point);
		},

		_loadShape: function(shape){
			// add gfx shape (used when loading projects)
			if (shape) {
				try {
					// check for text
					if (shape.children && shape.children.length == 2 && shape.children[0].font) {
						var child = shape.children[0];
						// adjust y depending on if project was saved with vml renderer or other
						var d = utils.getTextDimensions(child.shape.text, child.font.family, child.font.size);
						var vmlY = true;
						if (Math.round(child.shape.y) == Math.round((d.height * 0.8) + shape.bbox.y)) vmlY = false;
						if (g.renderer == "vml" && !vmlY) {
							// set y to vml format
							child.shape.y = shape.bbox.y + (shape.bbox.height / 2) + (d.height * 0.3);
						} else if (g.renderer != "vml" && vmlY) {
							// set y to non-vml format
							child.shape.y = shape.bbox.y + (d.height * 0.8);
						}
						// create text instance
						this.text = new Text(this);
						if (child.shape.x) this.text.gfxText.x = child.shape.x;
						if (child.shape.y) this.text.gfxText.y = child.shape.y;
						if (child.shape.text) this.text.gfxText.text = child.shape.text;
						if (child.shape.align) this.text.gfxText.align = child.shape.align;
						if (child.font.family) {
							this.text.font.family = child.font.family;
							if (this.pad.toolbar.addFontFamily){
								this.pad.toolbar.addFontFamily(child.font.family.replace(/\+/g,' ').replace(/[\'"<>]/g,''));
							}
						}
						if (child.font.size) this.text.font.size = child.font.size;
						if (child.fill) this.text.color = child.fill;
					}
					// load shape
					var id = this.gfx.getUID();
					var t = (shape.transform) ? shape.transform : null;	// get transform
					if (t) shape.transform = {"xx":1,"xy":0,"yx":0,"yy":1,"dx":0,"dy":0};	// temp reset to apply bounding box
					if (shape.children) utils.deserialize(this.gfx, shape.children);	// deserialize json into gfx group
					if (shape.bbox) this.gfx.setBoundingBox(shape.bbox);	// set bounding box
					this._updatePoints();	// set
					if (t) {
						this.gfx.setTransform(t);	// re-apply original transform
						this._updatePoints();	// update
						var a = g.decompose(t).angle1;	// decompose transform to get angle
						if (a !== 0) this.angle = g.matrix._radToDeg(a);	// set current angle
					}
					this.pad.groups[id] = this;
					// re-establish child:parent relationships
					this.pad.projectIdMap[shape.id] = id;
					if (this.pad.relationships[shape.id]) {
						// child just got loaded; map to parent
						// 		relationships --> oldChildId:oldParentId
						// 		projectIdMap --> oldId:newId
						var oldParentId = this.pad.relationships[shape.id];
						var newParentId = this.pad.projectIdMap[oldParentId];
						this.pad.groups[newParentId].child = id;
					}
				} catch(e) {
					if (config.isDebug) { console.error(e); }
					this.pad.status("Error loading shape (breakpoint: loadShape)", "error");
				}
			}
		},

		_addText: function(textObj, point){
			if (textObj && textObj.content) {
				this.pad.groups[this.gfx.getUID()] = this;
				try {
					new Text(this, textObj, point);
				} catch(e) {
					if (config.isDebug) { console.error(e); }
					this.pad.status("Error adding text (breakpoint: addText)", "error");
				}
			} else {
				this.pad.status("Error adding text (breakpoint: addText)", "error");
			}
		},

		_addJson: function(json, point){
			// load json group
			var extCheck = /(.json)$/i;	// verify url has .json extension
			if (json && extCheck.test(json.toString())) {
				this.pad.status("Shape loading...", "wait");
				xhr.get({
					// http://docs.dojocampus.org/dojo/xhrGet#dojo-xhrget-supported-object-properties
					"url": json.toString(),
					"preventCache": false,
					"handleAs": "json",
					"load": lang.hitch(this, function(xhrResult){ this._addJsonCallback(xhrResult, point); }),
					"error": lang.hitch(this, function(e){
							if (config.isDebug) { console.error(e); }
							this.pad.status("Error loading shape (breakpoint: addJson)", "error");
						})
				});
			} else {
				this.pad.status("Error loading shape (breakpoint: addJson)", "error");
			}
		},

		_addJsonCallback: function(xhrResult, point){
			var shape = null;
			var id = this.gfx.getUID();
			if(xhrResult instanceof Array && xhrResult.length > 0) shape = xhrResult[0];   // first item in array is the group
			if (shape) {
				try {
					var t = (shape.transform) ? shape.transform : null;	// get transform
					if (t) shape.transform = {"xx":1,"xy":0,"yx":0,"yy":1,"dx":0,"dy":0};	// temp reset to apply bounding box
					utils.deserialize(this.gfx, shape);	// deserialize json into gfx shape & add to main
					if (shape.bbox) {
						this.gfx.setBoundingBox(shape.bbox);
						this.gfx.createRect(shape.bbox).setFill([0,0,0,0]);	// mover helper
					}
					this._updatePoints();
					if (t) {
						this.gfx.setTransform(t);	// re-apply original transform
						this._updatePoints();	// update
					}
					if (point && (point.x > 0 || point.y > 0)) this.gfx.applyLeftTransform({"dx":point.x,"dy":point.y});
				} catch(e) {
					if (config.isDebug) { console.error(e); }
					this.pad.status("Error loading shape (breakpoint: addJsonCallback)", "error");
				}
				this.pad.groups[id] = this;  // register group with pad
				this.pad.select(id);
				this.scaleToFit();
			}
			this.pad.status("Shape loaded");
		},

		_addImage: function(image, point){
			this.pad.status("Image loading...", "wait");
			if (image && (/\.(png|jpe?g|gif)$/i.test(image) || (/^data:image\/(png|jpeg|gif);base64,/i.test(image)))) {
				try {
					// temporarily load image into browser to get dimmensions
					var id = this.gfx.getUID();
					var src = image;
					var img = domConstruct.create("img", {"style":{"visibility":"hidden"}}, win.body());
					var handle = null;
					handle = connect.connect(img, "load", this, function(){
						// temp image loaded into browser
						var mb = domGeom.getMarginBox(img);	// get image width (w) and height (h)
						connect.disconnect(handle);	// disconnect load callback
						domConstruct.destroy(img);	// remove temp image from browser
						// add gfx image to group
						var gfxImage = {"type":"image","x":0,"y":0,"width":mb.w,"height":mb.h,"src":src};
						this.gfx.createImage(gfxImage);
						this.gfx.setBoundingBox({"x":0,"y":0,"width":mb.w,"height":mb.h});
						this._updatePoints();
						if (point && (point.x > 0 || point.y > 0)) this.gfx.applyLeftTransform({"dx":point.x,"dy":point.y});
						this.pad.groups[id] = this;	// register group with pad
						this.pad.status("Image loaded");
						this.pad.select(id);
						this.scaleToFit();	
					});
					domAttr.set(img, "src", src);
				} catch(e) {
					if (config.isDebug) { console.error(e); }
					this.pad.status("Error loading image (breakpoint: addImage)", "error");
				}
			} else {
				this.pad.status("Error loading image (breakpoint: addImage)", "error");
			}
		},

		_addBackground: function(image, mb){
			if (image && (/\.(jpe?g|png|gif)$/i.test(image) || /^data:image\/(png|jpeg|gif);base64,/i.test(image))) {
				var id = this.gfx.getUID();
				var gfxImage = {"type":"image","x":0,"y":0,"width":mb.w,"height":mb.h,"src":image};
				this.gfx.createImage(gfxImage);
				this.gfx.setBoundingBox({"x":0,"y":0,"width":mb.w,"height":mb.h});
				this._updatePoints();
				this.pad.groups[id] = this;	// register group with pad
				this.pad.select(id);
				this.scaleToFit();				
			} else {
				this.status("Background load failed", "error");
			}
		},
		
		_updatePoints: function(){
			// set points for handles
			if (this.points.c) {
				// apply transform
				var t = this.gfx.getTransform();
				var p = new Array("nw","n","ne","e","se","s","sw","w","c");
				for (var i=0; i<p.length; i++) {
					this.points[p[i]] = g.matrix.multiplyPoint(t, this._initialPoints[p[i]]);
					// round value to 12 decimal places
					this.points[p[i]].x = Math.round(this.points[p[i]].x * 1000000000000) / 1000000000000;
					this.points[p[i]].y = Math.round(this.points[p[i]].y * 1000000000000) / 1000000000000;
				}
			} else {
				// initial set
				var b = this.gfx.getBoundingBox();
				this._initialPoints.nw = this.points.nw = {"x":b.x,"y":b.y};
				this._initialPoints.n = this.points.n = {"x":b.x+(b.width/2),"y":b.y};
				this._initialPoints.ne = this.points.ne = {"x":b.x+b.width,"y":b.y};
				this._initialPoints.e = this.points.e = {"x":b.x+b.width,"y":b.y+(b.height/2)};
				this._initialPoints.se = this.points.se = {"x":b.x+b.width,"y":b.y+b.height};
				this._initialPoints.s = this.points.s = {"x":b.x+(b.width/2),"y":b.y+b.height};
				this._initialPoints.sw = this.points.sw = {"x":b.x,"y":b.y+b.height};
				this._initialPoints.w = this.points.w = {"x":b.x,"y":b.y+(b.height/2)};
				this._initialPoints.c = this.points.c = {"x":b.x+(b.width/2),"y":b.y+(b.height/2)};
			}
		},

		select: function(){
			this._updatePoints();
			this.border = this.pad.gfx.createGroup();
			this.overlay = this.pad.gfx.createGroup();
			try {
				this._setBorder();
				new Handle(this, "nw", this.points.nw);
				new Handle(this, "n", this.points.n);
				new Handle(this, "ne", this.points.ne);
				new Handle(this, "e", this.points.e);
				new Handle(this, "se", this.points.se);
				new Handle(this, "s", this.points.s);
				new Handle(this, "sw", this.points.sw);
				new Handle(this, "w", this.points.w);
			} catch(e) {
				if (config.isDebug) { console.error(e); }
				this.pad.status("Error creating handles (breakpoint: select)", "error");
			}
		},

		deselect: function(){
			for (var h in this.handles) {
				this.handles[h].destroy();
			}
			this.handles = {};
			if (this.border) {
				this.border.clear();
				this.border.removeShape();
				this.border = null;
			}
			if (this.overlay) {
				this.overlay.clear();
				this.overlay.removeShape();
				this.overlay = null;
			}
		},

		scaleToFit: function(){
			var minX = 0, minY = 0, maxX = 1, maxY = 1, tbbWidth = 1, tbbHeight = 1;
			var tbb = this.gfx.getTransformedBoundingBox();
			if (tbb) {
				minX = Math.min(tbb[0].x,tbb[1].x,tbb[2].x,tbb[3].x);
				maxX = Math.max(tbb[0].x,tbb[1].x,tbb[2].x,tbb[3].x);
				minY = Math.min(tbb[0].y,tbb[1].y,tbb[2].y,tbb[3].y);
				maxY = Math.max(tbb[0].y,tbb[1].y,tbb[2].y,tbb[3].y);
				tbbWidth = maxX - minX;
				tbbHeight = maxY - minY;
			}
			if (tbb && (minX < 0 || minY < 0)) {
				var dx = (minX < 0) ? -minX : 0;
				var dy = (minY < 0) ? -minY : 0;
				this.gfx.applyLeftTransform({"dx":(dx / this.pad.scale),"dy":(dy / this.pad.scale)});
				if (this.child && this.pad.groups[this.child]) {
					this.pad.groups[this.child].gfx.applyLeftTransform({"dx":(dx / this.pad.scale),"dy":(dy / this.pad.scale)});
				}
				this.scaleToFit();
			} else if (tbb && (maxX > this.pad.position.w || maxY > this.pad.position.h) && 
				  (tbbWidth <= this.pad.position.w) && (tbbHeight <= this.pad.position.h)) {
				var dx = (maxX > this.pad.position.w) ? (this.pad.position.w - maxX) : 0;
				var dy = (maxY > this.pad.position.h) ? (this.pad.position.h - maxY) : 0;
				this.gfx.applyLeftTransform({"dx":(dx / this.pad.scale),"dy":(dy / this.pad.scale)});
				if (this.child && this.pad.groups[this.child]) {
					this.pad.groups[this.child].gfx.applyLeftTransform({"dx":(dx / this.pad.scale),"dy":(dy / this.pad.scale)});
				}
				this.scaleToFit();
			} else if (tbb && (minX < 0 || minY < 0 || maxX > this.pad.position.w || maxY > this.pad.position.h)) {
				var width = this.pad.position.w - minX;
				var height = this.pad.position.h - minY;
				var h = height;
				var w = Math.floor((height * tbbWidth) / tbbHeight);
				if (w > width) {
					w = width;
					h = Math.floor((width * tbbHeight) / tbbWidth);
				}
				width = w;
				height = h;
				this.scale *= (width / tbbWidth);
				this.gfx.applyRightTransform(g.matrix.scale(width / tbbWidth));
				if (this.child && this.pad.groups[this.child]) {
					this.pad.groups[this.child].gfx.applyRightTransform(g.matrix.scale(width / tbbWidth));
				}
				this.scaleToFit();
			} else if (tbb) {
				this.deselect();
				this.select();
			}
		},

		_setBorder: function(){
			this.border.clear();
			this.border.setTransform({"xx":1,"xy":0,"yx":0,"yy":1,"dx":0,"dy":0});
			var d = "M"+this.points.nw.x+","+this.points.nw.y+" L"+this.points.ne.x+","+this.points.ne.y+" "+
					this.points.se.x+","+this.points.se.y+" "+this.points.sw.x+","+this.points.sw.y+"z";
			var p = this.border.createPath({"path":d});
			p.setStroke(this.borderStroke);
		},

		_applyScaleRotate: function(s, r, by){
			var t = new Array();
			if (s) {
				this.scale = this.scale * s;
				if (by && by == "x") {
					t.push(g.matrix.rotategAt(this.angle,this.points.c));
					t.push(g.matrix.scaleAt(s, 1, this.points.c));
					t.push(g.matrix.rotategAt(-this.angle,this.points.c));
				} else if (by && by == "y") {
					t.push(g.matrix.rotategAt(this.angle,this.points.c));
					t.push(g.matrix.scaleAt(1, s, this.points.c));
					t.push(g.matrix.rotategAt(-this.angle,this.points.c));
				} else {
					t.push(g.matrix.scaleAt(s, this.points.c));
				}
			}
			if (r) {
				this.angle += r;
				if (this.angle > 360) this.angle -= 360;
				if (this.angle < -360) this.angle += 360;
				t.push(g.matrix.rotategAt(r,this.points.c));
			}
			if (t.length > 0) {
				this.gfx.applyLeftTransform(t);
				if (this.child && this.pad.groups[this.child]) {
					this.pad.groups[this.child].gfx.applyLeftTransform(t);
				}
				this._updatePoints();
				this._setBorder();
				this._moveHandles();
			}
		},

		_moveHandles: function(){
			// handle hook
		},

		_onMove: function(mover, shift){
			this.gfx.applyLeftTransform(shift);
			this.border.applyLeftTransform(shift);
			this.overlay.applyLeftTransform(shift);
			if (this.child && this.pad.groups[this.child]) {
				this.pad.groups[this.child].gfx.applyLeftTransform(shift);
			}
		},

		_onMouseDown: function(e){
			if (this.gfx.getUID() !== this.pad.selected.id) this.pad.select(this.gfx.getUID());
		},

		_onMouseUp: function(e){
			this._updatePoints();
		},

		_onMouseOver: function(e){
			domStyle.set(this.pad.div, "cursor", "move");
		},

		_onMouseOut: function(e){
			domStyle.set(this.pad.div, "cursor", this.pad.DEFAULT_CURSOR);
		},

		_onDblClick: function(e){
			this._promptForText(e.clientX, e.clientY);
		},

		_promptForText: function(x, y){
			// prompt user to provide text for selected group (x,y coordinates indicate top-left corner of textarea prompt)
			var text = (this.text) ? this.text.getText() : "";
			this.pad.disableKeys();	// disable keys hook so letters like 'b' don't initiate 'moveToBack'
			if (dom.byId('tempDiv')) domConstruct.destroy('tempDiv');	// remove any previous temp div

			// --------------------------------------------------
			// BEGIN jQuery dependency
			// FIXME: Yes, I know it's a cardinal sin to mix js libraries but Dojo was buggy (textarea misplacement in some browsers)
			// --------------------------------------------------
				// add temp div to page
				var div = $("<div id='tempDiv' class='editable_textarea' style='position:absolute;"+
						"left:"+(x-4)+"px;top:"+(y-11)+"px;width:300px;height:100px;'>"+
						text.replace(/\n/g,'<br>').replace(/\s/g,'&nbsp;')+"</div>");
				$('body').append(div);
				// jeditable plugin: http://www.appelsiini.net/projects/jeditable
				$('.editable_textarea').editable(lang.hitch(this, function(value, settings) {
					// text has been entered, remove temp div
					domConstruct.destroy('tempDiv');
					if (this.text) {
						// text already exists, so just update content
						this.text.updateText({"content":value});
					} else {
						var txt = (this.pad.toolbar.text) ? this.pad.toolbar.text : {};
						txt.content = value;
						var grp = this.pad.addGroup({"text":txt,"clientX":x,"clientY":y});
						if (grp && grp.gfx) {
							// center text on clicked point
							var t = new Array();
							t.push(g.matrix.translate((grp.points.w.x - grp.points.c.x),(grp.points.n.y - grp.points.c.y)));
							if (this.angle !== 0) {
								// match parent angle
								grp.angle = this.angle;
								t.push(g.matrix.rotategAt(grp.angle,grp.points.c));
							}
							grp.gfx.applyLeftTransform(t);
							grp._updatePoints();
							grp._setBorder();
							grp._moveHandles();
							this.child = grp.gfx.getUID();
						}
					}
					return(value);
				}),{
					type: 'textarea',
					select: true,
					submit: 'Save',
					cancel: 'Cancel',
					cssclass: "editable",
					event: "dblclick",
					onblur: "ignore",
					data: function(value, settings) {
						/* Convert &nbsp; to space and <br> to newline. */
						var retval = value.replace(/<br[\s\/]?>/gi, '\n').replace(/\&nbsp\;/gi, ' ');
						return retval;
					},
					onreset: function() { domConstruct.destroy('tempDiv'); },
					callback: lang.hitch(this.pad, this.pad.enableKeys)
				});
				// simulate double-click to trigger textarea to display
				$('#tempDiv').dblclick();

			// --------------------------------------------------
			// END jQuery dependency
			// --------------------------------------------------

		},

		moveToBack: function(){
			this.overlay.moveToBack();
			this.border.moveToBack();
			if (this.child && this.pad.groups[this.child]) this.pad.groups[this.child].gfx.moveToBack();
			this.gfx.moveToBack();
		},

		moveToFront: function(){
			this.gfx.moveToFront();
			if (this.child && this.pad.groups[this.child]) this.pad.groups[this.child].gfx.moveToFront();
			this.border.moveToFront();
			this.overlay.moveToFront();	
		},

		destroy: function(){
			this.deselect();
			this.mouse.destroy();
			this.gfx.removeShape();
			domStyle.set(this.pad.div, "cursor", this.pad.DEFAULT_CURSOR);
		}

	});
});

