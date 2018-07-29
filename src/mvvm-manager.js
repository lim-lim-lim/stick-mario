var mvvm = ( function(){


	var vms = {};
	var commands = {};
	var invoker = { exe:function( key, data){ 
		if( commands[ key ] ){
			commands[ key ]( data, modelFinder, vmFinder, notifier );
		}else{
			throw new Error( "not found " + key + " command" );
		}
		
	} };
	var models = {};
	var result = {};
	var messages = {};
	var modelFinder = { get:function( key){return models[ key ];}};
	var vmFinder = { get:function( key){return vms[ key ];}};
	var notifier = { notify:function( msg, data ){ _notify( msg, data );}};

	result.addView = function( v ){ 
		v = new v( invoker );
		_addMessage( v, v.messages );
	};

	result.addModel = function( key, model ){
		models[ key ] = new model( vmFinder );
	};

	result.addViewModel = function( key ){
		var vm = {};
		vms[ key ] = vm;
		vm.data = {};
		vm.update = _updateViewModel;
		vm.commit = _commitViewModel;
	};

	result.addCommand = function( key, cmd ){
		cmd.getViewModel = _getViewModel;
		commands[ key ] = cmd;
	};

	result.exe = function( key, data ){
		invoker.exe( key, data );
	};

	function _addMessage( view, msgs ){
		for( var i=0, count=msgs.length ; i<count ; i+=1 ){
			if( !messages[ msgs[ i ] ] ){ messages[ msgs[ i ] ]  = []; }
			messages[ msgs[ i ] ].push( view );
		}
	}

	function _getViewModel( key ){
		return vms[ key ];
	}

	function _updateViewModel( name, value ){
		this.data[ name ] = value;
	}

	function _commitViewModel( msg ){
		_notify( msg, this.data ); 
	}

	function _notify( msg, data ){
		if( !messages[ msg ] ){
			throw new Error( "no message" );
		}
		for( var i=0, count=messages[ msg ].length ; i<count ; i+=1 ){
			messages[ msg ][ i ].listen( msg, data );
		}
	}

	return result;
}());