<?php
  /*    
        This function will ensure that an image is saved with proper orientation
  */
  function imageFixOrientation($filename) {
    
    $ext = substr($filename, strripos($filename,'.') + 1);//file extensions
    if($ext == "JPG" || $ext == "jpg" || $ext == "JPEG" || $ext == "jpeg"){ //perform this operation with jpg images
        $image = imagecreatefromjpeg($filename);

        $exif = exif_read_data($filename);
        //var_dump($exif);
        if (!empty($exif['Orientation'])) {
            switch ($exif['Orientation']) {
                case 3:
                    $image = imagerotate($image, 180, 0);
                    break;

                case 6:
                    $image = imagerotate($image, -90, 0);
                    break;

                case 8:
                    $image = imagerotate($image, 90, 0);
                    break;
            }
            
            imagejpeg($image, $filename);
            
        }
    
    }
    
  }

?>