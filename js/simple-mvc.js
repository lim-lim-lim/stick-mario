var SimpleMVC = 

(function(){
	
	var controlMap = {};
	var modelMap = {};
	var viewMap = {};

	return {
		addControl:function( key, control ){
			controlMap[ key ] = control; 
			_initMVCParts( control );
			control.notify = _notify;
		},
		addModel:function( key, model ){
			modelMap[ key ] = model;
			_initMVCParts( model );
			model.notify = _notify;
		},
		addView:function( key, view ){
			viewMap[ key ] = view;
			_initMVCParts( view );
			view.notify = _notify;
			if( view.initEvent ){ view.initEvent( view ); }
		},
		notify:_notify
	};

	function _validateMVCParts( object ){
		if( !object.listen ){ throw new Error( "listen" ); return false; }
		return true;
	}

	function _initMVCParts( object ){
		if( !_validateMVCParts( object ) ){ return; } 
		object.getControl = _getControl;
		object.getModel = _getModel;
		object.getView = _getView;
	}

	function _notify( key, message, data ){
		var resultM = _notifyM( key, message, data );
		var resultV = _notifyV( key, message, data );
		var resultC = _notifyC( key, message, data );
		if( resultM ) return resultM;
		if( resultV ) return resultV;
		if( resultC ) return resultC;
	}
	function _notifyM( key, message, data ){ 
		if( modelMap[ key ] ) {
			return modelMap[ key ].listen( message, data );
		}	
	}
	function _notifyV( key, message, data ){ 
		if( viewMap[ key ] ){
			 return viewMap[ key ].listen( message, data );
		}
	}
	function _notifyC( key, message, data ){ 
		if( controlMap[ key ] ){
			return controlMap[ key ].listen( message, data );
		}	
	} 
	function _getControl( key ){ return controlMap[ key ]; }
	function _getModel( key ){ return modelMap[ key ];}
	function _getView( key ){ return viewMap[ key ]; }

}());