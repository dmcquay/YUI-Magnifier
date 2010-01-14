YUI().add('gallery-lens', function (Y) {
    function Lens(config) {
        Lens.superclass.constructor.apply(this, arguments);
    }
    Lens.NAME = 'lens';
    Lens.ATTRS = {
    	imageSrc: {},
    	loadingImageSrc: {},
    	imageHeight: {
    		value: 0
    	},
    	imageWidth: {
    		value: 0
    	},
    	showDelay: {
    		value: 0
    	}
    };
    
    Lens.IMAGE_CLASS = Y.ClassNameManager.getClassName(Lens.NAME, 'image');
    Lens.LOADING_IMAGE_CLASS = Y.ClassNameManager.getClassName(Lens.NAME, 'loading-image');
    
    Lens.IMAGE_TEMPLATE = '<img class="' + Lens.IMAGE_CLASS + '" />';
    Lens.LOADING_IMAGE_TEMPLATE = '<img class="' + Lens.LOADING_IMAGE_CLASS + '" />';
    
    Lens.HTML_PARSER = {},
    
    Y.extend(Lens, Y.Overlay, {
    	renderUI: function() {
    		//styling we are dependent on
    		this.get('contentBox')
    			.setStyle('overflow', 'hidden')
    			.setStyle('position', 'relative');
    		
	    	this._renderLoadingImage();
	    	this._renderImage();
	    },
	    bindUI: function() {
	    	Y.on('load', Y.bind(this._onImageLoad, this), this.get('contentBox').one('.' + Lens.IMAGE_CLASS));
	    },
	    _renderLoadingImage: function() {
			var imageSrc, contentBox, image;
			imageSrc = this.get('loadingImageSrc');
			if (!imageSrc) {
				return;
			}
			contentBox = this.get('contentBox');
			image = contentBox.one('.' + Lens.LOADING_IMAGE_CLASS);
			if (!image) {
				image = Y.Node.create(Lens.LOADING_IMAGE_TEMPLATE);
				contentBox.appendChild(image);
			}
			image.set('src', imageSrc);
			image.setStyle('display', 'block');
			this.loadingImageNode = image;
	    },
	    _renderImage: function() {
	    	var contentBox, image;
	    	var contentBox = this.get('contentBox'),
	    		image = contentBox.one('.' + Lens.IMAGE_CLASS);
	    	if (!image) {
	    		image = Y.Node.create(Lens.IMAGE_TEMPLATE);
	    		contentBox.appendChild(image);
	    		
				//styling we are dependent on
				image.setStyle('position', 'absolute');
	    	}
	    	image.set('src', this.get('imageSrc'));
	    	if (this.get('loadingImageSrc')) {
	    		image.setStyle('display', 'none');
	    	} else {
		    	image.setStyle('display', 'block');
	    	}
	    	this.imageNode = image;
	    },
	    _onImageLoad: function(e) {
	    	var imageRegion = this.imageNode.get('region');
	    	
	    	//hide loading image, show main image
	    	this.loadingImageNode.setStyle('display', 'none');
	    	this.imageNode.setStyle('display', 'block');
	    	
	    	//set image dimensions
			this.imageWidth = imageRegion.right - imageRegion.left;
			this.imageHeight = imageRegion.bottom - imageRegion.top;
	    },
	    setOffsets: function(newLeft, newTop) {
			this.imageNode.setStyle('top', newTop + 'px');
			this.imageNode.setStyle('left', newLeft + 'px');
		},
		show: function() {
			var oThis = this;
			this.isShowPending = true;
			setTimeout(function() {
				if (oThis.isShowPending) {
					Lens.superclass.show.call(oThis);
				}
			}, this.get('showDelay'));
		},
		hide: function() {
			this.isShowPending = false;
			Lens.superclass.hide.call(this);
		}
    });
    Y.Lens = Lens;
}, '3.0.0' ,{requires:['overlay']});
