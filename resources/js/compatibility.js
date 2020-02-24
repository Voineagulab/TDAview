var Compatibility = {
	isWebGLAvailable: function() {
		try {
			var canvas = document.createElement( 'canvas' );
			return !! ( window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ) );
		} catch ( e ) {
			return false;
		}
	},

	isES6Available: function() {
		try {
			Function("() => {};");
			return true;
		} catch(exception) {
			return false;
		}
	}
};