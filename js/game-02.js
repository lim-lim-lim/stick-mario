( function Game(){
	
	var GAME_CONTROL = (function(){
		var touchLock = true;
		var c = {
			listen:function( msg, data ){
				switch( msg ){
					case "startup": _startup(); break;
					case "run": _run(); break;
					case "check-success": _checkSuccess( data ); break;
					case "is-touch-lock": return touchLock; break;
					case "control-ready": touchLock=false; break;
				}
			}	
		}

		function _startup(){
			c.notify( "game-model", "get-rank" );
			c.notify( "start-view", "init" );
			c.notify( "bg-view", "move" );	
		}

		function _run(){
			c.notify( "game-view", "init" );
		}

		function _checkSuccess( data ){
			var targetArea = c.notify( "game-model", "get-target-step-data" );
			if( data >= targetArea.x && data <= targetArea.x+targetArea.width ){
				c.notify( "mario-view", "move", targetArea.x+targetArea.width );
			}else{
				c.notify( "mario-view", "die");
				c.notify( "mario-view", "move", data );
			}
		}

		return c;
	}());

	var GAME_MODEL = (function(){
		var score = 0;
		var steps = null;
		var m = {
			listen:function( msg, data ){
				switch( msg ){
					case "get-rank": _getRank(); break;
					case "init-step-data": _initStepData( data ); break;
					case "next-step-data": _nextStepData( data ); break;
					case "get-current-step-data": return _getCurrentStepData(); break;
					case "get-target-step-data": return _getTargetStepData(); break;
				}				
			}
		}

		function _getCurrentStepData(){
			return steps[ 0 ];
		}

		function _getTargetStepData(){
			return steps[ 1 ];
		}

		function _getRank(){
			var data = new Array( 10 );
			m.notify( "game-view", "get-rank", data );
		}

		function _initStepData( w ){
			steps = [ 
				{ x:0, width:70 },
				{ x:random( 90, w-70 ), width:70 }
			];
			m.notify( "stepper-view", "init-step", steps );	
		}

		function _nextStepData( w ){
			var slideOutX = steps[ 1 ].x;
			var tempWidth = steps[ 1 ].width;
			steps[ 0 ].width = tempWidth;
			steps[ 0 ].x = 0;
			steps[ 1 ].width = random( 15, 70 );
			steps[ 1 ].x = random( steps[ 0 ].width+20, w-steps[ 1 ].width );
			m.notify( "stepper-view", "update-step", steps );
			m.notify( "mario-view", "update-position", steps[ 0 ].width );	
			m.notify( "stick-view", "slide-out", slideOutX );	
		}

		return m;
	}());

	var START_VIEW = ( function(){
		var view = $( "#start-view" );
		var rankList = view.find( "#rank-list" );
		var startBtn = view.find( "#start-btn" );
		_hide();
		
		function _init(){
			_show();
			rankList.empty();
			//v.notify( "game-control", "run" );
		}

		function _showRank( data ){
			var listItems = "";
			for( var i=0, count=data.length ; i<count ; i+=1 ){
				listItems += "<li> name : "+data[i].name+" / score  : "+data[i].score+"</li>";
			}
			rankList.innerHTML( listItems );
		}
		
		function _show(){ view.show(); }
		function _hide(){ view.hide(); }
		
		var v = {
			initEvent:function( view ){
				startBtn.on( "click", function(){
					_hide();
					view.notify( "game-view", "init" );
				})
			},
			listen:function( msg, data ){
				switch( msg ){
					case "init": _init(); break;
					case "show": _show(); break;
					case "hide": _hide(); break;
					case "show-rank": _showRank( data ); break;
				}
			}
		}

		return v;
	}());

	var END_VIEW = ( function(){
		var view = $( "#end-view" );
		_hide();
		function _show(){ view.show(); }
		function _hide(){ view.hide(); }
		
		return {
			initEvent:function( view ){

			},
			listen:function( msg, data ){
				switch( msg ){
					case "show": _show(); break;
					case "hide": _hide(); break;
				}
			}
		}
	}());

	var GAME_VIEW = ( function(){
		var view = $( "#game-view" );
		var isLock = false;
		_hide();

		function _init(){
			_show();
			v.notify( "mario-view", "init" );
			v.notify( "stepper-view", "init" );
		}

		function _show(){ view.show(); }
		function _hide(){ view.hide(); }
		
		var v = {
			initEvent:function( view ){		

				$( document )
					.on( "touchstart", function( evnet ){
						if( isLock || v.notify( "game-control", "is-touch-lock") ) return;	
						isLock = true;
						view.notify( "stick-view", "init" );
						view.notify( "stick-view", "update-height" );
					})
					.on( "touchend", function( event ){
						if( v.notify( "game-control", "is-touch-lock") ) return;	
						isLock = false;
						view.notify( "stick-view", "stick-down" );
					})
				/*
					.on( "keydown", function( evnet ){
						if( event.keyCode != 32 ) return;
						if( isLock ) return;	
						isLock = true;
						view.notify( "stick-view", "init" );
						view.notify( "stick-view", "update-height" );
					})
					.on( "keyup", function( event ){
						if( event.keyCode != 32 ) return;
						isLock = false;
						view.notify( "stick-view", "stick-down" );
					})
				*/
			},
			listen:function( msg, data ){
				switch( msg ){
					case "init": _init(); break;
					case "show": _show(); break;
					case "hide": _hide(); break;
				}
			}
		}

		return v;
	}());

	var BG_VIEW = ( function(){
		var cloud = $( "#bg-cloud" );
		var hills = $( "#bg-hills" );
		var bushes = $( "#bg-bushes" );
		var cloudSpeed = 0.2;
		var hillsSpeed = 1;
		var bushesSpeed = 2.5;
		var cloudPosition = 0;
		var hillsPosition = 0;
		var bushesPosition = 0;
		var interval = 1000/32;
		var intervalId;

		function _move(){
			_stop();
			intervalId = setInterval( function(){
				cloud.css( "background-position", ( cloudPosition -= cloudSpeed )+"px 0px" );
				hills.css( "background-position", ( hillsPosition -= hillsSpeed )+"px 0px" );
				bushes.css( "background-position", ( bushesPosition -= bushesSpeed )+"px 0px" );
			}, interval );
		}

		function _stop(){
			clearInterval( intervalId );
		}

		var v = {
			listen:function( msg, data ){
				switch( msg ){
					case "move": _move(); break;
					case "stop": _stop(); break;
				}
			}
		}

		return v;
	}());

	var MARIO_VIEW = ( function(){
		var view = $( "#mario" );
		var width = view.width();
		var stageWidth = $( document ).width();
		var speed = 7;
		var fps = 1000/20;
		var tileIndex = 0;
		var tileNum = 8;
		var isDie = false;
		var isIntro = true;
		var intervalId;
		_hide();

		function _init(){
			isIntro = true;
			_show();
			view.css( "left", -width ); 
			_move( 70 ); 
		}
		function _show(){ view.show(); }
		function _hide(){ view.hide(); }
		function _die(){ isDie = true;}
		function _dieAni(){  view.stop().animate( { "bottom":0 } ); }
		function _move( x ){  
			var targetX = ( !isDie ) ? x-width : x;
			var x = parseInt( view.css( "left" ) );

			v.notify( "bg-view", "move" );
			intervalId = setInterval( function(){
				tileIndex++;
				if( tileIndex >= tileNum ){ tileIndex = 0; }
				_updateTile();
				if( x + speed > targetX){
					x = targetX;
					_stop();
					v.notify( "bg-view", "stop" );
					if( isIntro ){
						isIntro = false;
						v.notify( "game-control", "control-ready" );
						return;
					}
					if( isDie ){
						_dieAni();
					}else{
						v.notify( "game-model", "next-step-data", stageWidth );
					}
				}else{
					x+=speed;
				}

				view.css( { "left": x } );

			}, fps );
		}

		function _updatePosition( x ){
			view.stop().animate( { "left": x-width } );
		}

		function _updateTile(){
			view.css( "background-position", width * -tileIndex + "px 0px" )
		}

		function _stop(){
			tileIndex = 0;
			_updateTile();
			clearInterval( intervalId );
		}

		var v = {
			listen:function( msg, data ){
				switch( msg ){
					case "init": _init(); break;
					case "show": _show(); break;
					case "hide": _hide(); break;
					case "die": _die(); break;
					case "move": _move( data ); break;
					case "update-position": _updatePosition( data ); break;
				}
			}
		}

		return v;
	}());

	var STICK_VIEW = ( function(){
		var view = $( "#stick" ).hide();
		var interval = 1000/60;
		var speed = 5;
		var height = 0;
		var degree = 0;
		var x = 0
		var intervalId;
		var v = {
			listen:function( msg, data ){
				switch( msg ){
					case "init": _init(); break;
					case "update-height": _updateHieght(); break;
					case "stick-down": _stickDown(); break;
					case "slide-out": _slideOut( data ); break;
				}
			}
		}

		function _init(){
			view.show();
			degree = 0;
			height = 0;
			x = v.notify( "game-model", "get-current-step-data").width;
			view.css( { transform:"rotate( 0deg )", left: x, height:0, opacity:1 } );

		}

		function _slideOut( value ){
			view.stop().animate( { left:x-value, opacity:0 } );
		}

		function _updateHieght(){
			intervalId = setInterval( _updateHieghtInterval, interval )
		}

		function _updateHieghtInterval(){
			height += speed;
			view.css( "height", height );
		}

		function _stickDown(){
			clearInterval( intervalId );
			$( {deg:degree} ).animate( { deg:90 }, 
			{ 	
				duration:700,
				easing:"easeOutBounce",
				step:function( value ){
					view.css( { transform:"rotate( "+value+"deg )"});
				},
				complete:function(){
					degree = 90;
					v.notify( "game-control", "check-success", height+x );
				}
			});	
		}

		return v;
	}());

	var STEPPER_VIEW = ( function(){
		var view = $( "#step-container" );
		var width = $( document ).width();
		var currentStep = $( "<div class='step'></div>" );
		var inComingStep = $( "<div class='step'></div>" );
		var outStep = $( "<div class='step'></div>" );
		var aniCount = 0;
		view.append( currentStep );
		view.append( inComingStep );
		view.append( outStep );

		var v = {
			listen:function( msg, data ){
				switch( msg ){
					case "init": _init(); break;
					case "init-step": _initStep( data ); break;
					case "update-step": _updateStep( data ); break;
				}
			}
		}

		function _init(){
			v.notify( "game-model", "init-step-data", width );
		}

		function _initStep( data ){		
			outStep.css( { "width":0, "left":0 } );
			currentStep.css( { "width":data[0].width, "left":data[0].x });
			inComingStep.css( { "width":data[1].width, "left":data[1].x });
			_updateStepComplete();
		}

		function _updateStep( data ){
			outStep.stop().animate( {"left": -currentStep.position().left } );
			currentStep.stop().animate( {"left": data[0].x} );
			inComingStep.stop().css( "width",data[1].width ).animate( {"left": data[1].x}, _updateStepComplete );
		}

		function _updateStepComplete(){
			var temp = outStep;
			outStep = currentStep;
			currentStep = inComingStep;
			inComingStep = temp;
			inComingStep.css( "left", width );
		}

		return v;

	}());

	SimpleMVC.addControl( "game-control", GAME_CONTROL );
	SimpleMVC.addModel( "game-model", GAME_MODEL );
	SimpleMVC.addView( "start-view", START_VIEW );
	SimpleMVC.addView( "game-view", GAME_VIEW );
	SimpleMVC.addView( "end-view", END_VIEW );
	SimpleMVC.addView( "mario-view", MARIO_VIEW );
	SimpleMVC.addView( "stick-view", STICK_VIEW );
	SimpleMVC.addView( "bg-view", BG_VIEW );
	SimpleMVC.addView( "stepper-view", STEPPER_VIEW );

	SimpleMVC.notify( "game-control", "startup" );


 
	return;
	var score = 0;
	var interval = 1000/32;
	var currentStickHeight = 0;	
	var $world = $( "#world" );
	$world.css( { "width":$world.width(), "height":$world.height() } );
	var $scoreContainer = $( "#score" ).text( score );

	var bg = null;
	var mario = null;
	var stepper = null;
	var stick = null;
	var control = null;
	var facade = null;
	
	function Mediator(){

	}
	Mediator.prototype.addCotrol = function( key, command ){

	}
	Mediator.prototype.addView = function( key, view ){
		
	}
	Mediator.prototype.addModel = function( key, model ){
		
	}

	function Model(){
		this.score = 0;
		this.checkEntry = function(){}
		this.insertRecord = function(){}
	}
	Model.getInstance = function(){
		if( !Model.instance ){ Model.instance = new Model(); }
		return Model.instance;
	}
	function View(){}
	View.getInstance = function(){
		if( !View.instance ){ View.instance = new View(); }
		return View.instance;
	}
	function Control(){}
	Control.getInstance = function(){
		if( !Control.instance ){ M.instance = new Control(); }
		return Control.instance;
	}
	

	function createInstance(){
		bg = Bg.getInstance();
		mario = Mario.getInstance();
		stepper = Stepper.getInstance();
		stick = Stick.getInstance();
		control = Control.getInstance( 
			function( value ){
				stick.show();
				stick.rotate0();
				stick.setX( stepper.getStartX() );
			},
			function( value ){
				stick.setHeight( value );
			},
			function( value ){
				control.lock();
				stick.rotate( 90, facade.go );
				currentStickHeight  = value;
			});

		facade = Facede.getInstance();
		facade.init();
	}
	
	function Facede(){
		this.init = function(){
			mario.translate( 100 );	
			score = 0;	
			this.updateScore();
		}
		this.setupNextStep = function(){
			bg.stop();
			stepper.nextStep( function(){ control.unlock(); });
			mario.translate( stepper.getTargetX(), true );
			stick.setX( stepper.getStartX(), true );
			stick.hide();
			score++;
			Facede.getInstance().updateScore();
		}
		this.go = function(){
			bg.move();
			if( stepper.checkIn( currentStickHeight ) ){
				mario.go( stepper.getTargetX(), Facede.getInstance().setupNextStep );
			}else{
				mario.go( stepper.getStartX()+currentStickHeight+20, function(){
					bg.stop();
					stick.rotate( 180 );
					stick.hide();
					mario.die( Facede.getInstance().end );
				} );
			}
		}
		this.end = function(){

		}
		this.updateScore = function(){
			$scoreContainer.text( score );
		}
	}

	Facede.getInstance = function(){
		if( !Facede.instance ){ Facede.instance = new Facede(); }
		return Facede.instance;
	}

	function Ui(){

	}

	function Net(){
		var url = "localhost:8888/";
		this.rank = function(){}
		this.insertScore = function(){}
	}
	
	function Control( updateStartCallback, updateCallback, updateCompleteCallback ){
		var $world = $( "#world" );
		var interval = 1000/60;
		var intervalId;
		var value = 0;
		var updateStartCallback = updateStartCallback;
		var updateCallback = updateCallback;
		var updateCompleteCallback = updateCompleteCallback;
		var isLock = false;
		var isUpdateStart = true;
		var isDown = false;
		$world
			.on( "mousedown", function(){
				if( isLock ) return;
				isDown = true;
				value = 0;
				intervalId = setInterval( (function(){
					return function(){
						value+=10;
						if( isUpdateStart ){
							isUpdateStart = false;
							updateStartCallback( value )
						}
						updateCallback( value );
					}		
				})(),  interval );
			})
			.on( "mouseup", function(){
				if( isLock ) return;
				if( !isDown ) return;
				isDown = false;
				clearInterval( intervalId );
				isUpdateStart = true;
				updateCompleteCallback( value );
			});

		this.lock = function(){ isLock = true; }
		this.unlock = function(){ isLock = false; }
	}

	function Stick(){
		var $container = $( "#stick" ).css( "opacity", 0);  
		var x;
		var y;
		var height;
		var degree = 0;
		this.setX = function( value, isAni ){
			x = value;
			if( isAni ){ $container.animate( {"left": value } );	}
			else{ $container.css( "left", value );	}
		}

		this.show = function(){
			$container.stop().css( { "opacity":1 } );
		}

		this.hide = function(){
			$container.animate( { "opacity":0 } );
		}

		this.setHeight = function( value ){
			height = value;
			$container.css( "height", value );
		}

		this.getMeasureHeight = function( ){
			return x + height;
		}

		this.rotate = function( deg, complate ){
			$( {deg:degree} ).animate( { deg:deg }, 
			{ 	
				duration:300,
				step:function( value ){
					$container.css( { transform:"rotate( "+value+"deg )"});
				},
				complete:function(){
					degree = deg;
					if( complate ) complate();	
				}
			});	
		}

		this.rotate0 = function( ){
			degree = 0;
			$container.css( { transform:"rotate( 0deg )"});
		}
	}

	Stick.getInstance = function(){
		if( !Stick.instance ){ Stick.instance = new Stick(); }
		return Stick.instance;
	}

	Control.getInstance = function( updateStartCallback, updataCallback, updateCompleteCallback ){
		if( !Control.instance ){ Control.instance = new Control( updateStartCallback, updataCallback, updateCompleteCallback ); }
		return Control.instance;
	}
	
	function Bg(){
		var cloud = { container:$( "#bg-cloud" ), speed:0.5, position:0 };
		var hills = { container:$( "#bg-hills" ), speed:3, position:0 };
		var bushes = { container:$( "#bg-bushes" ), speed:6, position:0 };
		var intervalId;
		this.move = function(){
			intervalId = setInterval( function(){
				cloud.container.css( "background-position", (cloud.position-=cloud.speed)+"px 0px" );
				hills.container.css( "background-position", (hills.position-=hills.speed)+"px 0px" );
				bushes.container.css( "background-position", (bushes.position-=bushes.speed)+"px 0px" );
			}, interval )
		}

		this.stop = function(){
			clearInterval( intervalId );
		}
	}

	Bg.getInstance = function(){
		if( !Bg.instance ) Bg.instance = new Bg();
		return Bg.instance;
	}

	function Mario(){
		var $container = $( "#mario" ).css( "left", 100 );
		// var interval = 1000/24;
		var intervalId;
		var w = 23;
		var h = 35;
		var tileNum = 8;
		var index = 0;
		var speed = 1;
		var width = parseInt( $container.css( "width" ) );

		this.translate = function( x, isAni, complate ){
			x -= width;
			if( isAni ){$container.animate( {"left": x}, complate );}
			else{$container.css( "left", x );}
		}

		this.die = function( complate ){
			$container.stop().animate( {"bottom": -10}, complate );
		}

		this.go = function( x, complate ){
			x -= width;
			var currentX = parseInt( $container.css( "left" ) );
			var self = this;
			intervalId = setInterval( function(){
				_setTilePosition( index++ );
				if( index >= tileNum ){ index = 0; }
				if( currentX + speed > x){
					currentX = x;
					self.stop();
					if( complate ) complate();
				}else{
					currentX+=speed;
				}

				$container.css( { "left": currentX } );

			}, interval );
		}

		this.stop = function(){
			_setTilePosition( index=0 );
			clearInterval( intervalId );
		}

		function _setTilePosition( index ){
			$container.css( "background-position", _getTilePosition( index ) )
		}
		function _getTilePosition( index ){
			return w*-index + "px 0px";
		}
	}

	Mario.getInstance = function(){
		if( !Mario.instance ) Mario.instance = new Mario();
		return Mario.instance;
	}

	
	function Step( width, x ){
		this.width = width;
		this.x = x;
		this.dom = $( "<div class='step'></div>" ).css( { "width":this.width, "left":this.x });
	} 

	Step.prototype.move = function( x, complate ){
		this.x = x;
		this.dom.animate( { "left":x }, complate );
	}

	Step.prototype.setWidth = function( width ){
		this.width = width;
		this.dom.css( "width", width );
	}

	Step.prototype.setX = function( x ){
		this.x = x;
		this.dom.css( "left", x );
	}

	function Stepper(){
		var self = this;
		var $container = $( "#step-container" ); 
		var containerWidth = parseInt( $container.css( "width") );
		var currentStep = null;
		var inComingStep = null;
		var outStep = null;
		var aniCount = 0;
		var nextStepCallback;
		_initStep();
		
		this.checkIn = function( length ){
			var measureLength = this.getStartX()+length;
			return measureLength >= inComingStep.x && measureLength <= inComingStep.x + inComingStep.width;
		}

		this.getTargetX = function(){
			return inComingStep.x + inComingStep.width;
		}

		this.getStartX = function(){
			return currentStep.x + currentStep.width;
		}

		this.nextStep = function( complate ){
			nextStepCallback = complate;
			var callbackCount = 0;
			currentStep.move( -inComingStep.x, _aniCallback );
			inComingStep.move( 0, _aniCallback );
			outStep.move( random( inComingStep.x + inComingStep.width + 20, containerWidth - outStep.width ), _aniCallback);
		}

		function _aniCallback(){
			aniCount++;
			if( aniCount == 3 ){
				aniCount = 0;
				var temp = currentStep;
				currentStep = inComingStep;
				inComingStep = outStep;
				outStep = temp;
				outStep.setX( containerWidth );
				outStep.setWidth( random( 12, 70 ) );
				if( nextStepCallback ) nextStepCallback();
			}
		}

		function _initStep(){
			currentStep = new Step( 100, 0 );
			inComingStep = new Step( 100, 300 );
			outStep = new Step( 100, $container.css( "width") );
			$container.append( currentStep.dom );
			$container.append( inComingStep.dom );
			$container.append( outStep.dom );
		}
	}

	Stepper.getInstance = function(){
		if( !Stepper.instance ) Stepper.instance = new Stepper();
		return Stepper.instance;
	}



	function random( min, max ){
		return Math.round( Math.random()*( max - min ) + min );
	}


	createInstance();

}());