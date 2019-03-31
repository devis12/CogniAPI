<?php
    //allow cross-origin for ajax upload request from specified domain
    require_once('crossOrigin.php');

    //credentials
    require_once('info.php');

    //randomString
    require_once('randomString.php');

    // connessione a MySQL tramite mysqli_connect()
    $link = mysqli_connect($host, $user_h, $pwd_h, $db_h);
    if (!$link) {
            die ('Non riesco a connettermi: ' . mysqli_error());
    }

    if(isset($_POST['pwd'])) {
    	$day = date("d");
		$hour = date("H");
        if($_POST['pwd'] == $day.'cogni'.$hour){
            $secret = generateRandomString();
            
            $minutes_to_add = 5;
            $time = new DateTime('NOW');
            $time->add(new DateInterval('PT' . $minutes_to_add . 'M'));
            $datetime = $time->format('Y-m-d H:i:s');
            if ($stmt = $link->prepare("INSERT INTO last_token(token, deadline) VALUES(?,?)")) {
                $stmt->bind_param("ss", $secret, $datetime);

                $stmt->execute();
                $stmt->close();
                http_response_code(200);
                echo $secret;
            }         
        }else{
            http_response_code(403);
        }
    }else{
        http_response_code(400);//Bad request -> pwd!!
    }

    $link->close();
    die();
?>