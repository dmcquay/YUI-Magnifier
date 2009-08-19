/**
 * Copyright (c) 2009, Dustin McQuay, Backcountry.com
 * All rights reserved.
 *
 * This work is licensed under the Creative Commons Attribution 2.5 License. To view a copy 
 * of this license, visit http://creativecommons.org/licenses/by/2.5/ or send a letter to 
 * Creative Commons, 543 Howard Street, 5th Floor, San Francisco, California, 94105, USA.
 *
 * This work was created by Dustin McQuay under direction of Backcountry.com (www.backcountry.com).
 * 
 * The only attribution I require is to keep this notice of copyright & license 
 * in this original source file.
 *
 * Version 0.1 - 07.14.2009
 *
 */
YAHOO.namespace('extension');

YAHOO.extension.Magnifier = function(anchor, magnifierCfg, lensCfg, cursorCfg) {

	var oThis = this;
	this.initDefaultConfig();
	if (typeof(magnifierCfg) == 'undefined' || magnifierCfg == null) {
		magnifierCfg = {};
	}

	if (typeof(anchor) == 'string') anchor = document.getElementById(anchor);
	if (typeof(magnifierCfg.image) == 'undefined') magnifierCfg.image = anchor.getElementsByTagName("img")[0];

	if (magnifierCfg) {
		this.cfg.applyConfig(magnifierCfg);
	}

	// set up lens
	if (typeof(lensCfg) == 'undefined') { lensCfg = {}; }
	if (typeof(lensCfg.showDelay) == 'undefined') { lensCfg.showDelay = this.cfg.getProperty("showDelay"); }
	if (typeof(lensCfg.imageUrl) == 'undefined') { lensCfg.imageUrl = anchor.href; }
    if (typeof(lensCfg.context) == 'undefined') { lensCfg.context = [ anchor, 'tl', 'tr' ]; }
	//TODO: allow this id to be configurable
	this.lens = new YAHOO.extension.MagnifierLens(YAHOO.util.Dom.generateId(), lensCfg);
	this.lens.render(document.body);

	// set up cursor panel
	if (typeof(cursorCfg) == 'undefined') { cursorCfg = {}; }
	if (typeof(cursorCfg.showDelay) == 'undefined') { cursorCfg.showDelay = this.cfg.getProperty("showDelay"); }
	var cursorBoxToLensRatio = 1 / this.getMagnificationRatio();
	cursorCfg.width = (parseInt(this.lens.cfg.getProperty("width")) * cursorBoxToLensRatio) + 'px';
	cursorCfg.height = (parseInt(this.lens.cfg.getProperty("height")) * cursorBoxToLensRatio) + 'px';
	cursorCfg.parentElement = this.cfg.getProperty("image");
	//TODO: allow this id to be configurable
	this.cursorPanel = new YAHOO.extension.CursorPanel(YAHOO.util.Dom.generateId(), cursorCfg);
	this.cursorPanel.render(document.body);

	// events for showing/hidding this panel
	YAHOO.util.Event.addListener(this.cursorPanel.getBoundary(), "mouseover", this.lens.show, this.lens, true);
	this.cursorPanel.onParentMouseOut.subscribe(this.lens.hide, this.lens, true);

	// event for setting the position of the magnified element
	this.cursorPanel.onRegionChanged.subscribe(this.handleCursorRegionChanged, this, true);

	// event for setting the dimensions of the regular image when it loads and also
	// resizing the cursor panel. also call once now in case the image is already loaded.
	YAHOO.util.Event.addListener(this.cfg.getProperty("image"), 'load', function() {
		this.setImageDimensions();
		this.resizeCursorPanel();
	}, this, true);
	this.setImageDimensions();
	this.resizeCursorPanel();

	// events for setting the size of the cursor panel when the images change
	YAHOO.util.Event.addListener(this.lens.image, 'load', this.resizeCursorPanel, this, true);
};
YAHOO.extension.Magnifier.prototype = {

	lens: null,
	cursorPanel: null,
	imageWidth: null,
	imageHeight: null,

	initDefaultConfig: function() {

		this.cfg = new YAHOO.util.Config(this);

		this.cfg.addProperty("image", {
			value: null,
			handler: function(type, args, obj) {},
			validator: null
		});

		this.cfg.addProperty("showDelay", {
			value: 0,
			handler: function(type, args, obj) {},
			validator: null
		});
	},
	setImageDimensions: function() {
		var region = YAHOO.util.Dom.getRegion(this.cfg.getProperty("image"));
		this.imageWidth = region.right - region.left;
		this.imageHeight = region.bottom - region.top;
	},
	resizeCursorPanel: function() {
		var cursorBoxToLensRatio = 1 / this.getMagnificationRatio();
		var lensBodyRegion = YAHOO.util.Dom.getRegion(this.lens.body);
		var lensBodyWidth = lensBodyRegion.right - lensBodyRegion.left;
		var lensBodyHeight = lensBodyRegion.bottom - lensBodyRegion.top;
		var width = lensBodyWidth * cursorBoxToLensRatio;
		var height = lensBodyHeight * cursorBoxToLensRatio;
		this.cursorPanel.cfg.setProperty('width', width + 'px');
		this.cursorPanel.cfg.setProperty('height', height + 'px');

		//padding can cause the actual dimensions to be different that what we set here,
		//so we check to make sure the *actual* dimensions are what we intended
		if (width != this.cursorPanel.realWidth) {
			this.cursorPanel.cfg.setProperty('width', (width - (this.cursorPanel.realWidth - width)) + 'px');
		}
		if (height != this.cursorPanel.realHeight) {
			this.cursorPanel.cfg.setProperty('height', (height - (this.cursorPanel.realHeight - height)) + 'px');
		}
	},
	getMagnificationRatio: function() {
		return this.lens.imageWidth / this.imageWidth;
	},
	handleCursorRegionChanged: function() {
		var cpOffsets = this.cursorPanel.getOffsets();
		var ratio = this.getMagnificationRatio();
		var newLeft = cpOffsets[0] * ratio * -1;
		var newTop = cpOffsets[1] * ratio * -1;
		this.lens.setOffsets(newLeft, newTop);
	}
};

/**
* @class 
* The Magnifier class provides magnification of an image. It does so by detecting a region of the smaller image which the mouse is hovering over and showing that same region of a larger version of the image in a box.
* @param {string} imageUrl The url of the large image to be used for magnification.
* @param {object} lensCfg The configuration that should be set for this module. See configuration documentation for more details.
* @constructor
*/
YAHOO.extension.MagnifierLens = function(el, lensCfg) {

    if (!lensCfg) lensCfg = {};

	// override config defaults. these will be the new defaults.
	lensCfg.width = lensCfg.width || '300px';
	lensCfg.height = lensCfg.height || '200px';
	lensCfg.showDelay = lensCfg.showDelay || 0;
	lensCfg.visible = false;
	lensCfg.draggable = false;
	lensCfg.close = false;
	lensCfg.underlay = 'none';
	//lensCfg.effect = { effect: this.customFade };
	
    YAHOO.extension.MagnifierLens.superclass.constructor.call(this, el, lensCfg);
};
YAHOO.lang.extend(YAHOO.extension.MagnifierLens, YAHOO.widget.Panel, {

	containerClass: 'lens-panel-container',
	imageClass: 'lens-panel-image',
	loadingImageClass: 'lens-panel-loading-image',
	imageWidth: null,
	imageHeight: null,
	image: null,
	loadingImage: null,

	init: function(el, userConfig) {
		YAHOO.extension.MagnifierLens.superclass.init.call(this, el);

		YAHOO.util.Dom.setStyle(this.element, 'overflow', 'hidden');

		this.image = document.createElement('img');
		YAHOO.util.Dom.addClass(this.image, this.imageClass);
		YAHOO.util.Dom.setStyle(this.image, 'visibility', 'inherit');
		this.loadingImage = document.createElement('img');
		YAHOO.util.Dom.setStyle(this.loadingImage, 'visibility', 'hidden');
		YAHOO.util.Dom.addClass(this.loadingImage, this.loadingImageClass);
		this.setBody(this.image);
		this.body.appendChild(this.loadingImage);
		YAHOO.util.Event.addListener(this.image, 'load', this.handleImageLoaded, this, true);

		YAHOO.util.Dom.setStyle(this.body, 'position', 'relative');
		YAHOO.util.Dom.setStyle(this.image, 'position', 'absolute');
		YAHOO.util.Dom.addClass(this.element, this.containerClass);

		this.cfg.applyConfig(userConfig, true);
	},
	initDefaultConfig: function() {
		YAHOO.extension.MagnifierLens.superclass.initDefaultConfig.call(this);

		this.cfg.addProperty('imageUrl', {
			handler: this.configImageUrl,
			validator: null,
			suppressEvent: false,
			supercedes: false,
			value: null
		});

		this.cfg.addProperty('loadingImageUrl', {
			handler: this.configLoadingImageUrl,
			validator: null,
			suppressEvent: false,
			supercedes: false,
			value: null
		});
	},
	handleImageLoaded: function() {
		this.setImageDimensions();
		YAHOO.util.Dom.setStyle(this.image, 'visibility', 'inherit');
		YAHOO.util.Dom.setStyle(this.loadingImage, 'visibility', 'hidden');
	},
	setImageDimensions: function() {
		var region = YAHOO.util.Dom.getRegion(this.image);
		this.imageWidth = region.right - region.left;
		this.imageHeight = region.bottom - region.top;
	},
	configLoadingImageUrl: function(type, args, obj) {
		this.loadingImage.src = args[0];
	},
	configImageUrl: function(type, args, obj) {
		YAHOO.util.Dom.setStyle(this.image, 'visibility', 'hidden');
		if (this.cfg.getProperty('loadingImageUrl')) {
			YAHOO.util.Dom.setStyle(this.loadingImage, 'visibility', 'inherit');
		}
		this.image.src = args[0];
	},
    setOffsets: function(newLeft, newTop) {
        YAHOO.util.Dom.setStyle(this.image, 'top', newTop + 'px');
        YAHOO.util.Dom.setStyle(this.image, 'left', newLeft + 'px');
    },
	show: function() {
		var oThis = this;
		this.isShowPending = true;
		setTimeout(function() {
			if (oThis.isShowPending) {
				oThis.cfg.setProperty('context', oThis.context);
				YAHOO.extension.MagnifierLens.superclass.show.call(oThis);
			}
		}, this.showDelay);
	},
	hide: function() {
		this.isShowPending = false;
		YAHOO.extension.MagnifierLens.superclass.hide.call(this);
	},
	customFade: function(overlay) {
		var fade = new YAHOO.widget.ContainerEffect(overlay, { attributes:{opacity: {from:0, to:1}}, duration:0.25, method:YAHOO.util.Easing.easeIn }, { attributes:{opacity: {to:0}}, duration:0, method:YAHOO.util.Easing.easeNone, useSeconds:false}, overlay.element );

		fade.handleStartAnimateIn = function(type,args,obj) {
			YAHOO.util.Dom.addClass(obj.overlay.element, "hide-select");
			
			if (! obj.overlay.underlay) {
				obj.overlay.cfg.refireEvent("underlay");
			}

			if (obj.overlay.underlay) {
				obj.initialUnderlayOpacity = YAHOO.util.Dom.getStyle(obj.overlay.underlay, "opacity");
				obj.overlay.underlay.style.filter = null;
			}

			YAHOO.util.Dom.setStyle(obj.overlay.element, "visibility", "visible"); 
			YAHOO.util.Dom.setStyle(obj.overlay.element, "opacity", 0);
		};

		fade.handleCompleteAnimateIn = function(type,args,obj) {
			YAHOO.util.Dom.removeClass(obj.overlay.element, "hide-select");

			if (obj.overlay.element.style.filter) {
				obj.overlay.element.style.filter = null;
			}			
			
			if (obj.overlay.underlay) {
				YAHOO.util.Dom.setStyle(obj.overlay.underlay, "opacity", obj.initialUnderlayOpacity);
			}

			obj.overlay.cfg.refireEvent("iframe");
			obj.animateInCompleteEvent.fire();
		};

		fade.handleStartAnimateOut = function(type, args, obj) {
			YAHOO.util.Dom.addClass(obj.overlay.element, "hide-select");

			if (obj.overlay.underlay) {
				obj.overlay.underlay.style.filter = null;
			}
		};

		fade.handleCompleteAnimateOut = function(type, args, obj) { 
			YAHOO.util.Dom.removeClass(obj.overlay.element, "hide-select");
			if (obj.overlay.element.style.filter) {
				obj.overlay.element.style.filter = null;
			}				
			YAHOO.util.Dom.setStyle(obj.overlay.element, "visibility", "hidden");
			YAHOO.util.Dom.setStyle(obj.overlay.element, "opacity", 1); 

			obj.overlay.cfg.refireEvent("iframe");

			obj.animateOutCompleteEvent.fire();
		};	

		fade.init();
		return fade;
	}
});

YAHOO.extension.CursorPanel = function(el, cpCfg) {

    if (!cpCfg) { cpCfg = {}; }

	//override defaults
	if (typeof(cpCfg.visible) == 'undefined') cpCfg.visible = false;
	if (typeof(cpCfg.draggable) == 'undefined') cpCfg.draggable = false;
	if (typeof(cpCfg.close) == 'undefined') cpCfg.close = false;
	if (typeof(cpCfg.underlay) == 'undefined') cpCfg.underlay = 'none';

    YAHOO.extension.CursorPanel.superclass.constructor.call(this, el, cpCfg);
};
YAHOO.lang.extend(YAHOO.extension.CursorPanel, YAHOO.widget.Panel, {

	containerClass: "cursor-panel-container",
	parentRegion: null,
	boundary: null,
	boundaryRegion: null,
	realWidth: null,
	realHeight: null,

	init: function(el, userConfig) {
		YAHOO.extension.CursorPanel.superclass.init.call(this, el, userConfig);
		this.cfg.fireQueue();

		YAHOO.util.Dom.addClass(this.element, this.containerClass);

		this.onParentMouseOut = new YAHOO.util.CustomEvent("onParentMouseOut");
		this.onRegionChanged = new YAHOO.util.CustomEvent("onRegionChanged");

		YAHOO.util.Event.addListener(document.body, "mousemove", this.handleMouseMove, this, true);
		YAHOO.util.Event.addListener(this.boundary, "mouseover", this.handleParentMouseOver, this, true);
		YAHOO.util.Event.addListener(this.boundary, "mouseout", this.handleMouseOut, this, true);
		YAHOO.util.Event.addListener(this.element, "mouseout", this.handleMouseOut, this, true);
	},
	initDefaultConfig: function() {
		YAHOO.extension.CursorPanel.superclass.initDefaultConfig.call(this);

		this.cfg.addProperty('parentElement', {
			handler: this.configParentElement,
			validator: null,
			suppressEvent: false,
			supercedes: false,
			value: document.body
		});

		this.cfg.addProperty('extendedBoundary', {
			handler: this.configExtendedBoundary,
			validator: null,
			suppressEvent: false,
			supercedes: false,
			value: null
		});

		this.cfg.addProperty('showDelay', {
			handler: null,
			validator: null,
			suppressEvent: false,
			supercedes: false,
			value: 0
		});

		this.cfg.addProperty('blockingElements', {
			handler: null,
			validator: null,
			suppressEvent: false,
			supercedes: false,
			value: []
		});
	},
	configWidth: function(type, args, obj) {
		YAHOO.extension.CursorPanel.superclass.configWidth.call(this, type, args, obj);
		this._setRealWidthAndHeight();
	},
	configHeight: function(type, args, obj) {
		YAHOO.extension.CursorPanel.superclass.configHeight.call(this, type, args, obj);
		this._setRealWidthAndHeight();
	},
	configParentElement: function() {
		this._setBoundaryVars();
		this.parentRegion = YAHOO.util.Dom.getRegion(this.cfg.getProperty('parentElement'));
	},
	configExtendedBoundary: function() {
		this._setBoundaryVars();
	},
	getBoundary: function() {
		return this.cfg.getProperty('extendedBoundary')
			|| this.cfg.getProperty('parentElement');
	},
	_setRealWidthAndHeight: function() {
		var region = YAHOO.util.Dom.getRegion(this.element);
		this.realWidth = region.right - region.left;
		this.realHeight = region.bottom - region.top;
	},
	_setBoundaryVars: function() {
		this.boundary = this.cfg.getProperty('extendedBoundary')
			|| this.cfg.getProperty('parentElement');
		this.boundaryRegion = YAHOO.util.Dom.getRegion(this.boundary);
	},
	getOffsets: function() {
		var myRegion = YAHOO.util.Dom.getRegion(this.element);
		return [myRegion.left - this.parentRegion.left, myRegion.top - this.parentRegion.top];
	},
    setPosition: function(coords) {
        x = coords[0] - (this.realWidth / 2);
        y = coords[1] - (this.realHeight / 2);
        YAHOO.util.Dom.setXY(this.element, [x,y]);
        this.onRegionChanged.fire();
    },
    handleMouseMove: function(evt) {
        if (!(this.cfg.getProperty('visible') || this.isShowPending)) {
            return false;
        }
        var coords = YAHOO.util.Event.getXY(evt);
        var maxX = this.boundaryRegion.right - (this.realWidth / 2);
        var minX = this.boundaryRegion.left + (this.realWidth / 2);
        var maxY = this.boundaryRegion.bottom - (this.realHeight / 2);
        var minY = this.boundaryRegion.top + (this.realHeight / 2);
        if (coords[0] > maxX) coords[0] = maxX;
        if (coords[0] < minX) coords[0] = minX;
        if (coords[1] > maxY) coords[1] = maxY;
        if (coords[1] < minY) coords[1] = minY;
        this.setPosition(coords);
    },
    handleParentMouseOver: function() {
		this.parentRegion = YAHOO.util.Dom.getRegion(this.cfg.getProperty("parentElement"));
        this.show();
    },
    handleMouseOut: function(evt) {
		//if the relatedTarget is any element contained in the cursor box or the boundary,
		//the event should be ignored
		var ignoreNodes = [ this.getBoundary() ]
		.concat(
			YAHOO.util.Dom.getElementsBy(
				function() {return true},
				null,
				this.getBoundary()
			)   
		)  
		.concat(this.element)
		.concat(
			YAHOO.util.Dom.getElementsBy(
				function() {return true},
				null,
				this.element
			)   
		); 
		var relatedTarget = YAHOO.util.Event.getRelatedTarget(evt);
		for (var i = 0; i < ignoreNodes.length; i++) {
			if (ignoreNodes[i] == relatedTarget) {
				return;
			}
		}
		
		this.onParentMouseOut.fire(evt);
		this.hide();
    },
	show: function() {
		if (this.isShowPending) return;
		var oThis = this;
		this.isShowPending = true;
		setTimeout(function() {
			if (oThis.isShowPending) {
				YAHOO.extension.CursorPanel.superclass.show.call(oThis);
			}
		}, this.cfg.getProperty('showDelay'));
	},
	hide: function() {
		this.isShowPending = false;
		YAHOO.extension.CursorPanel.superclass.hide.call(this);
	}
});
