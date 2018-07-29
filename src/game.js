( function Game(){
	var bg = new Bg();
	var snd = new Sound();

	var readyScene = {
		dom:$( "#start-view" ),
		show:function(){
			this.dom.show();
			mvvm.exe( "get-rank" );
		},
		hide:function(){
			this.dom.hide();
		}
	}

	var gameScene = {
		dom:$( "#game-view" ),
		show:function(){
			this.dom.show();
			mvvm.exe( "intro-game" );
		},
		hide:function(){
			this.dom.stop().fadeOut();
		}
	}

	var endScene = {
		dom:$( "#end-view" ),
		show:function(){
			this.dom.stop().fadeIn();
		},
		hide:function(){
			this.dom.stop().fadeOut();
		}
	}

	var readyView = function( invoker ){
		var $rankList = $( "#rank-list" );
		var $startBtn = $( "#start-btn" );
		var $showRankBtn = $( "#show-rank" );
		var $rankList = $( "#rank-list" );
		this.messages = [ "update-rank-data", "ready-game" ];
		bg.move();
		_init();

		function _init(){
			$startBtn.on( "click", function(){
				scene.setScene( "game" );
			});
			$showRankBtn.on( "click", function(){
				if( !this.shown ){
					this.shown = true;
					$rankList.stop().fadeIn();
				}else{
					this.shown = false;
					$rankList.stop().fadeOut();
				}
			})
		}

		this.listen = function( msg, data ){
			switch(  msg ){
				case "update-rank-data":
					updateRankData( data.rankData );
					break;
			}
		}

		function updateRankData( data ){
			$rankList.empty();
			var list = "";

			for( var i=0, count=data.length ; i<count ; i+=1 ){
				list += "<li class='list-group-item'><span class='badge'>"+data[ i ].SCORE+"</span>"+(i+1)+". "+data[ i ].NAME + "</li>";
			}
			$rankList.html( list );
		}
	}

	var gameView = function( invoker ){
		this.messages = [ "intro-game" ];
		var gameView = $( "#game-view" );
		var socreView = $( "#score" );
		var viewWidth = gameView.width();
		var viewHeight = gameView.height();
		var stepper = new Stepper( viewWidth );
		var mario = new Mario( stepper );
		var stick = new Stick( stepper );
		var isLock = true;
		var score = 0;

		function _introGame(){
			socreView.text( score=0 );
			stepper.init();
			mario.show();
			mario.init( _init );
			bg.move();
			snd.playBgm();
		}

		function _init(){
			bg.stop();
			_unlock();
			$( document ).off()
			.on( "keydown", function( evnet ){
				if( isLock ) return;
				if( event.keyCode != 32 ) return;
				_lock();
				snd.playEff( 2 );
				stick.grow();
			})
			.on( "keyup", function( event ){
				if( event.keyCode != 32 ) return;
				if( !stick.getIsGrowing() ) return;
				snd.stopEff( 2 );
				stick.stop();
				stick.down( _goMario );
			});
		}

		function _goMario(){
			bg.move();
			var stickEndPosition = stick.getEndPosition();
			if( stepper.checkInPosition( stickEndPosition ) ){
				mario.success( _next );
			}else{
				mario.fail( stickEndPosition, _end );
			}
		}

		function _next(){
			snd.playEff( 0 ); 
			_scoreUp();
			stepper.next();
			mario.next( _unlock );
			stick.next();
			bg.stop();
		}

		function _end(){
			snd.stopBgm();
			snd.playEff( 1 );
			mario.end( function(){ setTimeout( function(){  invoker.exe( "end-game", score ); }, 800 ); });
			stick.end();
			bg.stop();
		}

		function _unlock(){ isLock = false; }
		function _lock(){ isLock = true; }
		function _scoreUp(){ socreView.text( ++score ); }

		this.listen = function( msg, dat ){
			switch( msg ){
				case "intro-game": _introGame(); break;
			}
		}
	}

	var endView = function( invoker ){
		this.messages = [ "get-user-score", "check-entrey-10" ];
		var gameView = $( "#end-view" );
		var socreView = $( "#user-score" );		
		var restart = $( "#restart" );
		var regist = $( "#regist" );
		var registScore = $( "#regist-score" ).hide();
		var userName = $( "#user-name" );
		var goHome = $( "#go-home" );
		var score;

		_init();

		function _init(){
			restart.on( "click", function(){ scene.setScene( "game" ); } );
			regist.on( "click", function(){ invoker.exe( "reg-score", { name:userName.val(), score:score } );} );
			goHome.on( "click", function(){ scene.setScene( "ready" ); })
		}

		function _setScore( value ){
			score = value;
			registScore.hide();
			userName.val( '' );
			socreView.text( score );			
			invoker.exe( "check-entry-10", score );
		}

		function _isEntry10( value ){
			if( value == "Y" ){ registScore.show();
			}else{ registScore.hide(); }
		} 
		this.listen = function( msg, data ){
			switch( msg ){
				case "get-user-score": _setScore( data ); break;
				case "check-entrey-10" : _isEntry10( data.isEntry ); break;
			}
		}
	}

	function Stick( stepper ){
		var view = $( "#stick" ).css( "height", 0 );
		var width = view.width();
		var height = 0;
		var degree = 0;
		var speed = 10;
		var intervalId;
		var fps = 1000/32;
		var stepper = stepper;
		var isGrowing = false;


		this.getEndPosition = function(){
			return parseFloat( view.css( "left" ) ) + height;
		}

		this.getIsGrowing = function(){
			return isGrowing;
		}

		this.grow = function(){
			degree = 0;
			view.show();
			view.css( {"left": stepper.getStepInfo( "current" ).end-width, "transform":"rotate( 0deg )", "height":0,  opacity:1 } );
			height = 0;		
			intervalId = setInterval( _growStick, fps );
			isGrowing = true;
		}

		this.stop = function(){
			clearInterval( intervalId );
			isGrowing = false;
		}

		this.down = function( complete ){
			setTimeout( function(){ snd.playEff( 3 ); }, 500 );
			$( {deg:degree} ).stop().delay(100).animate( { deg:90 }, 
			{ 	
				duration:1000,
				easing:"easeOutBounce",
				step:function( value ){
					view.css( { transform:"rotate( "+value+"deg )"});
				},
				complete:function(){
					degree = 90;
					complete();
				}
			});	
		}

		this.next = function( complete ){
			view.stop().animate( {"left":-stepper.getDistance() + view.position().left,  opacity:0  }, complete );
		}

		this.end = function( complete ){
			$( {deg:degree} ).stop().animate( { deg:180 }, 
			{ 	
				step:function( value ){
					view.css( { transform:"rotate( "+value+"deg )"});
				},
				complete:function(){
					degree = 90;
					if( complete ){ complete(); }
				}
			});	
			view.animate( { opacity:0 } );
		}

		function _growStick(){
			height += speed;
			view.css( "height", height );
		}
	}

	function Mario( stepper ){
		var view = $( "#mario" );
		var width = view.width();
		var speed = 10;
		var fps = 1000/22;
		var tileIndex = 0;
		var tileNum = 8;
		var intervalId;
		var stepper = stepper;
		this.show = function(){ view.show(); }
		this.hide = function(){ view.hide(); }
		
		this.init = function( complete ){
			view.css( {"bottom": 200, "left":-width} );
			_moveIn( stepper.getStepInfo( "current" ).end, complete );
		}

		this.success = function( complete ){
			_moveIn( stepper.getStepInfo( "next" ).end, complete );
		}

		this.fail = function( position, complete ){
			_move( position, complete );
		}

		this.next = function( complete ){
			view.stop().animate( { "left":stepper.getStepInfo("next").width-width }, 500, complete );
		}

		this.end = function( complete ){
			view.stop().animate( {"bottom":-10 }, { duration:300, easing:"easeInExpo", complete:complete} );
		}

		function _moveIn( targetX, complete ){ _move( targetX-width, complete );}
		function _move( targetX, complete ){  
			var x = parseInt( view.css( "left" ) );
			intervalId = setInterval( function(){
				tileIndex++;
				if( tileIndex >= tileNum ){ tileIndex = 0; }
				_updateTile();
				if( x + speed > targetX){
					x = targetX;
					_stop();
					if( complete ){ complete(); }
				}else{
					x+=speed;
				}
				view.css( { "left": x } );

			}, fps );
		}

		function _updateTile(){
			view.css( "background-position", width * -tileIndex + "px 0px" )
		}

		function _stop(){
			tileIndex = 0;
			_updateTile();
			clearInterval( intervalId );
		}
	};


	function Stepper( width ){
		var view = $( "#step-container" );
		var width = width;
		var currentStep = $( "<div class='step'></div>" );
		var nextStep = $( "<div class='step'></div>" );
		var readyStep = $( "<div class='step'></div>" );
		var aniCount = 0;
		
		_initStep();

		function _initStep( data ){		
			view.append( currentStep );
			view.append( nextStep );
			view.append( readyStep );	
		}

		this.init = function(){
			readyStep.css( { "width":_random( 30, 100 ), "left":width } );
			currentStep.css( { "width":90, "left":0 });
			nextStep.css( { "width":90, "left":_random( 100, width-90) });
		}

		this.checkInPosition = function( value ){
			var stepInfo = this.getStepInfo( "next" );
			return value+1 >= stepInfo.start && value-1 <= stepInfo.end;
		}

		this.next = function(){
			currentStep.stop().animate( {left:-this.getDistance() }, 500  );
			nextStep.stop().animate( { left:0 }, 500 ); 
			var nextWidth = _random( 30, 100 );
			var nextLeft = _random( 100, width-nextWidth );
			var color = "rgb( "+_random( 150,255 )+","+_random( 150,255 )+","+_random( 150,255 )+")"
			readyStep.stop().css( {"left": width, "width":nextWidth, "background-color":color} ).animate( { "left":nextLeft }, 500, function(){
				var temp = currentStep;
				currentStep = nextStep;
				nextStep = readyStep;
				readyStep = temp;
			} );
		}

		this.getDistance = function(){
			var x1 = currentStep.position().left;
			var x2 = nextStep.position().left;
			return x2-x1;
		}

		this.getStepInfo = function( type ){
			var target = null;
			switch( type ){
				case "current" : target = currentStep; break;
				case "next" : target = nextStep; break;
			}
		  	var x = target.position().left;
		  	var w = target.width();

			return { start:x, end:x+w, width:w };
		}

		function _random( min, max ){
			return Math.round( Math.random()*( max - min ) + min );
		}
	}

	function Bg(){
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

		this.move = function(){
			this.stop();
			intervalId = setInterval( function(){
				cloud.css( "background-position", ( cloudPosition -= cloudSpeed )+"px 0px" );
				hills.css( "background-position", ( hillsPosition -= hillsSpeed )+"px 0px" );
				bushes.css( "background-position", ( bushesPosition -= bushesSpeed )+"px 0px" );
			}, interval );
		}

		this.stop = function(){
			clearInterval( intervalId );
		}
	}

	function Sound(){
		var bgm = new Audio();
		bgm.src ="./asset/snd/bgm.mp3";
		bgm.load();
		bgm.loop = true;

		var eff01 = new Audio();
		eff01.src ="./asset/snd/smb_coin.mp3";
		eff01.load();

		var eff02 = new Audio();
		eff02.src ="./asset/snd/smb_mariodie.mp3";
		eff02.load();

		var eff03 = new Audio();
		eff03.src ="./asset/snd/smb_vine.mp3";
		eff03.load();
		eff03.loop = true;

		var eff04 = new Audio();
		eff04.src ="./asset/snd/smb3_thwomp.mp3";
		eff04.load();


		var eff = [ eff01, eff02, eff03, eff04 ];
		this.playBgm = function(){
			bgm.play();
		}

		this.stopBgm = function(){
			bgm.pause();
			bgm.currentTime = 0;
		}

		this.playEff = function( index ){
			eff[ index ].play();
		}

		this.stopEff = function( index ){
			eff[ index ].pause();
			eff[ index ].currentTime = 0;
		}
	}

	mvvm.addView( readyView );
	mvvm.addView( gameView );
	mvvm.addView( endView );
	mvvm.addViewModel( "rank" );
	mvvm.addViewModel( "rank10" );


	mvvm.addCommand( "get-rank", function( data, modelFinder, vmFinder, notifier ){
		modelFinder.get( "game-model" ).getRank();
	});

	mvvm.addCommand( "intro-game", function( data, modelFinder, vmFinder, notifier ){
		notifier.notify( "intro-game" );
	});

	mvvm.addCommand( "end-game", function( data, modelFinder, vmFinder, notifier ){
		scene.setScene( "end" );
		notifier.notify( "get-user-score", data );
	}); 

	mvvm.addCommand( "reg-score", function( data, modelFinder, vmFinder, notifier ){
		modelFinder.get( "game-model" ).regRank( data );
	}); 

	mvvm.addCommand( "check-entry-10", function( data, modelFinder, vmFinder, notifier ){
		modelFinder.get( "game-model" ).entry10( {score:data} );
	}); 

	mvvm.addModel( "game-model", function( vmFinder ){
		var host = 'http://www.limlimlim.com/game/stick-mario/api/'
		this.getRank = function(){
			$.ajax( { 
				url: host + "rank.php",
				method:"GET",
				dataType:"json",
				success:function( data ){
					var rankVm = vmFinder.get( "rank" );
					rankVm.update( "rankData", data );
					rankVm.commit( "update-rank-data" );
				},
				fail:function( error ){
				}
			} );
		}

		this.regRank = function( data ){
			$.ajax( { 
				url: host + "reg-rank.php",
				method:"POST",
				data:data,
				success:function( data ){
					scene.setScene( "ready" );
				},
				fail:function( error ){
				}
			} );
		}

		this.entry10 = function( data ){
			$.ajax( { 
				url: host + "/entry10.php",
				method:"GET",
				data:data,
				success:function( data ){
					var rank10Vm = vmFinder.get( "rank10" );
					rank10Vm.update( "isEntry", data );
					rank10Vm.commit( "check-entrey-10" );
				},
				fail:function( error ){
				}
			} );
		}
	});

	scene.addScene( "ready", readyScene );
	scene.addScene( "game", gameScene );
	scene.addScene( "end", endScene );
	scene.setScene( "ready" );
}());