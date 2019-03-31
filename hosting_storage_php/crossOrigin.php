<?php    

    /* Allow cross-origin request from my home-ip address*/

    //echo $_SERVER['HTTP_ORIGIN'];
    if ($_SERVER['REMOTE_HOST']=='185.127.223.245' || 
        $_SERVER['HTTP_ORIGIN']=='http://cogni-api.herokuapp.com' ||
        $_SERVER['HTTP_ORIGIN']=='https://cogni-api.herokuapp.com') {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS');
        header('Access-Control-Max-Age: 1000');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    }
?>