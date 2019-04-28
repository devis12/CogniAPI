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

   if (!isset($_POST['cogni_fg']) || !isset($_POST['pface_id'])) {// parameters missing
    	http_response_code(400);
        echo "Missing parameters";
        $link->close();
        die();

    }else {
        
        $n_rows = 0;
        if ($stmt = $link->prepare("DELETE FROM persisted_face_data  WHERE cogni_fg = ? AND pface_id = ?")) {
            $stmt->bind_param("ss", $_POST['cogni_fg'], $_POST['pface_id']);

            $stmt->execute();
            $n_rows = $stmt->affected_rows;
            $stmt->close();
            
        }         
        
        if($n_rows > 0){
            http_response_code(200);
            echo ('Deleted face correctly for face group '.$_POST['cogni_fg'].' on cogni storage');
        }else{
            http_response_code(400);
            echo ('Bad request');
        }
        
        $link->close();
    }

?>