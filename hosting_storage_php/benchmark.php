<?php
    
    /*
	 * Add data to benchmark tables
    */

    //allow cross-origin for ajax upload request from specified domain
    require_once('crossOrigin.php');

    //credentials
    require_once('info.php');
	
    $_POST = json_decode(file_get_contents('php://input'), true);
    $fp = fopen('lidn.txt', 'w');
    fwrite($fp, json_encode($_POST, JSON_PRETTY_PRINT));
    fclose($fp);
    
    // connessione a MySQL tramite mysqli_connect()
    $link = mysqli_connect($host, $user_h, $pwd_h, $db_h);
    if (!$link) {
            die ('Non riesco a connettermi: ' . mysqli_error());
    }

   if (!isset($_POST['table_subname']) || !isset($_POST['tuples'])) {// parameters missing
    	http_response_code(400);
        echo json_encode(array("PhpResp" => "Missing params"), JSON_UNESCAPED_SLASHES);
        $link->close();
        die();

    }else {

        if($_POST['table_subname'] == "facefeatures"){
            for($i = 0; $i < sizeof($_POST['tuples']); $i++){
                
                

                if ($stmt = $link->prepare("INSERT INTO benchmark_facefeatures (img_url, feature, analysed_prop, cogni_value, gcloud_value, azure_value) VALUES(?, ?, ?, ?, ?, ?)")) {
                    $stmt->bind_param("ssssss", 
                        $_POST['tuples'][$i]['img_url'], 
                        $_POST['tuples'][$i]['feature'],
                        $_POST['tuples'][$i]['analysed_prop'], 
                        $_POST['tuples'][$i]['cogni_value'], 
                        $_POST['tuples'][$i]['gcloud_value'], 
                        $_POST['tuples'][$i]['azure_value']);
        
                    $stmt->execute();
                    $stmt->close();
                    
                }      
            }
        }

        else if($_POST['table_subname'] == "emotions"){

            for($i = 0; $i < sizeof($_POST['tuples']); $i++){

                if ($stmt = $link->prepare("INSERT INTO benchmark_emotions (img_url, emotion, cogni_value, gcloud_value, azure_value, azure_original_value) VALUES(?, ?, ?, ?, ?, ?)")) {
                    $stmt->bind_param("ssssss", 
                        $_POST['tuples'][$i]['img_url'], 
                        $_POST['tuples'][$i]['emotion'], 
                        $_POST['tuples'][$i]['cogni_value'], 
                        $_POST['tuples'][$i]['gcloud_value'], 
                        $_POST['tuples'][$i]['azure_value'],
                        $_POST['tuples'][$i]['azure_original_value']);
        
                    $stmt->execute();
                    $stmt->close();
                    
                }   

            }
        }

        else if($_POST['table_subname'] == "celebrities"){

            for($i = 0; $i < sizeof($_POST['tuples']); $i++){

                if ($stmt = $link->prepare("INSERT INTO benchmark_celebrities (img_url, celebrity, recognised, celebrity_recognised, confidence) VALUES(?, ?, ?, ?, ?)")) {
                    $stmt->bind_param("ssisd", 
                        $_POST['tuples'][$i]['img_url'], 
                        $_POST['tuples'][$i]['celebrity'], 
                        $_POST['tuples'][$i]['recognised'], 
                        $_POST['tuples'][$i]['celebrity_recognised'],
                        $_POST['tuples'][$i]['confidence']);
        
                    $stmt->execute();
                    $stmt->close();
                    
                }   

            }
        }

        else if($_POST['table_subname'] == "face_rec"){

            for($i = 0; $i < sizeof($_POST['tuples']); $i++){

                if ($stmt = $link->prepare("INSERT INTO benchmark_face_rec (img_url, to_be_recognised, recognised, confidence, detection_model, recognition_model) VALUES(?, ?, ?, ?, ?, ?)")) {
                    $stmt->bind_param("ssidss", 
                        $_POST['tuples'][$i]['img_url'], 
                        $_POST['tuples'][$i]['to_be_recognised'], 
                        $_POST['tuples'][$i]['recognised'], 
                        $_POST['tuples'][$i]['confidence'],
                        $_POST['tuples'][$i]['detection_model'],
                        $_POST['tuples'][$i]['recognition_model']);
        
                    $stmt->execute();
                    $stmt->close();
                    
                }   

            }
        }
        
           
        
        $link->close();

        

        http_response_code(200);
        echo json_encode(array("PhpResp" => "OK"), JSON_UNESCAPED_SLASHES);
    }

?>