<?php
    /*  Random string generator functions 
        Params:
            @length length of the random string to be generated
            @filename bool value indicating if the string is a filename
    */
    function generateRandomString($length = 50) {
        $characters = '0123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKMNOPQRSTUVWXYZ';
        $charactersLength = strlen($characters);
        $randomString = '';
        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[mt_rand(0, $charactersLength - 1)];
        }
        return $randomString;
    }
?>