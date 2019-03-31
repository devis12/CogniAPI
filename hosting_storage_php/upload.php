<?php
    
    /*
	 * Upload new images to the storage
    */

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

    if ( 0 < $_FILES['file']['error'] ) {// error while uploading files
    	http_response_code(400);
        echo "Error while uploading files";
        $link->close();
        die();

    }else if (!isset($_POST['secret']) ) {// auth token is missing
    	http_response_code(400);
        echo "Auth token is necessary";
        $link->close();
        die();

    }else {
        
        if ($stmt = $link->prepare("DELETE FROM last_token WHERE token = ? AND deadline > NOW()")) {
            $stmt->bind_param("s", $_POST['secret']);

            $stmt->execute();
			
            if($stmt->affected_rows < 0){
            	http_response_code(403);
                echo "Invalid token!";
                $stmt->close();
                $link->close();
                die();
            }
            
            $stmt->close();
            
        }         
		
        
        
        $result = array();
        // Count # of uploaded files in array
        $total = count($_FILES);
        //echo "total: $total\n";
        //var_dump($_FILES);
        
        // Loop through each file
        for( $i=0 ; $i < $total ; $i++ ) {
            //Get the temp file path
            $tmpFilePath = $_FILES['file'.$i]['tmp_name'];
            
            //Make sure we have a file path
            if ($tmpFilePath != ""){
                //Setup our new file path
                $ext = substr($_FILES['file'.$i]['name'],strpos($_FILES['file'.$i]['name'],'.') + 1);//file extensions
                
                if($ext == "JPG" || $ext == "jpg" || $ext == "JPEG" || $ext == "jpeg" || $ext == "png"){//upload just jpg or png
                        
                    $newFilePath = "./storage/".generateRandomString().".".$ext ;
                    
                    //avoid situation where the generated string is already present
                    while(file_exists($newFilePath)){$newFilePath = "./storage/".generateRandomString().".".$ext ;}

                    //Upload the file into the temp dir
                    if(move_uploaded_file($tmpFilePath, $newFilePath)) {
                        $newFilePath = "https://cogniapi.altervista.org".substr($newFilePath,1);
                        array_push($result, $newFilePath);
                        
                        if(isset($_POST['username'])){
                        	if ($stmt = $link->prepare("INSERT INTO cached_json(img_url, username) VALUES(?,?)")) {
                              $stmt->bind_param("ss", $newFilePath, $_POST['username']);

                              $stmt->execute();

                              if($stmt->affected_rows < 0){
                                http_response_code(403);
                                echo "Invalid token!";
                                $stmt->close();
                                $link->close();
                                die();
                              }

                              $stmt->close();

                            }    
                        }
                    }
                }

            }
            
        }
		
        http_response_code(200);
        echo json_encode($result, JSON_UNESCAPED_SLASHES);
        $link->close();
    }

?>