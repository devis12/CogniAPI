/*
*   App router for azure vision API testing
*
*   @author: Devis
*/

const express = require('express');
const router = express.Router();

//azure logic implemented just for testing purpose
const azureLogic = require('../logic/azure_logic');

// azure analyse remote image
router.get('/azure/analyse', (req, res) => {
    let imgUrl = req.query.url;
    let loggedUser = req.query.user;
    let minScore = Number.parseFloat(req.query.minscore); //threshold
    if(Number.isNaN(minScore) || minScore < 0 || minScore > 1) //with invalid input or without the param just keep 0 as default
        minScore = 0.0;

    if(imgUrl){
        azureLogic.analyseRemoteImageCogniSchema(imgUrl, loggedUser, minScore)
            .then( jsonAnn => res.status(200).json(jsonAnn))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'url parameter is missing', err_code: 'Bad Request'});
    }
});

// azure face analysis remote image just for testing purpose
router.get('/azure/faces', (req, res) => {

    let imgUrl = req.query.url;
    let loggedUser = req.query.user;

    if(imgUrl){
        azureLogic.analyseRemoteImageCogniSchema(imgUrl, loggedUser, 0.0)
            .then( jsonAnn => res.status(200).json(jsonAnn.faces))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'url parameter is missing', err_code: 'Bad Request'});
    }
});

// azure tags analysis remote image
router.get('/azure/tags', (req, res) => {
    let imgUrl = req.query.url;
    let minScore = Number.parseFloat(req.query.minscore); //threshold
    if(Number.isNaN(minScore) || minScore < 0 || minScore > 1) //with invalid input or without the param just keep 0 as default
        minScore = 0.0;

    if(imgUrl){
        azureLogic.analyseRemoteImageCogniSchema(imgUrl, null, minScore)
            .then( jsonAnn => res.status(200).json(jsonAnn.tags))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'url parameter is missing', err_code: 'Bad Request'});
    }
});

// azure objects analysis remote image
router.get('/azure/objects', (req, res) => {
    let imgUrl = req.query.url;
    let minScore = Number.parseFloat(req.query.minscore); //threshold
    if(Number.isNaN(minScore) || minScore < 0 || minScore > 1) //with invalid input or without the param just keep 0 as default
        minScore = 0.0;

    if(imgUrl){
        azureLogic.analyseRemoteImageCogniSchema(imgUrl, null, minScore)
            .then( jsonAnn => res.status(200).json(jsonAnn.objects))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'url parameter is missing', err_code: 'Bad Request'});
    }
});

// azure landmarks analysis remote image
router.get('/azure/landmarks', (req, res) => {
    let imgUrl = req.query.url;

    if(imgUrl){
        azureLogic.analyseRemoteImageCogniSchema(imgUrl, null, 0.0)
            .then( jsonAnn => res.status(200).json(jsonAnn.landmarks))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'url parameter is missing', err_code: 'Bad Request'});
    }
});

// azure safety analysis remote image
router.get('/azure/safety', (req, res) => {
    let imgUrl = req.query.url;

    if(imgUrl){
        azureLogic.analyseRemoteImageCogniSchema(imgUrl, null, 0.0)
            .then( jsonAnn => res.status(200).json(jsonAnn.safetyAnnotation))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'url parameter is missing', err_code: 'Bad Request'});
    }
});

// azure graphicalData analysis remote image
router.get('/azure/colors', (req, res) => {
    let imgUrl = req.query.url;

    if(imgUrl){
        azureLogic.analyseRemoteImageCogniSchema(imgUrl, null, 0.0)
            .then( jsonAnn => res.status(200).json(jsonAnn.graphicalData))
            .catch(e => res.status((e.err_status)? e.err_status:500).json(e));
    }else{
        res.status(400).json({err_status: 400, err_msg: 'url parameter is missing', err_code: 'Bad Request'});
    }
});

// azure add face to face group
router.post('/azure/faces/:loggedUser', (req, res) => {

    let imageUrl = req.body.imageUrl;
    let target = req.body.target;
    let userData = req.body.userData;
    let loggedUser = req.params.loggedUser;

    if(imageUrl && target && userData && loggedUser){
        azureLogic.addToFaceGroup(imageUrl, target, userData, loggedUser)
            .then( data => {
                res.status(200).send('Added face correctly for user ' + loggedUser);
            })
            .catch(e => {
                res.status(400).json({err_status: 400, err_msg: 'Invalid Data', err_code: 'Bad Request'});
            });
    }else{
        res.status(400).json({err_status: 400, err_msg: 'Invalid Data', err_code: 'Bad Request'});
    }

});

// azure update face data to face group
router.patch('/azure/faces/:loggedUser', (req, res) => {

    let persistedFaceId = req.body.persistedFaceId;
    let userData = req.body.userData;
    let loggedUser = req.params.loggedUser;

    if(persistedFaceId &&  userData && loggedUser){
        azureLogic.patchFace(persistedFaceId, userData, loggedUser)
            .then( data => {
                res.status(200).send('Patched face correctly for user ' + loggedUser);
            })
            .catch(e => {
                res.status(400).json({err_status: 400, err_msg: 'Invalid Data', err_code: 'Bad Request'});
            });
    }else{
        res.status(400).json({err_status: 400, err_msg: 'Invalid Data', err_code: 'Bad Request'});
    }

});

// azure update face data to face group
router.delete('/azure/faces/:loggedUser', (req, res) => {

    let persistedFaceId = req.query.persistedFaceId;
    let loggedUser = req.params.loggedUser;

    if(persistedFaceId &&  loggedUser){
        azureLogic.forgetFace(persistedFaceId, loggedUser)
            .then( data => {
                res.status(200).send('Deleted face correctly for user ' + loggedUser);
            })
            .catch(e => {
                res.status(400).json({err_status: 400, err_msg: 'Invalid Data', err_code: 'Bad Request'});
            });
    }else{
        res.status(400).json({err_status: 400, err_msg: 'Invalid Data', err_code: 'Bad Request'});
    }

});

// azure train face group
router.post('/azure/faces/train/:loggedUser', (req, res) => {

    let loggedUser = req.params.loggedUser;


    if(loggedUser){
        azureLogic.trainFaceGroup(loggedUser)
            .then( data => {
                res.status(202).send('Training face group phase has started correctly for user ' + loggedUser);
            })
            .catch(e => {
                res.status(400).json({err_status: 400, err_msg: 'Invalid Data', err_code: 'Bad Request'});
            });
    }else{
        res.status(400).json({err_status: 400, err_msg: 'Invalid Data', err_code: 'Bad Request'});
    }

});

module.exports = router;