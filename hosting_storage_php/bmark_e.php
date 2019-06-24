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
    $results = array();

    $img_url = '';
    $emotion = '';
    $cogni_value = '';
    $azure_original_value = '';
    $azure_value = '';
    $gcloud_value = '';

    if ($stmt = $link->prepare("SELECT img_url, emotion, azure_value, azure_original_value, gcloud_value, cogni_value 
                                FROM benchmark_emotions
                                ORDER BY img_url")) {
        $stmt->execute();
        
        $stmt->bind_result($img_url, $emotion, $azure_value, $azure_original_value, $gcloud_value, $cogni_value);
        
        while($stmt->fetch()){
            array_push($results, array(
                "img_url" => $img_url,
                "emotion" => $emotion,
                "azure_original_value" => $azure_original_value,
                "cogni_value" => $cogni_value,
                "azure_value" => $azure_value,
                "gcloud_value" => $gcloud_value
            ));
        
        }
        
        $stmt->close();
        
    }   
?>

<table id="btable" class="display">
    <thead>
        <tr>
            <th>Image</th>
            <th>Emotion</th>    
            <th class="text-info">Azure Original Value</th>
            <th class="text-info">Azure</th>
            <th class="text-warning">Google Cloud Vision</th>
            <th class="text-success">CogniAPI</th>
        </tr>
    </thead>
    
    <tbody>
        <? for($i = 0; $i < count($results); $i++){ ?>
            <tr>
                <td>
                    <img src="<? echo $results[$i]['img_url'];?>" class='w-25' />
                    <? echo substr($results[$i]['img_url'], strrpos($results[$i]['img_url'], "/") + 1); ?>
                </td>
                <td><? echo $results[$i]['emotion'];?></td>
                <td class="text-info"><? echo $results[$i]['azure_original_value'];?></td>
                <td class="text-info"><? echo $results[$i]['azure_value'];?></td>    
                <td class="text-warning"><? echo $results[$i]['gcloud_value'];?></td>
                <td class="text-success"><? echo $results[$i]['cogni_value'];?></td>
            </tr>
        <? } ?>
    </tbody>
</table>

<?

    $link->close();
?>