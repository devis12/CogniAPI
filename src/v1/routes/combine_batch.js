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

//batch combine annotations
router.post('/analyse/batch', (req, res) => {
    let imgUrls = req.body.urls;
    let loggedUser = req.query.user;
    let minScore = Number.parseFloat(req.query.minscore); //threshold
    if(Number.isNaN(minScore) || minScore < 0 || minScore > 1) //with invalid input or without the param just keep 0 as default
        minScore = 0.0;

    if(imgUrls && Array.isArray(imgUrls) && imgUrls.length > 0){
        cogniCombine.asyncImagesAnn(imgUrls, loggedUser, minScore, false)
            .then( token => res.status(202).json({'btoken': token}))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'urls parameter is missing', err_code: 'Bad Request'});
    }
});

//batch combine annotations results
router.get('/analyse/batch/:token', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombine.getBatchAnn(btoken)
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'Token is missing', err_code: 'Bad Request'});
    }
});

//batch combine annotations faces results
router.get('/analyse/batch/:token/faces', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombine.getBatchAnn(btoken, 'faces')
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'Token is missing', err_code: 'Bad Request'});
    }
});

//batch combine annotations tags results
router.get('/analyse/batch/:token/tags', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombine.getBatchAnn(btoken, 'tags')
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'Token is missing', err_code: 'Bad Request'});
    }
});

//batch combine annotations objects results
router.get('/analyse/batch/:token/objects', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombine.getBatchAnn(btoken, 'objects')
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'Token is missing', err_code: 'Bad Request'});
    }
});

//batch combine annotations description results
router.get('/analyse/batch/:token/description', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombine.getBatchAnn(btoken, 'description')
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'Token is missing', err_code: 'Bad Request'});
    }
});

//batch combine annotations texts results
router.get('/analyse/batch/:token/texts', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombine.getBatchAnn(btoken, 'texts')
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'Token is missing', err_code: 'Bad Request'});
    }
});

//batch combine annotations landmarks results
router.get('/analyse/batch/:token/landmarks', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombine.getBatchAnn(btoken, 'landmarks')
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'Token is missing', err_code: 'Bad Request'});
    }
});

//batch combine annotations safety results
router.get('/analyse/batch/:token/safety', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombine.getBatchAnn(btoken, 'safetyAnnotation')
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'Token is missing', err_code: 'Bad Request'});
    }
});

//batch combine annotations colors results
router.get('/analyse/batch/:token/colors', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombine.getBatchAnn(btoken, 'graphicalData')
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'Token is missing', err_code: 'Bad Request'});
    }
});

//batch combine annotations web results
router.get('/analyse/batch/:token/web', (req, res) => {
    let btoken = req.params.token;

    if(btoken){
        cogniCombine.getBatchAnn(btoken, 'webDetection')
            .then( batchResults => res.status(200).json(batchResults))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'Token is missing', err_code: 'Bad Request'});
    }
});


module.exports = router;