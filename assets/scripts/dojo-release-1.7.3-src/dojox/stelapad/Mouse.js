"use strict";	// ES5 Strict
define(["dojo/_base/declare", "dojo/_base/connect", "dojo/_base/event", "dojo/dom", "dojo/_base/array", "dojox/gfx/Mover"],
    function(declare, connect, event, dom, array, Mover){
	return declare("dojox.stelapad.Mouse", null, {
		constructor: function(parent, params){
			this.isPad = (parent.pad) ? false : true;
			this.pad = (this.isPad) ? parent : parent.pad;
			this.parent = parent;	// group, anchor, etc.
			this.target = (this.isPad) ? dom.byId(this.pad.div) : this.parent.gfx;
			this.events = [];

			this._dblClickSpeed = 400;	// milliseconds between clicks to register as an onDblClick
			this._currentClickTime = null;
			this._previousClickTime = null;

			this._init(params);
		},

		_init: function(params){
			if (this.isPad) {
				this.events.push(connect.connect(this.target, "onmousedown", this, "onMouseDown"));
				this.events.push(connect.connect(this.target, "onmouseup", this, "onMouseUp"));
			} else {
				this.events.push(this.target.connect("onmousedown", this, "onMouseDown"));
				this.events.push(this.target.connect("onmouseup", this, "onMouseUp"));
				this.events.push(this.target.connect("onmouseover", this, "onMouseOver"));
				this.events.push(this.target.connect("onmouseout", this, "onMouseOut"));
			}
		},

		onMouseDown: function(e){
			if (!this.isPad) {
				new Mover(this.parent.gfx, e, this);
			}
			event.stop(e);
		},

		onMouseUp: function(e){
			// detect double click
			this._currentClickTime = new Date().getTime();
			if(this._previousClickTime){
				if(this._currentClickTime - this._previousClickTime < this._dblClickSpeed){
					this.onDblClick(e);
				}
			}
			this._previousClickTime = this._currentClickTime;
		},

		onDblClick: function(e){
			// called on a calculated double-click
		},

		onMouseOver: function(e){
			event.stop(e);
		},

		onMouseOut: function(e){
			event.stop(e);
		},

		onFirstMove: function(mover){
			// called during the very first move notification
		},

		onMove: function(mover, shift){
			// called during every move notification
			// restrict movement to pad
			var p = this.pad.position;
			var x = shift.dx + mover.lastX;
			var y = shift.dy + mover.lastY;
			if (x < p.x || x > (p.x + p.w) || y < p.y || y > (p.y + p.h)) {
				shift.dx = 0;
				shift.dy = 0;
				this._previousClickTime = null;
				this.onMouseUp({"clientX":mover.lastX,"clientY":mover.lastY});
				mover.destroy();
			} else {
				// apply scale to shift
				shift.dx /= this.pad.scale;
				shift.dy /= this.pad.scale;
			}
		},

		destroy: function(){
			// stops watching for possible move, deletes all references, so the object can be garbage-collected
			if (this.isPad) array.forEach(this.events, function(handle){connect.disconnect(handle);});
			else array.forEach(this.events, this.target.disconnect, this.target);
		}

	});
});

