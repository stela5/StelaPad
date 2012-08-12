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

**Q:** What components of <a href="http://jqueryui.com/download">jQuery UI</a> are in the demo?  
**A:** Core, Widget, Mouse, Position, Dragable, Droppable, Resizable, Accordion, Dialog, and the dark-hive theme

**Q:** How do I prepare for deployment (e.g. build, minify)?  
**A:** Set "isDebug" to false in index.html and then run Google's closure compiler via "dojo-release-1.7.3-src/util/buildscripts/build.sh profile=stelapad action=release" for Linux or "dojo-release-1.7.3-src/util/buildscripts/build.bat profile=stelapad action=release" for Windows.  This will output the result in a new Dojo "release" folder that you can reference in your index.html and json2svg-page.php files.

## IE7 and IE8 limitations

* JavaScript and VML performance is very slow.  <em>Resolution: install <a href="http://www.google.com/chromeframe/index.html?user=true">Google Chrome Frame</a>.</em>
* <a href="http://en.wikipedia.org/wiki/Base64">Base64</a> support is limited or nonexistent.  Opening projects saved from other browsers may not display images correctly.  <em>Resolution: install <a href="http://www.google.com/chromeframe/index.html?user=true">Google Chrome Frame</a>.</em>
* <a href="http://caniuse.com/filereader">FileReader</a> is not supported.  Images will be hosted by <a href="http://imm.io/">imm.io</a> with the following restrictions: images deleted after 30 days of inactivity and maximum image size limited to 1600x1600 (4000 pixels).
* IE7 does not open saved project files correctly.  <em>Resolution: Upgrade to IE 8 <strong>OR</strong> do not use that feature with IE 7 <strong>OR</strong> install <a href="http://www.google.com/chromeframe/index.html?user=true">Google Chrome Frame</a>.</em>
* IE may display a security warning when attempting to save an image, PDF, or SVG file.  <em>Resolution: Press and hold the "Alt" key while clicking the 'Save As' menu option <strong>OR</strong> follow <a href="http://kb.iu.edu/data/awsi.html">this guide</a> to update your security settings <strong>OR</strong> install <a href="http://www.google.com/chromeframe/index.html?user=true">Google Chrome Frame</a>.</em>
* <a href="http://en.wikipedia.org/wiki/Vector_Markup_Language">VML</a> does not support web fonts.  <em>Resolution: install <a href="http://www.google.com/chromeframe/index.html?user=true">Google Chrome Frame</a> <strong>OR</strong> use the default Helvetica font <strong>OR</strong>:</em>

## StelaPad (dojox/stelapad) and the demo files are Dual-Licensed

Copyright (c) 2012, <a href="http://stela5.com/">Stela 5</a>

* <a href="http://www.opensource.org/licenses/mit-license.php">MIT</a> or
* <a href="http://www.opensource.org/licenses/GPL-2.0">GPL v2 (or later)</a>

(see humans.txt for other licensed material used herein)
