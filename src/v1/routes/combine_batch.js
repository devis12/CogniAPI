/*
*   App router for combined results calling the apis with an array of image urls
*   The analysis will be performed asynchronously: /analyse/batch will return a token and 202 accepted
*   and then you can perform the extraction of the data
*   @author: Devis
*/

const express = require('express');
const router = express.Router();


//combine logic implemented in a module apart
const cogniCombine = require('../logic/combine_logic');

//combine logic implemented in a module apart
const cogniCombineBatch = require('../logic/combine_logic_batch');

//batch combine annotations
router.post('/analyse/batch', (req, res) => {
    let imgUrls = req.body.urls;
    let loggedUser = req.query.user;
    let minScore = Number.parseFloat(req.query.minscore); //threshold
    if(Number.isNaN(minScore) || minScore < 0 || minScore > 1) //with invalid input or without the param just keep 0 as default
        minScore = 0.0;

    if(imgUrls && Array.isArray(imgUrls) && imgUrls.length > 0){
        cogniCombineBatch.asyncImagesAnn(imgUrls, loggedUser, minScore, false)
            .then( token => res.status(202).json({'btoken': token}))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

//batch combine annotations results
router.get('/analyse/batch/:token', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombineBatch.getBatchAnn(btoken)
            .then( batchResults => {
                let batchResultsFiltered;
                let emotion = req.query.emotion;
                if(emotion){ // filter by emotion

                    batchResultsFiltered = cogniCombineBatch.batchAnnFilterOnEmotion(batchResults, emotion);
                    res.status(200).json(batchResultsFiltered);

                }else
                    res.status(200).json(batchResults);
            })
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'Token is missing', code: 'Bad Request'}});
    }
});

//batch combine annotations faces results
router.get('/analyse/batch/:token/faces', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombineBatch.getBatchAnn(btoken, 'faces')
            .then( batchResults => {
                let batchResultsFiltered;
                let emotion = req.query.emotion;
                if(emotion){ // filter by emotion

                    batchResultsFiltered = cogniCombineBatch.batchAnnFilterOnEmotion(batchResults, emotion);
                    res.status(200).json(batchResultsFiltered);

                }else
                    res.status(200).json(batchResults);
            })
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'Token is missing', code: 'Bad Request'}});
    }
});

//batch combine annotations tags results
router.get('/analyse/batch/:token/tags', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombineBatch.getBatchAnn(btoken, 'tags')
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'Token is missing', code: 'Bad Request'}});
    }
});

//batch combine annotations objects results
router.get('/analyse/batch/:token/objects', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombineBatch.getBatchAnn(btoken, 'objects')
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'Token is missing', code: 'Bad Request'}});
    }
});

//batch combine annotations description results
router.get('/analyse/batch/:token/description', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombineBatch.getBatchAnn(btoken, 'description')
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'Token is missing', code: 'Bad Request'}});
    }
});

//batch combine annotations texts results
router.get('/analyse/batch/:token/texts', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombineBatch.getBatchAnn(btoken, 'texts')
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'Token is missing', code: 'Bad Request'}});
    }
});

//batch combine annotations landmarks results
router.get('/analyse/batch/:token/landmarks', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombineBatch.getBatchAnn(btoken, 'landmarks')
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'Token is missing', code: 'Bad Request'}});
    }
});

//batch combine annotations safety results
router.get('/analyse/batch/:token/safety', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombineBatch.getBatchAnn(btoken, 'safetyAnnotation')
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'Token is missing', code: 'Bad Request'}});
    }
});

//batch combine annotations colors results
router.get('/analyse/batch/:token/colors', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombineBatch.getBatchAnn(btoken, 'graphicalData')
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'Token is missing', code: 'Bad Request'}});
    }
});

//batch combine annotations web results
router.get('/analyse/batch/:token/web', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombineBatch.getBatchAnn(btoken, 'webDetection')
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'Token is missing', code: 'Bad Request'}});
    }
});


module.exports = router;