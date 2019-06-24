<!DOCTYPE html>
<html>

<? require_once('header.php');?>

<body>

    <nav class="navbar navbar-light bg-dark">
        <a id="homeLink" class="navbar-brand font-weight-bold text-light" href="#">
            <img src="/img/logo_white.png" width="30" height="30" class="d-inline-block align-top" alt="">
            CogniAPI
        </a>
        <script>
            if(window.location.hostname == 'cogni-api.herokuapp.com')
                document.getElementById('homeLink').href = 'https://cogni-api.herokuapp.com';
            else
                document.getElementById('homeLink').href = 'http://' + window.location.hostname + ':' + window.location.port;
        </script>

        <a id="homeLink" class="navbar-brand font-weight-bold align-content-end text-light" href="#">
            Benchmark & Comparison
        </a>
    </nav>

    <div class="container-fluid">

        <!-- HEAD TITLE -->
        <div class="row mt-3 mb-3">
            <div class="col-2">
            </div>
            <div id="frontTitle" class="col-8 text-center text-info">
                <p>
                    CogniAPI - Benchmark
                </p>
            </div>
            <div class="col-2">
            </div>
        </div>
        <!-- END OF HEAD TITLE -->

    </div>

    <? if(!isset($_GET['bmark'])){ ?>
        <div class="row text-center m-auto">
            <div class="col-2"></div>
            <div class="col-4">
                <a href="index.php?bmark=facefeatures" class="btn btn-primary w-75 h-100">Face Features </a>
            </div>
            <div class="col-4">
                <a href="index.php?bmark=emotions" class="btn btn-primary w-75 h-100">Emotions </a>
            </div>
            <div class="col-2"></div>
        </div>
        <br /> <br >
        <div class="row text-center m-auto">
            <div class="col-2"></div>
            <div class="col-4">
                <a href="index.php?bmark=celebrities" class="btn btn-primary w-75 h-100">Celebrities </a>
            </div>
            <div class="col-4">
                <a href="index.php?bmark=face_rec" class="btn btn-primary w-75 h-100">Face Recognition </a>
            </div>
            <div class="col-2"></div>
        </div>

    <? }else if($_GET['bmark'] == 'facefeatures'){ ?>

        <? require_once('bmark_ff.php');?>

    <? }else if($_GET['bmark'] == 'emotions'){ ?>

        <? require_once('bmark_e.php');?>

    <? }else if($_GET['bmark'] == 'celebrities'){ ?> 

        <? require_once('bmark_c.php');?>

    <? }else if($_GET['bmark'] == 'face_rec' && !isset($_GET['drmodel'])){ ?>

        <h5 class="text-center m-auto"> Detection Recognition Model </h5>
        
        <div class="row text-center mt-2 mr-auto ml-auto">
            <div class="col-2"></div>
            <div class="col-4">
                <a href="index.php?bmark=face_rec&drmodel=1" class="btn btn-success w-75 h-100"> Model 1 </a>
            </div>
            <div class="col-4">
                <a href="index.php?bmark=face_rec&drmodel=2" class="btn btn-success w-75 h-100"> Model 2</a>
            </div>
            <div class="col-2"></div>
        </div>
        
        
        <div class="alert alert-warning text-center mt-4 mr-auto ml-auto w-75">
            <p class="font-weight-bold">
                Note
            </p>
            <p>
                In May 2019, Azure released a new ML system for face detection & recognition. 
                You can see the benchmark results produced using the new model by clicking "Model 2".
            </p>
        </div>

        <? require_once('bmark_r.php');?>

    <? }else if($_GET['bmark'] == 'face_rec' && isset($_GET['drmodel'])){ ?>
        <? require_once('bmark_r.php');?>
    <? } ?>

    <footer class="footer bg-dark text-white text-center">
        <div class="container-fluid mt-2">© 2019 Copyright: Dal Moro Devis</div>
    </footer>

    <? require_once('generic_js.php'); ?>
</body>
</html>
