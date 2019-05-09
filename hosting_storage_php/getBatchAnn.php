<?php
    
    /*
	 * Get batch annotation json encoded in base64 (NULL if not available yet)
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

   if (!isset($_GET['btoken'])) {// parameters missing
    	http_response_code(400);
        echo "Missing parameters";
        $link->close();
        die();

    }else {
        
        $json_b64 = '';
        $counter = 0;
        $result = array();
        if ($stmt = $link->prepare("SELECT json_b64 FROM batch_analysis WHERE token = ? AND deadline > NOW()")) {
            $stmt->bind_param("s", $_GET['btoken']);

            $stmt->execute();
            
            $stmt->bind_result($json_b64);

            while($stmt->fetch()){$counter++;}

            if($counter > 0 && $json_b64 == NULL) // there will be some results
                $result = array("notReady" => "204");

            else if($counter > 0)//there are some results 
            $result = array("json_b64" => $json_b64);
            
            
            $stmt->close();
            
        }         
		
        http_response_code(200);
        echo json_encode($result, JSON_UNESCAPED_SLASHES);
    
        $link->close();
    }

?>