var scene = ( function(){
	var scenes = [];
	var currentScene = null;
	return {

		addScene:function( name, scene ){
			scenes[ name ] = scene;
			scene.hide();
		},

		setScene:function( name ){
			if( currentScene ){ currentScene.hide(); }
			scenes[ name ].show();
			currentScene =scenes[ name ];
		}
	}
}());