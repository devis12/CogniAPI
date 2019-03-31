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

const backendStorage = 'https://cogniapi.altervista.org/';

//combine logic implemented in a module apart
const cogniCombine = require('../logic/combine_logic');

//combine logic implemented in a module apart
const azureLogic = require('../logic/azure_logic');

//render simple auth box
router.get('/', (req, res) => {
    res.render('index', {imgAnnotations: null, user: null, gui_type: 0});
});

//render simple upload box
router.post('/upload', (req, res) => {
    if(req.body.username != '')
        res.render('index', {imgAnnotations: null, user:req.body.username, gui_type: 1});// type 1 will load the upload images box
    else
        res.render('index', {imgAnnotations: null, user:null, gui_type: 0});
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
                    res.render('index', {imgAnnotations: imgUploadedJSON, user: req.body['username'], gui_type: 2});// type 2 will load the manage uploaded images box
                });
            }else{
                res.render('index', {imgAnnotations: {'errorCogni': imgUploaded.status}, user: req.body['username'], gui_type: 2});// type 2 will load the manage uploaded images box
            }


        })
        .catch(err => console.error(err));

    }else
        res.render('index', {imgAnnotations: null, user:null, gui_type: 0});
});

//render simple manage images page
router.post('/singleImg', (req, res) => {
    let urlNum = req.body['urlNum']; //use urlNum as a discriminatory field in order to check the validity of the body request

    if( urlNum != null && Number.isInteger(+urlNum) && Number.isInteger(parseInt(urlNum))) {
        let imgUrls = [req.body['url0']];

        let username = null;
        let promiseFaceGroup;
        if(req.body['username'] != null && req.body['username'] != ''){
            username = req.body.username;
            //trying creating a group faces related to the logged user (if it doesn't exist)
            promiseFaceGroup = azureLogic.createFaceGroup(username);
        }else{
            console.log('No user logged');
            promiseFaceGroup = new Promise(resolve => resolve(null));
        }

        promiseFaceGroup.then(() => {
            let imgAnnotationPromises = [];
            for (let url of imgUrls){
                if(process.env.NO_CACHING) {
                    //for now make a combo call (azure computer vision call + gcloud vision) for each url
                    imgAnnotationPromises.push(cogniCombine.multipleAnalysisRemoteImage(url, username));//p will handle annotate api node-fetch call)
                }else{
                    imgAnnotationPromises.push(new Promise(resolve =>{
                        resolve(JSON.parse(
                            Buffer.from(req.body.imgAnnb64, 'base64').toString()
                        ));
                    }));
                }
            }

            Promise.all(imgAnnotationPromises).then(data => { //format json object with result
                console.log('\n\n\nFINAL JSON:\n');
                console.log(JSON.stringify(data));
                if(username){
                    res.render('index',
                        {
                            imgAnnotations: data,
                            user: username,
                            gui_type: null
                        });
                }else{
                    res.render('index',
                        {
                            imgAnnotations: data,
                            user: null,
                            gui_type: null
                        });
                }

            });
        });


    }else{
        res.status(400); //bad request
    }
});

//render images with response boxes provided by the different services
router.post('/', (req, res) => {
    let urlNum = req.body['urlNum']; //use urlNum as a discriminatory field in order to check the validity of the body request

    if( urlNum != null && Number.isInteger(+urlNum) && Number.isInteger(parseInt(urlNum))) {
        let imgUrls = [];//images url
        for (let k in req.body) {
            if (k.substr(0, 3) == 'url' && k != 'urlNum') {
                imgUrls.push(req.body[k]);
            }
        }

        let username = null;
        let promiseFaceGroup;
        if(req.body['username'] != null && req.body['username'] != ''){
            username = req.body['username'];
            //trying creating a group faces related to the logged user (if it doesn't exist)
            promiseFaceGroup = azureLogic.createFaceGroup(username);
        }else{
            console.log('No user logged');
            promiseFaceGroup = new Promise(resolve => resolve(null));
        }

        promiseFaceGroup.then(() => {
            let imgAnnotationPromises = [];
            for (let url of imgUrls){
                //for now make a combo call (azure computer vision call + gcloud vision) for each url
                imgAnnotationPromises.push(cogniCombine.multipleAnalysisRemoteImage(url, username));//p will handle annotate api node-fetch call)
            }

            Promise.all(imgAnnotationPromises).then(data => { //format json object with result
                console.log('\n\n\nFINAL JSON:\n');
                console.log(JSON.stringify(data));
                if(username){
                    encodeB64Annotation(username, data);
                    res.render('index',
                        {
                            imgAnnotations: data,
                            user: username,
                            gui_type: null
                        });
                }else{
                    res.render('index',
                        {
                            imgAnnotations: data,
                            user: null,
                            gui_type: null
                        });
                }

            });
        });


    }else{
        res.status(400); //bad request
    }
});

/*  This function will help us in order to store the answer elaborated from the api
    encoding it in base 64 for future development & analysis (a sort of caching system)
* */
function encodeB64Annotation(username, imgAnnotations){
    for(let imgAnn of imgAnnotations){
        let bodyReq = {
            'username':   username,
            'img_url':    imgAnn['imgUrl'],
            'data64': Buffer.from(JSON.stringify({
                'annotationDate':imgAnn['annotationDate'],
                'imgUrl':imgAnn['imgUrl'],
                'gCloud':imgAnn['gCloud'],
                'azureV':imgAnn['azureV'],
                'azureF':imgAnn['azureF'],
                'cogniAPI':imgAnn['cogniAPI']
            })).toString('base64')
        };
        fetch(backendStorage + 'updateImgData.php', {
            method: 'POST',
            body: JSON.stringify(bodyReq),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(php_response => {
            php_response.json(php_JSONresp =>{console.log('PHP response: ');console.log(php_response); console.log(php_JSONresp);});
        });
    }
}

module.exports = router;