<?php
    
    /*
	 * Get token for batch annotation
    */

    //allow cross-origin for ajax upload request from specified domain
    require_once('crossOrigin.php');

    //credentials
    require_once('info.php');

    //randomString
    require_once('randomString.php');

    $DIM_TOKEN = 32;//length of token

    // connessione a MySQL tramite mysqli_connect()
    $link = mysqli_connect($host, $user_h, $pwd_h, $db_h);
    if (!$link) {
            die ('Non riesco a connettermi: ' . mysqli_error());
    }

   if (isset($_GET['secret']) && $_GET['secret'] == date("d").'cogni'.date("H")) {

        $token =  generateRandomString($DIM_TOKEN);//generateRandomString($DIM_TOKEN, false);
        //echo "<br />Generated new token ".$token;
        $alreadyThere = false;//token already in the db
        
        $minutes_to_add = 120;//json data & token will be available for the next two hours
        $time = new DateTime('now', new DateTimezone('Europe/Rome'));
        $time->add(new DateInterval('PT' . $minutes_to_add . 'M'));
        $datetime = $time->format('Y-m-d H:i:s');

        do{
            //echo "<br />Inserting ".$token." with deadline for validity set at ".$datetime;

            if ($stmt = $link->prepare("INSERT INTO batch_analysis(token, deadline) VALUES(?, ?)")) {
                $stmt->bind_param("ss", $token, $datetime);
    
                $stmt->execute();
                
                //echo "<br />Aff rows -> ".$stmt->affected_rows;
                if($stmt->affected_rows < 0){//token already there
                    $token = generateRandomString($DIM_TOKEN);
                    $alreadyThere = true;
                    //echo "Generated new token ".$token;
                }else{
                    $alreadyThere = false;
                }
                
                $stmt->close();
                
            }         
        }while($alreadyThere);//iterate until you effectively generate a token is not there         
		
        http_response_code(200);
        echo json_encode(array("btoken" => $token), JSON_UNESCAPED_SLASHES);
        $link->close();

    } else {// secret cogni-api pwd is missing or wrong
        
        http_response_code(400);
        echo "Password is necessary";
        $link->close();
        die();

    }

?>