/*
*   App router for widget GUI render using ejs
*
*   @author: Devis
*/

const express = require('express');
const router = express.Router();

//in order to read env variables
require('dotenv').config();

//perform the request with node-fetch
const fetch = require('node-fetch');

//url for our backend storage
const backendStorage = require('../general').backendStorage;

//combine logic implemented in a module apart
const cogniCombine = require('../logic/combine_logic');

//combine logic (for batch annotations) implemented in a module apart
const cogniCombineBatch = require('../logic/combine_logic_batch');


//render simple auth box
router.get('/', (req, res) => {
    res.render('index', {imgAnnotations: null, user: null, gui_type: 'authBox'});
});

//render simple upload box
router.post('/upload', (req, res) => {
    if(req.body.username != '')
        res.render('index', {imgAnnotations: null, user:req.body.username, gui_type: 'upBox'});// type upBox will load the upload images box
    else
        res.render('index', {imgAnnotations: null, user:null, gui_type: 'authBox'});
});

//render simple manage images page where you can:
//  - See the cached annotation for each uploaded image
//  - Perform the annotation for the uploaded images all over again
//  - Delete the uploaded images (with the cached annotations which have been stored related to them)
router.post('/manage', (req, res) => {

    if(req.body['username'] != '') {

        //fetch all annotation from our personal backend storage
        fetch(backendStorage + 'getImgByUser.php?username='+req.body.username)

        .then( imgUploaded => {

            if(imgUploaded.status == 200){

                imgUploaded.json().then( imgUploadedJSON => {

                    //decode all the image annotations from base64 and put them in json objs
                    for(let imgAnn of imgUploadedJSON){
                        if(imgAnn['json_b64'] != null && typeof (imgAnn['json_b64']) == 'string')
                            imgAnn['json_decoded'] = Buffer.from(imgAnn['json_b64'], 'base64').toString();
                    }

                    //offer the user the features mentioned above (cached annotation, full annotation or delete)
                    res.render('index', {imgAnnotations: imgUploadedJSON, user: req.body['username'], gui_type: 'mngPage'});// type mngPage will load the manage uploaded images box

                });
            }else{

                //there has been some error while fetching the images+annotation (this isn't supposed to happen)
                res.render('index', {imgAnnotations: {'errorCogni': imgUploaded.status}, user: req.body['username'], gui_type: 'mngPage'});// type 2 will load the manage uploaded images box
            }


        })

        .catch(err =>  res.render('index', {imgAnnotations: {'errorCogni': err}, user: req.body['username'], gui_type: 'mngPage'}));

    }else
        //not logged -> come back to the the authBox
        res.render('index', {imgAnnotations: null, user:null, gui_type: 'authBox'});
});


//render annotation of a single image (cached or after a new full annotation requested by the user)
router.post('/manage/singleImg', (req, res) => {
    let urlNum = req.body['urlNum']; //use urlNum as a discriminatory field in order to check the validity of the body request

    if( urlNum != null && Number.isInteger(+urlNum) && Number.isInteger(parseInt(urlNum))) {
        let imgUrls = [req.body['url0']]; // there is just one image url in this case

        let username = (req.body.username ==  undefined || req.body.username ==  '')? null : req.body.username;
        let pImgAnn;

        if(process.env.NO_CACHING || req.body.cache == 'false') {//if the caching system is deactivated, you perform the analysis all over again
            pImgAnn = cogniCombine.imagesAnn(imgUrls, username, false); //no caching because this is the first analysis after upload

        }else{

            pImgAnn = cogniCombine.imagesAnn(imgUrls, username, true, req.body.imgAnnb64); //simply display cached data
        }

        pImgAnn.then(data => {
            res.render('index',
                {
                    imgAnnotations: data,
                    user: username,
                    gui_type: 'imgAnn'
                });
            })

            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));

    }else{
        res.status(400); //bad request
    }
});

//render images with response boxes provided by the different services + cogni api response

router.post('/upload/images', (req, res) => {
    let urlNum = req.body['urlNum']; //use urlNum as a discriminatory field in order to check the validity of the body request

    if( urlNum != null && Number.isInteger(+urlNum) && Number.isInteger(parseInt(urlNum))) {
        let imgUrls = [];//images url

        // wrap up all the requested image urls for annotation in an array
        for (let k in req.body) {
            if (k.substr(0, 3) == 'url' && k != 'urlNum') {
                imgUrls.push(req.body[k]);
            }
        }

        //username for which to perform the analysis
        let username = (req.body.username ==  undefined || req.body.username ==  '')? null : req.body.username;

        cogniCombine.imagesAnn(imgUrls, username, false) //no caching because this is the first analysis after upload
            .then(data => {
                res.render('index',
                    {
                        imgAnnotations: data,
                        user: username,
                        gui_type: 'imgAnn'
                    });
            })

            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{

        res.status(400); //bad request
    }
});

//analyze images in an asynchronous way
router.post('/uploadAsync/images', (req, res) => {
    let urlNum = req.body['urlNum']; //use urlNum as a discriminatory field in order to check the validity of the body request

    if( urlNum != null && Number.isInteger(+urlNum) && Number.isInteger(parseInt(urlNum))) {
        let imgUrls = [];//images url

        // wrap up all the requested image urls for annotation in an array
        for (let k in req.body) {
            if (k.substr(0, 3) == 'url' && k != 'urlNum') {
                imgUrls.push(req.body[k]);
            }
        }

        //username for which to perform the analysis
        let username = (req.body.username ==  undefined || req.body.username ==  '')? null : req.body.username;

        cogniCombineBatch.asyncImagesAnn(imgUrls, username, 0.0, true)
            .then(data => {
                res.render('index',
                    {
                        imgAnnotations: 'asyncUp' + data,
                        user: username,
                        gui_type: 'authBox'
                    });
            });

    }else{

        res.status(400); //bad request
    }
});

module.exports = router;