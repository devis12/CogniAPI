<?php
    
    /*
	 * Update json_b64 data (json annotation) related to an image a specific user has loaded
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

   if (!isset($_POST['username']) || !isset($_POST['img_url']) || !isset($_POST['data64'])) {// missing parameters
    	http_response_code(400);
        echo "Missing parameters";
        $link->close();
        die();

    }else {
        $img_url = '';
        if ($stmt = $link->prepare("UPDATE cached_json SET json_b64 = ? WHERE username = ? AND img_url = ?")) {
            $stmt->bind_param("sss", $_POST['data64'], $_POST['username'], $_POST['img_url']);
            $stmt->execute();
            $stmt->close();
        }         
		
        http_response_code(200);
        echo json_encode(array("data64"=>$_POST['data64']), JSON_UNESCAPED_SLASHES);
        $link->close();
    }

?>