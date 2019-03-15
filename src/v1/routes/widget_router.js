/*
*   App router for widget GUI render using ejs
*
*   @author: Devis
*/

const express = require('express');
const router = express.Router();

//combine logic implemented in a module apart
const cogniCombine = require('../logic/combine_logic');

//render simple upload box
router.get('/', (req, res) => {
    res.render('index', {imgAnnotations: null});
});

//render images with response boxes provided by the different services
router.post('/', (req, res) => {
    let urlNum = req.body.urlNum; //use urlNum as a discriminatory field in order to check the validity of the body request

    if( urlNum != null && Number.isInteger(+urlNum) && Number.isInteger(parseInt(urlNum))) {
        let imgUrls = [];//images url
        for (let k in req.body) {
            if (k.substr(0, 3) == 'url' && k != 'urlNum') {
                imgUrls.push(req.body[k]);
            }
        }

        let imgAnnotationPromises = [];
        for (let url of imgUrls){
            //for now make a combo call (azure computer vision call + gcloud vision) for each url
            imgAnnotationPromises.push(cogniCombine.multipleAnalysisRemoteImage(url));//p will handle annotate api node-fetch call)
        }

        Promise.all(imgAnnotationPromises).then(data => { //format json object with result
            console.log(JSON.stringify(data));
            res.render('index',
                {
                    imgAnnotations: data
                });
        });

    }else{
        res.status(400); //bad request
    }
});

module.exports = router;