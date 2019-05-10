/*
*   App router for google cloud vision API testing
*
*   @author: Devis
*/

//'use strict';
const express = require('express');
const router = express.Router();

//azure logic implemented just for testing purpose
const googleLogic = require('../logic/gcloud_logic');

// gcloud analyse remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/analyse', (req, res) => {
    let imgUrl = req.query.url;
    let minScore = Number.parseFloat(req.query.minscore); //threshold
    if(Number.isNaN(minScore) || minScore < 0 || minScore > 1) //with invalid input or without the param just keep 0 as default
        minScore = 0.0;

    if(imgUrl) {
        googleLogic.analyseRemoteImageCogniSchema(imgUrl)
            .then(data => {
                res.status(200).json(data);
            })
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

// gcloud faces analysis remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/faces', (req, res) => {
    let imgUrl = req.query.url;

    if(imgUrl) {
        googleLogic.analyseRemoteImageCogniSchema(imgUrl)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn['imageUrl'],
                responseStatus: jsonAnn['responseStatus'],
                faces: jsonAnn.faces
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

// gcloud tags analysis remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/tags', (req, res) => {
    let imgUrl = req.query.url;

    if(imgUrl) {
        googleLogic.analyseRemoteImageCogniSchema(imgUrl)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn['imageUrl'],
                responseStatus: jsonAnn['responseStatus'],
                tags: jsonAnn.tags
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

// gcloud objects analysis remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/objects', (req, res) => {
    let imgUrl = req.query.url;

    if(imgUrl) {
        googleLogic.analyseRemoteImageCogniSchema(imgUrl)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn['imageUrl'],
                responseStatus: jsonAnn['responseStatus'],
                objects: jsonAnn.objects
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

// gcloud description analysis remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/description', (req, res) => {
    let imgUrl = req.query.url;

    if(imgUrl) {
        googleLogic.analyseRemoteImageCogniSchema(imgUrl)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn['imageUrl'],
                responseStatus: jsonAnn['responseStatus'],
                description: jsonAnn.description
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

// gcloud texts analysis remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/texts', (req, res) => {
    let imgUrl = req.query.url;

    if(imgUrl) {
        googleLogic.analyseRemoteImageCogniSchema(imgUrl)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn['imageUrl'],
                responseStatus: jsonAnn['responseStatus'],
                texts: jsonAnn.texts
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

// gcloud landmarks analysis remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/landmarks', (req, res) => {
    let imgUrl = req.query.url;

    if(imgUrl) {
        googleLogic.analyseRemoteImageCogniSchema(imgUrl)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn['imageUrl'],
                responseStatus: jsonAnn['responseStatus'],
                landmarks: jsonAnn.landmarks
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

// gcloud safety analysis remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/safety', (req, res) => {
    let imgUrl = req.query.url;

    if(imgUrl) {
        googleLogic.analyseRemoteImageCogniSchema(imgUrl)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn['imageUrl'],
                responseStatus: jsonAnn['responseStatus'],
                safetyAnnotations: jsonAnn.safetyAnnotations
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

// gcloud colors analysis remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/colors', (req, res) => {
    let imgUrl = req.query.url;

    if(imgUrl) {
        googleLogic.analyseRemoteImageCogniSchema(imgUrl)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn['imageUrl'],
                responseStatus: jsonAnn['responseStatus'],
                graphicalData: jsonAnn.graphicalData
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

// gcloud web detection analysis remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/web', (req, res) => {
    let imgUrl = req.query.url;

    if(imgUrl) {
        googleLogic.analyseRemoteImageCogniSchema(imgUrl)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn['imageUrl'],
                responseStatus: jsonAnn['responseStatus'],
                webDetection: jsonAnn.webDetection
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});




module.exports = router;