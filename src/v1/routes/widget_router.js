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

//combine logic implemented in a module apart
const azureLogic = require('../logic/azure_logic');

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

//render simple manage images page
router.post('/manage', (req, res) => {
    if(req.body['username'] != '') {

        fetch(backendStorage + 'getImgByUser.php', {
            method: 'POST',
            body: '{"username": ' + '"' + req.body.username + '"}',
            headers: {
                'Content-Type': 'application/json'
            }
        })

        .then( imgUploaded => {
            if(imgUploaded.status == 200){
               imgUploaded.json().then( imgUploadedJSON => {
                    for(let imgAnn of imgUploadedJSON){
                        if(imgAnn['json_b64'] != null && typeof (imgAnn['json_b64']) == 'string')
                            imgAnn['json_decoded'] = Buffer.from(imgAnn['json_b64'], 'base64').toString();
                    }
                    res.render('index', {imgAnnotations: imgUploadedJSON, user: req.body['username'], gui_type: 'mngPage'});// type mngPage will load the manage uploaded images box
                });
            }else{
                res.render('index', {imgAnnotations: {'errorCogni': imgUploaded.status}, user: req.body['username'], gui_type: 'mngPage'});// type 2 will load the manage uploaded images box
            }


        })
        .catch(err => console.error(err));

    }else
        res.render('index', {imgAnnotations: null, user:null, gui_type: 'authBox'});
});

//render simple manage images page
router.post('/manage/singleImg', (req, res) => {
    let urlNum = req.body['urlNum']; //use urlNum as a discriminatory field in order to check the validity of the body request

    if( urlNum != null && Number.isInteger(+urlNum) && Number.isInteger(parseInt(urlNum))) {
        let imgUrls = [req.body['url0']];
        let username = (req.body.username ==  undefined || req.body.username ==  '')? null : req.body.username;
        let pImgAnn;

        if(process.env.NO_CACHING || req.body.cache == 'false') {//if the caching system is deactivated, you perform the analysis all over again
            pImgAnn = cogniCombine.imagesAnn(username, imgUrls, false); //no caching because this is the first analysis after upload
        }else{
            pImgAnn = cogniCombine.imagesAnn(username, imgUrls, true, req.body.imgAnnb64); //no caching because this is the first analysis after upload
        }

        pImgAnn.then(data => {
            res.render('index',
                {
                    imgAnnotations: data,
                    user: username,
                    gui_type: 'imgAnn'
                });
            })
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));

    }else{
        res.status(400); //bad request
    }
});

//render images with response boxes provided by the different services
router.post('/upload/images', (req, res) => {
    let urlNum = req.body['urlNum']; //use urlNum as a discriminatory field in order to check the validity of the body request

    if( urlNum != null && Number.isInteger(+urlNum) && Number.isInteger(parseInt(urlNum))) {
        let imgUrls = [];//images url
        for (let k in req.body) {
            if (k.substr(0, 3) == 'url' && k != 'urlNum') {
                imgUrls.push(req.body[k]);
            }
        }
        let username = (req.body.username ==  undefined || req.body.username ==  '')? null : req.body.username;
        cogniCombine.imagesAnn(username, imgUrls, false) //no caching because this is the first analysis after upload
            .then(data => {
                res.render('index',
                    {
                        imgAnnotations: data,
                        user: username,
                        gui_type: 'imgAnn'
                    });
            })
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400); //bad request
    }
});

//analyze images in an asynchronous way
router.post('/uploadAsync/images', (req, res) => {
    let urlNum = req.body['urlNum']; //use urlNum as a discriminatory field in order to check the validity of the body request

    if( urlNum != null && Number.isInteger(+urlNum) && Number.isInteger(parseInt(urlNum))) {
        let imgUrls = [];//images url
        for (let k in req.body) {
            if (k.substr(0, 3) == 'url' && k != 'urlNum') {
                imgUrls.push(req.body[k]);
            }
        }
        let username = (req.body.username ==  undefined || req.body.username ==  '')? null : req.body.username;
        cogniCombine.asyncImagesAnn(username, imgUrls, false) //no caching because this is the first analysis after upload
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