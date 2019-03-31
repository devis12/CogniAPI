<?php
    
    /*
	 * Get url & saved base64 encoded json annotation, given a username
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

   if (!isset($_POST['username'])) {// username is missing
    	http_response_code(400);
        echo "Username is necessary";
        $link->close();
        die();

    }else {
        $img_url = '';
        $json_b64 = '';
        $result = array();
        if ($stmt = $link->prepare("SELECT img_url, json_b64 FROM cached_json WHERE username = ?")) {
            $stmt->bind_param("s", $_POST['username']);

            $stmt->execute();
            
            $stmt->bind_result($img_url, $json_b64);

            while($stmt->fetch()){
                array_push($result, array("img_url" => $img_url, "json_b64" => $json_b64));
            }
            
            $stmt->close();
            
        }         
		
        http_response_code(200);
        echo json_encode($result, JSON_UNESCAPED_SLASHES);
        $link->close();
    }

?>