# StelaPad

Extension of <a href="http://www.dojotoolkit.org/reference-guide/dojox/gfx.html">Dojox.GFX</a> to interact with SVG, Canvas, and VML (zoom, rotate, move, add multi-line text, web fonts, save, etc).  See <a href="http://stelapad.com/">stelapad.com</a> for a demo.

<img src="http://i47.tinypic.com/291cg7r.png" style="height:auto;width:100%;" />

## Installation

1. Download and extract the zip file of this repository to a web server directory (see humans.txt for a list of included libraries and tools).

2. Download and install <a href="http://phantomjs.org/download.html">PhantomJS</a> (for vector rendering).

3. Run index.html in your web browser.

## Usage

	This section will be expanded in the future.  For now, see editor.js and Pad.js for all capabilities.

	Editor keyboard shortcuts:

	Arrow			move in 1x increments
	Shift + Arrow		move in 10x increments
	Delete			delete
	Esc			deselect
	Shift + Ctrl + Home	send to top
	Shift + Ctrl + End	send to bottom
	[			rotate counterclockwise 15 degrees
	]			rotate clockwise 15 degrees
	Shift + [		rotate counterclockwise by 90 degrees
	Shift + ]		rotate clockwise by 90 degrees
	Alt + [			rotate counterclockwise by 1 pixel
	Alt + ]			rotate clockwise by 1 pixel
	0			reset rotation to original orientation
	S			scale to fit
	Ctrl + Handle (Anchor)	rotate and resize
	Double Click		create or edit text

## FAQ

**Q:** Will this work with older browsers (such as IE 7)?  
**A:** Yes. It has been tested on all major browsers including IE 7.

**Q:** What modifications did you make to Dojox.GFX?  
**A:** svg.js and vml.js were directly edited for <a href="http://bugs.dojotoolkit.org/query?status=!closed&reporter=stelapad">bug fixes</a>.  Other than that, the only additions are the dojox/stelapad folder and util/buildscripts/profiles/stelapad.profile.js

**Q:** If StelaPad is based on Dojo, why is jQuery included?  
**A:** <a href="http://www.appelsiini.net/projects/jeditable">Jeditable</a> is needed because pure Dojo was buggy here.  Feel free to fork and improve!

**Q:** How do I prepare for deployment (e.g. build, minify)?  
**A:** Set "isDebug" to false in index.html and then run Google's closure compiler via "dojo-release-1.7.3-src/util/buildscripts/build.sh profile=stelapad action=release" for Linux or "dojo-release-1.7.3-src/util/buildscripts/build.bat profile=stelapad action=release" for Windows.  This will output the result in "dojo/release".

## StelaPad (dojox/stelapad) and the demo files are Dual-Licensed

Copyright (c) 2012, <a href="http://stela5.com/">Stela 5</a>

* <a href="http://www.opensource.org/licenses/mit-license.php">MIT</a>
* <a href="http://www.opensource.org/licenses/GPL-2.0">GPL v2 (or later)</a>

(see humans.txt for other licensed material used herein)
