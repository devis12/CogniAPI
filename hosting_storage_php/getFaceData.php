<?php
    
    /*
	 * Get url & saved base64 encoded json annotation, given a username
    */

    //allow cross-origin for ajax upload request from specified domain
    require_once('crossOrigin.php');

    //credentials
    require_once('info.php');

    // connessione a MySQL tramite mysqli_connect()
    $link = mysqli_connect($host, $user_h, $pwd_h, $db_h);
    if (!$link) {
            die ('Non riesco a connettermi: ' . mysqli_error());
    }

   if (!isset($_GET['cogni_fg']) ||  !isset($_GET['pface_id'])) {// parameters missing
    	http_response_code(400);
        echo "Missing parameters";
        $link->close();
        die();

    }else {
        
        $user_data = '';
        $result = array();
        if ($stmt = $link->prepare("SELECT user_data FROM persisted_face_data WHERE cogni_fg = ? AND pface_id = ?")) {
            $stmt->bind_param("ss", $_GET['cogni_fg'], $_GET['pface_id']);

            $stmt->execute();
            
            $stmt->bind_result($user_data);

            while($stmt->fetch()){
                $result = array("userData" => $user_data);
            }
            
            $stmt->close();
            
        }         
		
        http_response_code(200);
        echo json_encode($result, JSON_UNESCAPED_SLASHES);
        $link->close();
    }

?>