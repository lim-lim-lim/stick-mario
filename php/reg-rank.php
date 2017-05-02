<?php 

	
	$db_host = "localhost";
	$db_user = "limlim831128";
	$db_password = "limhan0312";
	$db_name = "limlim831128";
	$conn = mysqli_connect( $db_host, $db_user, $db_password, $db_name );

	$name = $_POST[ 'name' ];
	$score = $_POST[ 'score' ];


	if (mysqli_connect_errno($conn)) {
	  echo "fail" . mysqli_connect_error();
	 } else {
	  	$sql = "INSERT INTO `stick_mario_rank` ( `NAME`, `SCORE`, `DATE` ) VALUES ( '".$name."', '".$score."', now() )";
	  	$result = mysqli_query( $conn, $sql );
		mysql_query( $q, $connection );	
	 }
	 mysqli_close( $conn );
 ?>