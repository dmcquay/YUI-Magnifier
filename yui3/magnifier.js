YUI().add('gallery-lens', function (Y) {
    function Lens(config) {
        Lens.superclass.constructor.apply(this, arguments);
    }
    Lens.NAME = 'lens';
    Lens.ATTRS = {
    	imageSrc: {},
    	loadingImageSrc: {}
    };
    
    Lens.IMAGE_CLASS = Y.ClassNameManager.getClassName(Lens.NAME, 'image');
    Lens.LOADING_IMAGE_CLASS = Y.ClassNameManager.getClassName(Lens.NAME, 'loading-image');
    
    Lens.IMAGE_TEMPLATE = '<img class="' + Lens.IMAGE_CLASS + '" />';
    Lens.LOADING_IMAGE_TEMPLATE = '<img class="' + Lens.LOADING_IMAGE_CLASS + '" />';
    
    Lens.HTML_PARSER = {};
    Y.extend(Lens, Y.Overlay, {
    	renderUI: function() {
    		//since we absolutely depend on this styling, I thought it should go here, rather that in a styling sheet
    		this.get('contentBox').setStyle('overflow', 'hidden');
	    	this._renderLoadingImage();
	    	this._renderImage();
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
			image.setStyle('visibility', 'inherit');
	    },
	    _renderImage: function() {
	    	var contentBox, image;
	    	var contentBox = this.get('contentBox'),
	    		image = contentBox.one('.' + Lens.IMAGE_CLASS);
	    	if (!image) {
	    		image = Y.Node.create(Lens.IMAGE_TEMPLATE);
	    		contentBox.appendChild(image);
	    	}
	    	image.set('src', this.get('imageSrc'));
	    	if (this.get('loadingImageSrc')) {
	    		image.setStyle('visibility', 'hidden');
	    	} else {
		    	image.setStyle('visibility', 'inherit');
	    	}
	    }
    });
    Y.Lens = Lens;
}, '3.0.0' ,{requires:['overlay']});
