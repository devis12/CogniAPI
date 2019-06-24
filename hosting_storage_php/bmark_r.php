<?php

    //credentials
    require_once('info.php');

    // connessione a MySQL tramite mysqli_connect()
    $link = mysqli_connect($host, $user_h, $pwd_h, $db_h);
    if (!$link) {
            die ('Non riesco a connettermi: ' . mysqli_error());
    }

?>

<? if(!isset($_GET['drmodel'])) { ?>

    <?         
        $results = array();
        $tot1 = '';
        $tot2 = '';
        $count_rec1 = '';
        $count_rec2 = '';
        $avg_rec1 = '';
        $avg_rec2 = '';

        if ($stmt = $link->prepare("SELECT count(*) FROM `benchmark_face_rec` WHERE detection_model = 'detection_01' AND recognition_model = 'recognition_01' ")) {
            $stmt->execute();           
            $stmt->bind_result($tot1);            
            while($stmt->fetch()){}            
            $stmt->close();           
        }   

        if ($stmt = $link->prepare("SELECT count(*) FROM `benchmark_face_rec` WHERE detection_model = 'detection_02' AND recognition_model = 'recognition_02' ")) {
            $stmt->execute();           
            $stmt->bind_result($tot2);            
            while($stmt->fetch()){}            
            $stmt->close();           
        }   

        if ($stmt = $link->prepare("SELECT count(*), avg(confidence) FROM `benchmark_face_rec` WHERE detection_model = 'detection_01' AND recognition_model = 'recognition_01' AND recognised = true")) {
            $stmt->execute();           
            $stmt->bind_result($count_rec1, $avg_rec1);            
            while($stmt->fetch()){}            
            $stmt->close();           
        }   

        if ($stmt = $link->prepare("SELECT count(*), avg(confidence) FROM `benchmark_face_rec` WHERE detection_model = 'detection_02' AND recognition_model = 'recognition_02' AND recognised = true")) {
            $stmt->execute();           
            $stmt->bind_result($count_rec2, $avg_rec2);            
            while($stmt->fetch()){}            
            $stmt->close();           
        }   

        

    ?>

    <table class="table display text-center mr-auto ml-auto mt-4">
        <thead>
            <tr>
                <th>Detection Model</th>   
                <th>Recognition Model</th>
                <th>#Total</th>
                <th>#Recognised</th>
                <th>Avg. Confidence</th>
            </tr>
        </thead>
        
        <tbody>

            <tr>
                <td>Detection_01</td>
                <td>Recognition_01</td>
                <td><?php echo $tot1; ?></td>
                <td><?php echo $count_rec1; ?></td>
                <td><?php echo $avg_rec1; ?></td>
            </tr>

            <tr>
                <td>Detection_02</td>
                <td>Recognition_02</td>
                <td><?php echo $tot2; ?></td>
                <td><?php echo $count_rec2; ?></td>
                <td><?php echo $avg_rec2; ?></td>
            </tr>
        </tbody>
    </table>


<? 
    }else{

?>

    <?    
        $results = array();

        $img_url = '';
        $to_be_recognised = '';
        $recognised = '';
        $confidence = '';

        $drmodel = 1;
        if($_GET['drmodel'] == 2)
            $drmodel = 2;
        

        if ($stmt = $link->prepare("SELECT img_url, to_be_recognised, recognised, confidence 
                                    FROM benchmark_face_rec
                                    WHERE detection_model = 'detection_0$drmodel' AND recognition_model = 'recognition_0$drmodel' 
                                    ORDER BY img_url")) {
            $stmt->execute();
            
            $stmt->bind_result($img_url, $to_be_recognised, $recognised, $confidence);
            
            while($stmt->fetch()){
                array_push($results, array(
                    "img_url" => $img_url,
                    "to_be_recognised" => $to_be_recognised,
                    "recognised" => $recognised,
                    "confidence" => $confidence
                ));
            
            }
            
            $stmt->close();
            
        }   
    ?>

    <table id="btable" class="display">
        <thead>
            <tr>
                <th>Image</th>   
                <th>It has to be recognised as</th>
                <th>Recognised</th>
                <th>Confidence</th>
            </tr>
        </thead>
        
        <tbody>
            <? for($i = 0; $i < count($results); $i++){ ?>
                <tr>
                    <td>
                        <img src="<? echo $results[$i]['img_url'];?>" class='w-25' />
                        <? echo $results[$i]['celebrity']; ?>
                    </td>
                    
                    <?  if($results[$i]['recognised']){ ?>
                    
                        <td class="text-success"><? echo $results[$i]['to_be_recognised'];?></td>
                        <td><i class="far fa-thumbs-up text-success"></i></td>
                        <td class="text-success"><? echo $results[$i]['confidence'];?></td>
                    
                    <? }else{ ?>
                    
                        <td class="text-danger"><? echo $results[$i]['to_be_recognised'];?></td>
                        <td><i class="far fa-thumbs-down text-danger"></i></td>
                        <td class="text-danger"><? echo $results[$i]['confidence'];?></td>
                    
                    <? } ?>

                </tr>
            <? } ?>
        </tbody>
    </table>

<?
    }
    $link->close();
?>