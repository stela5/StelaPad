"use strict";	// ES5 Strict
define(["dojo/_base/declare", "dojo/_base/config", "dojo/_base/lang", "dojox/gfx", "dojox/gfx/utils"],
    function(declare, config, lang, g, utils){
	return declare("dojox.stelapad.Text", null, {
		constructor: function(parent, params, point){
			this.pad = parent.pad;	// pad reference
			this.parent = parent;	// parent group
			this.gfxText = {"x":((point && point.x) || 0),"y":((point && point.y) || 0),"text":"","align":"middle"};  // default text object
			this.font = {"family":"'Helvetica'","size":"32px","weight":400};   // note: VML requires single-quotes around font family
			this.color = "black";	// default text color

			this._init(params);
		},

		_init: function(params){
			if (params) {
				this.setText(params);
			}
		},

		getText: function(){
			return this.gfxText.text;
		},

		setText: function(params){
			// initial setting of text properties and shape
			if (params) {
				if (params.content) this.gfxText.text = params.content.toString();
				if (params.align) this.gfxText.align = params.align.toString();
				if (params.family) this.font.family = "'" + params.family.replace(/[\'"<>]/g,'') + "'";
				if (params.size) this.font.size = g.normalizedLength(params.size)+"px";
				if (params.color) this.color = g.normalizeColor(params.color);
			}
			utils.loadFont(this.font.family).then(lang.hitch(this, this._setTextCallback), lang.hitch(this, this._setTextCallback));

		},

		_setTextCallback: function(result) {
			// internal helper function for setText
			if (!result) {
				this.pad.status(this.font.family, "font error");
				this.font.family = "'Helvetica'";
			}
			var dimensions = null;
			var bbox = {"x":this.gfxText.x,"y":this.gfxText.y,"width":0,"height":0};
			var lines = this.gfxText.text.split("\n");
			for(var i = 0, n = lines.length; i < n; i++){ 
				dimensions = utils.getTextDimensions(lines[i], this.font.family, this.font.size);
				if (dimensions.width > bbox.width) bbox.width = dimensions.width;
				bbox.height += dimensions.height;	
			}
			// properly set x based on text alignment
			if (this.gfxText.align == "middle") this.gfxText.x += (bbox.width / 2);
			else if (this.gfxText.align == "end") this.gfxText.x += bbox.width;
			// properly set y based on rendered
			if (g.renderer == "vml") this.gfxText.y += (bbox.height / 2) + (dimensions.height * 0.3);
			else this.gfxText.y += (dimensions.height * 0.8);
			// set/refresh text
			this.destroy();
			this.parent.text = this;
			this.parent.gfx.createText(this.gfxText).setFont(this.font).setFill(this.color);
			this.parent.gfx.createRect(bbox).setFill([0,0,0,0]);	// helper for vml text drag
			this.parent.gfx.setBoundingBox(bbox);
			this.parent._updatePoints();
			this.pad.select(this.parent.gfx.getUID());
			this.parent.scaleToFit();
		},

		updateText: function(params) {
			// subsequent setting of text properties and shape
			if (params) {
				if (params.content) this.gfxText.text = params.content.toString();
				if (params.align) this.gfxText.align = params.align.toString();
				if (params.family) this.font.family = "'" + params.family.replace(/[\'"<>]/g,'') + "'";
				if (params.size) this.font.size = g.normalizedLength(params.size)+"px";
				if (params.color) this.color = g.normalizeColor(params.color);
			}
			this.parent._onMouseOut();	// remove move cursor to avoid 'sticking'
			this.pad.deselectAll();		// remove handles
			this.parent.gfx.clear();	// remove text and helper rect
			var b = this.parent.gfx.getBoundingBox();	// get current bounding box
			var t = this.parent.gfx.getTransform();		// get current transform
			if (t) this.parent.gfx.setTransform({"xx":1,"xy":0,"yx":0,"yy":1,"dx":0,"dy":0});	// temp transform reset
			// get new bbox
			var dimensions = null;
			var bbox = {"x":b.x,"y":b.y,"width":0,"height":0};
			var lines = this.gfxText.text.split("\n");
			for(var i = 0, n = lines.length; i < n; i++){ 
				dimensions = utils.getTextDimensions(lines[i], this.font.family, this.font.size);
				if (dimensions.width > bbox.width) bbox.width = dimensions.width;
				bbox.height += dimensions.height;	
			}
			// properly set x based on text alignment
			if (this.gfxText.align == "middle") this.gfxText.x = b.x + (bbox.width / 2);
			else if (this.gfxText.align == "end") this.gfxText.x = b.x + bbox.width;
			// properly set y based on rendered
			if (g.renderer == "vml") this.gfxText.y = b.y + (bbox.height / 2) + (dimensions.height * 0.3);
			else this.gfxText.y = b.y + (dimensions.height * 0.8);
			// create new text
			this.parent.gfx.createText(this.gfxText).setFont(this.font).setFill(this.color);
			this.parent.gfx.createRect(bbox).setFill([0,0,0,0]);	// helper for vml text drag
			this.parent.gfx.setBoundingBox(bbox);
			// update handles
			this.parent.points = {};
			this.parent._initialPoints = {};
			this.parent._updatePoints();
			// re-apply original transform
			if (t) this.parent.gfx.setTransform(t);
			this.parent._updatePoints();
			this.pad.select(this.parent.gfx.getUID());
			//this.parent.scaleToFit();
		},

		destroy: function(){
			// clear text (and helper rect)
			this.parent.gfx.clear();
		}

	});
});

