<?php 
	

	$db_host = "localhost";
	$db_user = "limlim831128";
	$db_password = "limhan0312";
	$db_name = "limlim831128";
	$conn = mysqli_connect( $db_host, $db_user, $db_password, $db_name );
	$score = $_GET[ "score" ];

	if (mysqli_connect_errno($conn)) {
	  echo "fail" . mysqli_connect_error();
	} else {
	  	$sql = "SELECT * FROM `stick_mario_rank` ORDER BY `SCORE` DESC LIMIT 9, 1";
	  	$result = mysqli_query( $conn, $sql );
		$rows = array();
		while($r = mysqli_fetch_assoc($result)) {
	    	$rows[] = $r;
		}
		if( $rows[0][ 'SCORE' ] > $score ){
			echo "N";
			exit();
		}else{
			echo "Y";
			exit();
		}
	}
	mysqli_close( $conn );
 ?>