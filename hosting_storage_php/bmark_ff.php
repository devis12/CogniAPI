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
        $feature = '';
        $analysed_prop = '';
        $cogni_value = '';
        $azure_value = '';
        $gcloud_value = '';

        if ($stmt = $link->prepare("SELECT img_url, feature, analysed_prop, cogni_value, azure_value, gcloud_value 
                                    FROM benchmark_facefeatures
                                    ORDER BY img_url")) {
            $stmt->execute();
            
            $stmt->bind_result($img_url, $feature, $analysed_prop, $cogni_value, $azure_value, $gcloud_value);
            
            while($stmt->fetch()){
                array_push($results, array(
                    "img_url" => $img_url,
                    "feature" => $feature,
                    "analysed_prop" => $analysed_prop,
                    "cogni_value" => $cogni_value,
                    "azure_value" => $azure_value,
                    "gcloud_value" => $gcloud_value
                ));

                
                
            }
            
            $stmt->close();
            
        }   
    ?>

<?php 
            //count right prediction when the prediction could possibly be made (even using another service)
            $cognip = 0;
            $azurep = 0;
            $gcloudp = 0;

            //count wrong or absent prediction when the prediction could possibly be made (even using another service)
            $cognin = 0;
            $azuren = 0;
            $gcloudn = 0;

            //prediction which cannot be counted because no service is providing that feature
            $cognim = 0;
            $azurem = 0;
            $gcloudm = 0;

            //prediction which cannot be counted because no service is providing exactly that feature, you can somewaht derive it from other feature
            $cognis = 0;
            $azures = 0;
            $gclouds = 0;
            
            for($i = 0; $i < count($results); $i++){
                
                if($results[$i]['analysed_prop'] == "undefined"){
                    
                    $cognim++;
                    $azurem++;
                    $gcloudm++;
                    
                
                }else if($results[$i]['feature'] == 'sleepy' || $results[$i]['feature'] == 'wink'){
                    
                    $cognis++;
                    $azures++;

                    if($results[$i]['feature'] == 'wink')
                        $gclouds++;
                    if($results[$i]['feature'] == 'sleepy')
                        $gcloudm++;

                }else{
                        
                        /*GLASSES*/
                        
                        if($results[$i]['feature'] == 'glasses'){

                            //glasses cogniAPI
                            if($results[$i]['cogni_value'] != 'NoGlasses' && $results[$i]['cogni_value'] != 'undefined'){
                                $cognip++;
                            }else{
                                $cognin++;
                            }

                            //glasses azure
                            if($results[$i]['azure_value'] != 'NoGlasses' && $results[$i]['azure_value'] != 'undefined'){
                                $azurep++;
                            }else{
                                $azuren++;
                            }

                            //glasses gcloud
                            if($results[$i]['gcloud_value'] != 'NoGlasses' && $results[$i]['gcloud_value'] != 'undefined'){
                                $gcloudp++;
                            }else{
                                $gcloudn++;
                            }

                        }  
                        
                        /*NO GLASSES*/
                        else if($results[$i]['feature'] == 'noglasses'){

                            //NOglasses cogniAPI
                            if($results[$i]['cogni_value'] == 'NoGlasses'){
                                $cognip++;
                            }else{
                                $cognin++;
                            }
                            
                            //NOglasses azure
                            if($results[$i]['azure_value'] == 'NoGlasses'){
                                $azurep++;
                            }else{
                                $azuren++;
                            }
                            
                            //NOglasses gcloud
                            if($results[$i]['gcloud_value'] == 'NoGlasses'){
                                $gcloudp++;
                            }else{
                                $gcloudn++;
                            }

                        }  
                        

                        /*normal happy sad surprised*/
                        else if($results[$i]['feature'] == 'normal' || $results[$i]['feature'] == 'happy' || $results[$i]['feature'] == 'sad' || $results[$i]['feature'] == 'surprised'){

                            //normal happy sad surprised cogniAPI
                            if($results[$i]['cogni_value'] == 'VERY_LIKELY' || $results[$i]['cogni_value'] == 'LIKELY'){
                                $cognip++;
                            }else{
                                $cognin++;
                            }
                            
                            //normal happy sad surprised azure
                            if($results[$i]['azure_value'] == 'VERY_LIKELY' || $results[$i]['azure_value'] == 'LIKELY'){
                                $azurep++;
                            }else{
                                $azuren++;
                            }
                            
                            //normal happy sad surprised gcloud
                            if($results[$i]['gcloud_value'] == 'VERY_LIKELY' || $results[$i]['gcloud_value'] == 'LIKELY'){
                                $gcloudp++;
                            }else{
                                $gcloudn++;
                            }

                        }  


                }
            }
        ?>


<table class="table text-center ml-auto mr-auto mt-4 mb-4">
    <thead>
            <th> </th>
            <th class="text-success"> Right prediction </th>
            <th class="text-danger"> Wrong prediction </th>
            <th class="text-warning"> No feature </th>
            <th class="text-info"> Checkable by a similar feature </th>
    </thead>

    <tbody>
            <tr>
                <td> CogniAPI </td>
                <td class="text-success"> <? echo $cognip;?> </td>
                <td class="text-danger"> <? echo $cognin;?> </td>
                <td class="text-warning"> <? echo $cognim;?> </td>
                <td class="text-info"> <? echo $cognis;?> </td>
            </tr>

            <tr>
                <td> Azure Face </td>
                <td class="text-success"> <? echo $azurep;?> </td>
                <td class="text-danger"> <? echo $azuren;?> </td>
                <td class="text-warning"> <? echo $azurem;?> </td>
                <td class="text-info"> <? echo $azures;?> </td>
            </tr>

            <tr>
                <td> Google Cloud Vision </td>
                <td class="text-success"> <? echo $gcloudp;?> </td>
                <td class="text-danger"> <? echo $gcloudn;?> </td>
                <td class="text-warning"> <? echo $gcloudm;?> </td>
                <td class="text-info"> <? echo $gclouds;?> </td>
            </tr>
    </tbody>
</table>

<hr />
<h1 class="mt-4"> Complete Table with benchmark results </h1>

<table id="btable" class="display">
    <thead>
        <tr>
            <th>Subject</th>
            <th>Image</th>
            <th>Feature</th>
            <th>Analysed Value</th>
            <th>CogniAPI</th>
            <th>Azure</th>
            <th>Google Cloud</th>
        </tr>
    </thead>
    
    <tbody>
        <?php 
            
            for($i = 0; $i < count($results); $i++){
                echo "
                    <tr>
                        <td> ".substr($results[$i]['img_url'], strrpos($results[$i]['img_url'], "/") + 1, strrpos($results[$i]['img_url'], ".") - strrpos($img_url, "/") - 1)." </td>
                        <td> <img src=\"".$results[$i]['img_url']."\" class='w-25' /> </td>
                        <td>".$results[$i]['feature']."</td>";
                
                if($results[$i]['analysed_prop'] == "undefined"){
                    echo "  <td class='text-warning'>".$results[$i]['analysed_prop']."</td>
                            <td class='text-warning'>".$results[$i]['cogni_value']."</td>
                            <td class='text-warning'>".$results[$i]['azure_value']."</td>
                            <td class='text-warning'>".$results[$i]['gcloud_value']."</td> ";
                    
                
                }else if($results[$i]['feature'] == 'sleepy' || $results[$i]['feature'] == 'wink'){
                    echo "  <td class='text-info'>".$results[$i]['analysed_prop']."</td>
                            <td class='text-info'>".$results[$i]['cogni_value']."</td>
                            <td class='text-info'>".$results[$i]['azure_value']."</td>";
                    
                    if($results[$i]['feature'] == 'wink')
                        echo "<td class='text-info'>".$results[$i]['gcloud_value']."</td> ";
                    if($results[$i]['feature'] == 'sleepy')
                        echo "<td class='text-warning'>".$results[$i]['gcloud_value']."</td> ";
                            
                
                }else{
                        echo "  <td class='text-success'>".$results[$i]['analysed_prop']."</td>";
                        
                        /*GLASSES*/
                        
                        if($results[$i]['feature'] == 'glasses'){

                            //glasses cogniAPI
                            if($results[$i]['cogni_value'] != 'NoGlasses' && $results[$i]['cogni_value'] != 'undefined'){
                                echo "<td class='text-success'>".$results[$i]['cogni_value']."</td>";
                            }else{
                                echo "<td class='text-danger'>".$results[$i]['cogni_value']."</td>";
                            }

                            //glasses azure
                            if($results[$i]['azure_value'] != 'NoGlasses' && $results[$i]['azure_value'] != 'undefined'){
                                echo "<td class='text-success'>".$results[$i]['azure_value']."</td>";
                            }else{
                                echo "<td class='text-danger'>".$results[$i]['azure_value']."</td>";
                            }

                            //glasses gcloud
                            if($results[$i]['gcloud_value'] != 'NoGlasses' && $results[$i]['gcloud_value'] != 'undefined'){
                                echo "<td class='text-success'>".$results[$i]['gcloud_value']."</td>";
                            }else{
                                echo "<td class='text-danger'>".$results[$i]['gcloud_value']."</td>";
                            }

                        }  
                        
                        /*NO GLASSES*/
                        else if($results[$i]['feature'] == 'noglasses'){

                            //NOglasses cogniAPI
                            if($results[$i]['cogni_value'] == 'NoGlasses'){
                                echo "<td class='text-success'>".$results[$i]['cogni_value']."</td>";
                            }else{
                                echo "<td class='text-danger'>".$results[$i]['cogni_value']."</td>";
                            }
                            
                            //NOglasses azure
                            if($results[$i]['azure_value'] == 'NoGlasses'){
                                echo "<td class='text-success'>".$results[$i]['azure_value']."</td>";
                            }else{
                                echo "<td class='text-danger'>".$results[$i]['azure_value']."</td>";
                            }
                            
                            //NOglasses gcloud
                            if($results[$i]['gcloud_value'] == 'NoGlasses'){
                                echo "<td class='text-success'>".$results[$i]['gcloud_value']."</td>";
                            }else{
                                echo "<td class='text-danger'>".$results[$i]['gcloud_value']."</td>";
                            }

                        }  
                        

                        /*normal happy sad surprised*/
                        else if($results[$i]['feature'] == 'normal' || $results[$i]['feature'] == 'happy' || $results[$i]['feature'] == 'sad' || $results[$i]['feature'] == 'surprised'){

                            //normal happy sad surprised cogniAPI
                            if($results[$i]['cogni_value'] == 'VERY_LIKELY' || $results[$i]['cogni_value'] == 'LIKELY'){
                                echo "<td class='text-success'>".$results[$i]['cogni_value']."</td>";
                            }else{
                                echo "<td class='text-danger'>".$results[$i]['cogni_value']."</td>";
                            }
                            
                            //normal happy sad surprised azure
                            if($results[$i]['azure_value'] == 'VERY_LIKELY' || $results[$i]['azure_value'] == 'LIKELY'){
                                echo "<td class='text-success'>".$results[$i]['azure_value']."</td>";
                            }else{
                                echo "<td class='text-danger'>".$results[$i]['azure_value']."</td>";
                            }
                            
                            //normal happy sad surprised gcloud
                            if($results[$i]['gcloud_value'] == 'VERY_LIKELY' || $results[$i]['gcloud_value'] == 'LIKELY'){
                                echo "<td class='text-success'>".$results[$i]['gcloud_value']."</td>";
                            }else{
                                echo "<td class='text-danger'>".$results[$i]['gcloud_value']."</td>";
                            }

                        }  


                }
                    

                    
                echo "       
                    </tr>
                ";
            }
        ?>
    </tbody>
</table>

<?

    $link->close();
?>