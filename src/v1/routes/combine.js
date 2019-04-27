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
    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl, loggedUser)
            .then( jsonAnn => res.status(200).json(jsonAnn.cogniAPI))
            .catch(e => res.status(400).json({}));
    }else{
        res.status(400).json({});
    }
});

//combine face annotations
router.get('/analyse/faces', (req, res) => {
    let imgUrl = req.query.url;
    let loggedUser = req.query.user;
    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl, loggedUser)
            .then( jsonAnn => res.status(200).json(jsonAnn.cogniAPI.faces))
            .catch(e => res.status(400).json({}));
    }else{
        res.status(400).json({});
    }
});

//combine tags annotations
router.get('/analyse/tags', (req, res) => {
    let imgUrl = req.query.url;
    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl)
            .then( jsonAnn => res.status(200).json(jsonAnn.cogniAPI.tags))
            .catch(e => res.status(400).json({}));
    }else{
        res.status(400).json({});
    }
});

//combine description annotation
router.get('/analyse/description', (req, res) => {
    let imgUrl = req.query.url;
    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl)
            .then( jsonAnn => res.status(200).json(jsonAnn.cogniAPI.description))
            .catch(e => res.status(400).json({}));
    }else{
        res.status(400).json({});
    }
});

//combine objects annotation
router.get('/analyse/objects', (req, res) => {
    let imgUrl = req.query.url;
    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl)
            .then( jsonAnn => res.status(200).json(jsonAnn.cogniAPI.objects))
            .catch(e => res.status(400).json({}));
    }else{
        res.status(400).json({});
    }
});

//combine texts annotation
router.get('/analyse/texts', (req, res) => {
    let imgUrl = req.query.url;
    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl)
            .then( jsonAnn => res.status(200).json(jsonAnn.cogniAPI.texts))
            .catch(e => res.status(400).json({}));
    }else{
        res.status(400).json({});
    }
});

//combine landmarks annotation
router.get('/analyse/landmarks', (req, res) => {
    let imgUrl = req.query.url;
    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl)
            .then( jsonAnn => res.status(200).json(jsonAnn.cogniAPI.landmarks))
            .catch(e => res.status(400).json({}));
    }else{
        res.status(400).json({});
    }
});

//combine safety annotation
router.get('/analyse/safety', (req, res) => {
    let imgUrl = req.query.url;
    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl)
            .then( jsonAnn => res.status(200).json(jsonAnn.cogniAPI.safetyAnnotation))
            .catch(e => res.status(400).json({}));
    }else{
        res.status(400).json({});
    }
});

//combine safety annotation
router.get('/analyse/colors', (req, res) => {
    let imgUrl = req.query.url;
    if(imgUrl){
        cogniCombine.multipleAnalysisRemoteImage(imgUrl)
            .then( jsonAnn => res.status(200).json(jsonAnn.cogniAPI.graphicalData))
            .catch(e => res.status(400).json({}));
    }else{
        res.status(400).json({});
    }
});

module.exports = router;