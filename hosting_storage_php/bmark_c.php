<?php

    //credentials
    require_once('info.php');

    // connessione a MySQL tramite mysqli_connect()
    $link = mysqli_connect($host, $user_h, $pwd_h, $db_h);
    if (!$link) {
            die ('Non riesco a connettermi: ' . mysqli_error());
    }

?>

<?    
    
    $totc = '';
    $totimg = '';
    $rec = '';
    $avg_rec = '';

    if ($stmt = $link->prepare("SELECT count(*), avg(confidence) FROM `benchmark_celebrities` WHERE recognised = true ")) {
        $stmt->execute();           
        $stmt->bind_result($rec, $avg_rec);            
        while($stmt->fetch()){}            
        $stmt->close();           
    }   

    
    $results = array();

    $img_url = '';
    $celebrity = '';
    $recognised = '';
    $celebrity_recognised = '';
    $confidence = '';

    if ($stmt = $link->prepare("SELECT img_url, celebrity, recognised, celebrity_recognised, confidence 
                                FROM benchmark_celebrities
                                ORDER BY img_url")) {
        $stmt->execute();
        
        $stmt->bind_result($img_url, $celebrity, $recognised, $celebrity_recognised, $confidence);
        
        while($stmt->fetch()){
            array_push($results, array(
                "img_url" => $img_url,
                "celebrity" => $celebrity,
                "recognised" => $recognised,
                "celebrity_recognised" => $celebrity_recognised,
                "confidence" => $confidence
            ));
        
        }
        
        $stmt->close();

        $totimg = count($results);
        $totc = intval($totimg/4);
        
    }   
?>

<table class="display table text-center ml-auto mr-auto w-75 mt-5 mb-5">
    <thead>
        <tr>
            <th>Number of celebrities</th>   
            <th>Number of Images</th>
            <th>Recognised*</th>
            <th>Avg. Confidence**</th>
        </tr>
    </thead>
    
    <tbody>
        <td><? echo $totc;?></td>
        <td><? echo $totimg;?></td>
        <td><? echo $rec;?></td>
        <td><? echo $avg_rec;?></td>
    </tbody>

</table>

<div class="text-center ml-auto mr-auto alert alert-info w-75 mb-5">
    <p>
        <span class="font-weight-bold">Recognised*</span>: number of cases in which the celebrity has been recognised over the total num of images
    </p>

    <p>
        <span class="font-weight-bold">Avg. Confidence**</span>: average confidence counting the cases in which the celebrity has been recognised
    </p>
</div>

<table id="btable" class="display">
    <thead>
        <tr>
            <th>Image</th>   
            <th>Recognised</th>
            <th>Recognised as</th>
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
                
                    <td><i class="far fa-thumbs-up text-success"></i></td>
                    <td class="text-success"><? echo $results[$i]['celebrity_recognised'];?></td>
                    <td class="text-success"><? echo $results[$i]['confidence'];?></td>
                
                <? }else{ ?>
                
                    <td><i class="far fa-thumbs-down text-danger"></i></td>
                    <td class="text-danger"><? echo $results[$i]['celebrity_recognised'];?></td>
                    <td class="text-danger"><? echo $results[$i]['confidence'];?></td>
                
                <? } ?>

            </tr>
        <? } ?>
    </tbody>
</table>

<?

    $link->close();
?>