( function Game(){
	
	var score = 0;
	var interval = 1000/16;
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
			.on( "touchstart", function(){
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
			.on( "touchend", function(){
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
		var speed = 6;
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
		var startStep = null;
		var targetStep = null;
		var tempStep = null;
		var aniCount = 0;
		var nextStepCallback;
		_initStep();
		
		this.checkIn = function( length ){
			var measureLength = this.getStartX()+length;
			return measureLength >= targetStep.x && measureLength <= targetStep.x + targetStep.width;
		}

		this.getTargetX = function(){
			return targetStep.x + targetStep.width;
		}

		this.getStartX = function(){
			return startStep.x + startStep.width;
		}

		this.nextStep = function( complate ){
			nextStepCallback = complate;
			var callbackCount = 0;
			startStep.move( -targetStep.x, _aniCallback );
			targetStep.move( 0, _aniCallback );
			tempStep.move( random( targetStep.x + targetStep.width + 20, containerWidth - tempStep.width ), _aniCallback);
		}

		function _aniCallback(){
			aniCount++;
			if( aniCount == 3 ){
				aniCount = 0;
				var temp = startStep;
				startStep = targetStep;
				targetStep = tempStep;
				tempStep = temp;
				tempStep.setX( containerWidth );
				tempStep.setWidth( random( 12, 70 ) );
				if( nextStepCallback ) nextStepCallback();
			}
		}

		function _initStep(){
			startStep = new Step( 100, 0 );
			targetStep = new Step( 100, 300 );
			tempStep = new Step( 100, $container.css( "width") );
			$container.append( startStep.dom );
			$container.append( targetStep.dom );
			$container.append( tempStep.dom );
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