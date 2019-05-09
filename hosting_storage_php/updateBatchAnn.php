<?php
    
    /*
	 * Update batch annotation json passing it encoded in base64
    */

    //allow cross-origin for ajax upload request from specified domain
    require_once('crossOrigin.php');

    //credentials
    require_once('info.php');
	
    $_POST = json_decode(file_get_contents('php://input'), true);

    // connessione a MySQL tramite mysqli_connect()
    $link = mysqli_connect($host, $user_h, $pwd_h, $db_h);
    if (!$link) {
            die ('Non riesco a connettermi: ' . mysqli_error());
    }

   if (!isset($_POST['btoken']) || !isset($_POST['data64'])) {// parameters missing
    	http_response_code(400);
        echo "Missing parameters";
        $link->close();
        die();

    }else {
        
        if ($stmt = $link->prepare("UPDATE batch_analysis SET json_b64 = ? WHERE token = ?")) {
            $stmt->bind_param("ss", $_POST['data64'], $_POST['btoken']);
            $stmt->execute();
            $stmt->close();
        }        

        http_response_code(200);
    
        $link->close();
    }

?>