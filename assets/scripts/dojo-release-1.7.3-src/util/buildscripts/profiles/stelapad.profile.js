dependencies = {
	layerOptimize:"closure",
	optimize:"closure",
	stripConsole:"none",	// need console.log for PhantomJS
	layers: [{
		name: "dojo.js",
		dependencies: [
			"dojox.stelapad"
		]
	}],
	prefixes: [
		[ "dijit", "../dijit" ],
		[ "dojox", "../dojox" ]
	]
}
