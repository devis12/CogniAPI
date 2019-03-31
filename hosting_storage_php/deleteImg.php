<?php
    
    /*
	 * Delete image given username, img_url & img_name
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

   if (!isset($_POST['username']) || !isset($_POST['img_url']) || !isset($_POST['img_name'])) {// missing paramters
    	http_response_code(400);
        echo "Missing parameters";
        $link->close();
        die();

    }else {
        $img_url = '';
        $json_b64 = '';
        $result = array();
        if ($stmt = $link->prepare("DELETE FROM cached_json WHERE username = ? AND img_url = ?")) {
            $stmt->bind_param("ss", $_POST['username'], $_POST['img_url']);

            $stmt->execute();
            
            $stmt->close();

            unlink('./storage/'.$_POST['img_name']);
            
        }         
		
        http_response_code(200);
        $link->close();
    }

?>

?>