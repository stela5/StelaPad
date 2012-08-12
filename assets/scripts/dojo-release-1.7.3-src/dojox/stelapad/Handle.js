"use strict";	// ES5 Strict
define(["dojo/_base/declare", "dojo/_base/connect", "dojo/dom-style", "dojox/gfx", "dojox/gfx/utils", "dojox/stelapad/Mouse"],
    function(declare, connect, domStyle, g, utils, Mouse){
	return declare("dojox.stelapad.Handle", null, {
		constructor: function(parent, type, point, params){
			this.pad = parent.pad;
			this.parent = parent;
			this.type = type;
			this.point = point;
			this.gfx = null;
			this.mouse = null;
			this.radius = (/^(?:n|e|s|w)$/.test(this.type)) ? (6 / this.pad.scale) : (7 / this.pad.scale);
			this.stroke = {"width":(g.renderer == "vml") ? 1 : (1 / this.pad.scale),"style":"Solid","color":"black","cap":"round"};
			this.fill = {
					"type":"radial",
					"cx":this.point.x - (2 / this.pad.scale),
					"cy":this.point.y - (2 / this.pad.scale),
					"r":this.radius,
					"colors":[{"offset":0.4,"color":"#f4ffff"},{"offset":1,"color":"#c2e4e8"}]
				    };

			this._init(params);
		},

		_init: function(params){
			var circle = {"cx":this.point.x,"cy":this.point.y,"r":this.radius};
			this.gfx = this.parent.overlay.createCircle(circle);
			this.gfx.setStroke(this.stroke).setFill(this.fill);
			this.mouse = new Mouse(this);
			connect.connect(this.mouse, "onMove", this, "_onMove");
			connect.connect(this.mouse, "onMouseOver", this, "_onMouseOver");
			connect.connect(this.mouse, "onMouseOut", this, "_onMouseOut");
			connect.connect(this.mouse, "onDblClick", this, "_onDblClick");
			connect.connect(this.parent, "_moveHandles", this, "_moveHandle");
			this.parent.handles[this.type] = this;
		},

		_onMove: function(mover, shift){
			// logic courtesy of svgweb: http://code.google.com/p/svgweb/source/browse/trunk/samples/svg-files/photos.svg
			// 	and Fabric.js: https://github.com/kangax/fabric.js/blob/master/dist/all.js

			var s = null;
			var r = null;
			var by = null;
			var center = this.parent.points.c;
			var origin = this.pad.position;
			var clientX = ((shift.dx * this.pad.scale) + mover.lastX - origin.x) / this.pad.scale;
			var clientY = ((shift.dy * this.pad.scale) + mover.lastY - origin.y) / this.pad.scale;
			var lastX = (mover.lastX - origin.x) / this.pad.scale;
			var lastY = (mover.lastY - origin.y) / this.pad.scale;
			// calculate shape scale
			var lastLength = Math.sqrt(Math.pow(lastY - center.y, 2) + Math.pow(lastX - center.x, 2));
			var currentLength = Math.sqrt(Math.pow(clientY - center.y, 2) + Math.pow(clientX - center.x, 2));
			s = currentLength / lastLength;
			if (this.pad.ctrlKey && /^(?:nw|ne|se|sw)$/.test(this.type)) {
				// calculate shape rotate
				var r2d = 360.0 / (2.0 * Math.PI);
				var lastAngle = Math.atan2(lastY - center.y, lastX - center.x) * r2d;
				var currentAngle = Math.atan2(clientY - center.y, clientX - center.x) * r2d;
				r = currentAngle - lastAngle;
			}
			if (this.type == "e" || this.type == "w") by = "x";
			if (this.type == "n" || this.type == "s") by = "y";
			// apply shape scale/rotate
			this.parent._applyScaleRotate(s, r, by);
			
		},

		_moveHandle: function(){
			var p = g.matrix.multiplyPoint(this.gfx._getRealMatrix(), this.point);
			p.x /= this.pad.scale;
			p.y /= this.pad.scale;
			var dx = this.parent.points[this.type].x - p.x;
			var dy = this.parent.points[this.type].y - p.y;
			this.gfx.applyRightTransform({"dx":dx,"dy":dy});
		},

		_onMouseOver: function(e){
			var q = utils.getQuadrant(this.type, this.parent.angle);
			if (q) domStyle.set(this.pad.div, "cursor", q+"-resize");
		},

		_onMouseOut: function(e){
			domStyle.set(this.pad.div, "cursor", this.pad.DEFAULT_CURSOR);
		},

		_onDblClick: function(e){
			if (this.parent.angle !== 0) this.parent._applyScaleRotate(null, -this.parent.angle);	// reset angle to 0
		},

		destroy: function(){
			// remove handle and dependencies
			this.mouse.destroy();
			this.gfx.removeShape();
		}

	});
});

