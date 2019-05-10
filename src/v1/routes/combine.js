/*
*   App router for combined results calling the apis
*
*   @author: Devis
*/

const express = require('express');
const router = express.Router();

//combine logic implemented in a module apart
const cogniCombine = require('../logic/combine_logic');

//combine annotations
router.get('/analyse', (req, res) => {
    let imgUrl = req.query.url;
    let loggedUser = req.query.user;
    let minScore = Number.parseFloat(req.query.minscore); //threshold
    if(Number.isNaN(minScore) || minScore < 0 || minScore > 1) //with invalid input or without the param just keep 0 as default
        minScore = 0.0;

    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl, loggedUser, minScore)
            .then( jsonAnn => res.status(200).json(jsonAnn.cogniAPI))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

//combine face annotations
router.get('/analyse/faces', (req, res) => {
    let imgUrl = req.query.url;
    let loggedUser = req.query.user;
    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl, loggedUser)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn.cogniAPI['imageUrl'],
                responseStatus: jsonAnn.cogniAPI['responseStatus'],
                faces: jsonAnn.cogniAPI.faces
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

//combine tags annotations
router.get('/analyse/tags', (req, res) => {
    let imgUrl = req.query.url;
    let minScore = Number.parseFloat(req.query.minscore); //threshold
    if(Number.isNaN(minScore) || minScore < 0 || minScore > 1) //with invalid input or without the param just keep 0 as default
        minScore = 0.0;

    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl, null, minScore)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn.cogniAPI['imageUrl'],
                responseStatus: jsonAnn.cogniAPI['responseStatus'],
                tags: jsonAnn.cogniAPI.tags
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

//combine description annotation
router.get('/analyse/description', (req, res) => {
    let imgUrl = req.query.url;

    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn.cogniAPI['imageUrl'],
                responseStatus: jsonAnn.cogniAPI['responseStatus'],
                description: jsonAnn.cogniAPI.description
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

//combine objects annotation
router.get('/analyse/objects', (req, res) => {
    let imgUrl = req.query.url;
    let minScore = Number.parseFloat(req.query.minscore); //threshold
    if(Number.isNaN(minScore) || minScore < 0 || minScore > 1) //with invalid input or without the param just keep 0 as default
        minScore = 0.0;

    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl, null, minScore)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn.cogniAPI['imageUrl'],
                responseStatus: jsonAnn.cogniAPI['responseStatus'],
                objects: jsonAnn.cogniAPI.objects
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

//combine texts annotation
router.get('/analyse/texts', (req, res) => {
    let imgUrl = req.query.url;
    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn.cogniAPI['imageUrl'],
                responseStatus: jsonAnn.cogniAPI['responseStatus'],
                texts: jsonAnn.cogniAPI.texts
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

//combine landmarks annotation
router.get('/analyse/landmarks', (req, res) => {
    let imgUrl = req.query.url;
    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn.cogniAPI['imageUrl'],
                responseStatus: jsonAnn.cogniAPI['responseStatus'],
                landmarks: jsonAnn.cogniAPI.landmarks
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

//combine safety annotation
router.get('/analyse/safety', (req, res) => {
    let imgUrl = req.query.url;
    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn.cogniAPI['imageUrl'],
                responseStatus: jsonAnn.cogniAPI['responseStatus'],
                safetyAnnotations: jsonAnn.cogniAPI.safetyAnnotations
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

//combine safety annotation
router.get('/analyse/colors', (req, res) => {
    let imgUrl = req.query.url;
    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn.cogniAPI['imageUrl'],
                responseStatus: jsonAnn.cogniAPI['responseStatus'],
                graphicalData: jsonAnn.cogniAPI.graphicalData
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

//combine webDetection annotation
router.get('/analyse/web', (req, res) => {
    let imgUrl = req.query.url;
    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl)
            .then( jsonAnn => res.status(200).json({
                imageUrl: jsonAnn.cogniAPI['imageUrl'],
                responseStatus: jsonAnn.cogniAPI['responseStatus'],
                webDetection: jsonAnn.cogniAPI.webDetection
            }))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

module.exports = router;