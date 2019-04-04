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
            pImgAnn = renderImagesAnn(username, imgUrls, false); //no caching because this is the first analysis after upload
        }else{
            pImgAnn = renderImagesAnn(username, imgUrls, true, req.body.imgAnnb64); //no caching because this is the first analysis after upload
        }

        pImgAnn.then(data => {
            res.render('index',
                {
                    imgAnnotations: data,
                    user: username,
                    gui_type: 'imgAnn'
                });
        });

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
        renderImagesAnn(username, imgUrls, false) //no caching because this is the first analysis after upload
            .then(data => {
                res.render('index',
                    {
                        imgAnnotations: data,
                        user: username,
                        gui_type: 'imgAnn'
                    });
            });
    }else{
        res.status(400); //bad request
    }
});

/*  This function will help us in order to annotate the images and render the result*/
function renderImagesAnn(username, imgUrls, caching, imgAnnb64){
    return new Promise(resolve => {
        let promiseFaceGroup;
        if(username != undefined && username != ''){
            //trying creating a group faces related to the logged user (if it doesn't exist)
            promiseFaceGroup = azureLogic.createFaceGroup(username);
        }else{
            console.log('No user logged');
            promiseFaceGroup = new Promise(resolve => resolve(null));
        }

        promiseFaceGroup.then(() => {
            let imgAnnotationPromises = [];
            for (let url of imgUrls){
                if(!caching){//recover json object from previous cached data
                    //for now make a combo call (azure computer vision call + gcloud vision) for each url
                    imgAnnotationPromises.push(cogniCombine.multipleAnalysisRemoteImage(url, username));//p will handle annotate api node-fetch call)
                }else{
                    imgAnnotationPromises.push(new Promise(resolve =>{
                        resolve(JSON.parse(
                            Buffer.from(imgAnnb64, 'base64').toString()
                        ));
                    }));
                }
            }

            Promise.all(imgAnnotationPromises).then(data => { //format json object with result
                console.log('\n\n\nFINAL JSON:\n');
                console.log(JSON.stringify(data));
                if(!caching)//save on the cache system on first (or later if the caching system is disabled) the retrieved data
                    encodeB64Annotation(username, data);
                resolve(data);
            });
        });
    });
}

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