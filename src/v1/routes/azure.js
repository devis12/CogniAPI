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
            .catch(e => res.status((e.responseStatus.status)? e.responseStatus.status:500).json(e));
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }
});

// azure face analysis remote image just for testing purpose
router.get('/azure/faces', (req, res) => {

    let imgUrl = req.query.url;
    let loggedUser = req.query.user;

    if(imgUrl){
        azureLogic.analyseRemoteImageCogniSchema(imgUrl, loggedUser, 0.0)
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

// azure tags analysis remote image
router.get('/azure/tags', (req, res) => {
    let imgUrl = req.query.url;
    let minScore = Number.parseFloat(req.query.minscore); //threshold
    if(Number.isNaN(minScore) || minScore < 0 || minScore > 1) //with invalid input or without the param just keep 0 as default
        minScore = 0.0;

    if(imgUrl){
        azureLogic.analyseRemoteImageCogniSchema(imgUrl, null, minScore)
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

// azure objects analysis remote image
router.get('/azure/objects', (req, res) => {
    let imgUrl = req.query.url;
    let minScore = Number.parseFloat(req.query.minscore); //threshold
    if(Number.isNaN(minScore) || minScore < 0 || minScore > 1) //with invalid input or without the param just keep 0 as default
        minScore = 0.0;

    if(imgUrl){
        azureLogic.analyseRemoteImageCogniSchema(imgUrl, null, minScore)
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

// azure description analysis remote image
router.get('/azure/description', (req, res) => {
    let imgUrl = req.query.url;

    if(imgUrl){
        azureLogic.analyseRemoteImageCogniSchema(imgUrl, null)
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

// azure landmarks analysis remote image
router.get('/azure/landmarks', (req, res) => {
    let imgUrl = req.query.url;

    if(imgUrl){
        azureLogic.analyseRemoteImageCogniSchema(imgUrl, null, 0.0)
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

// azure safety analysis remote image
router.get('/azure/safety', (req, res) => {
    let imgUrl = req.query.url;

    if(imgUrl){
        azureLogic.analyseRemoteImageCogniSchema(imgUrl, null, 0.0)
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

// azure graphicalData analysis remote image
router.get('/azure/colors', (req, res) => {
    let imgUrl = req.query.url;

    if(imgUrl){
        azureLogic.analyseRemoteImageCogniSchema(imgUrl, null, 0.0)
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

// azure add face to face group (persist a new face)
router.post('/azure/faces/:loggedUser', (req, res) => {

    let imageUrl = req.body.imageUrl;
    let target = req.body.target;
    let userData = req.body.userData;
    let loggedUser = req.params.loggedUser;

    if(imageUrl && target && userData && loggedUser){
        azureLogic.addToFaceGroup(imageUrl, target, userData, loggedUser)
            .then( data => {
                res.status(200).send({responseStatus:{status: 200, msg: 'Added face for user ' + loggedUser, code: 'OK'}});
            })
            .catch(e => {
                res.status(400).json({responseStatus:{status: 400, msg: 'Invalid Data', code: 'Bad Request'}});
            });
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }

});

// azure update face data to face group (patch data related to a persisted face)
router.patch('/azure/faces/:loggedUser', (req, res) => {

    let persistedFaceId = req.body.persistedFaceId;
    let userData = req.body.userData;
    let loggedUser = req.params.loggedUser;

    if(persistedFaceId &&  userData && loggedUser){
        azureLogic.patchFace(persistedFaceId, userData, loggedUser)
            .then( data => {
                res.status(200).send({responseStatus:{status: 200, msg: 'Patched face for user ' + loggedUser, code: 'OK'}});
            })
            .catch(e => {
                res.status(400).json({responseStatus:{status: 400, msg: 'Invalid Data', code: 'Bad Request'}});
            });
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }

});

// azure delete face data to face group
router.delete('/azure/faces/:loggedUser', (req, res) => {

    let persistedFaceId = req.query.persistedFaceId;
    let loggedUser = req.params.loggedUser;

    if(persistedFaceId &&  loggedUser){
        azureLogic.forgetFace(persistedFaceId, loggedUser)
            .then( data => {
                res.status(200).send({responseStatus:{status: 200, msg: 'Deleted face for user ' + loggedUser, code: 'OK'}});
            })
            .catch(e => {
                res.status(400).json({responseStatus:{status: 400, msg: 'Invalid Data', code: 'Bad Request'}});
            });
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }

});

// azure train face group
router.post('/azure/faces/train/:loggedUser', (req, res) => {

    let loggedUser = req.params.loggedUser;


    if(loggedUser){
        azureLogic.trainFaceGroup(loggedUser)
            .then( data => {
                res.status(202).send({responseStatus:{status: 202, msg: 'Training face group phase has started correctly for user ' + loggedUser, code: 'Accepted'}});
            })
            .catch(e => {
                res.status(400).json({responseStatus:{status: 400, msg: 'Invalid Data', code: 'Bad Request'}});
            });
    }else{
        res.status(400).json({responseStatus:{status: 400, msg: 'url parameter is missing', code: 'Bad Request'}});
    }

});

// azure train face group
router.get('/azure/faces/train/:loggedUser/status', (req, res) => {

    let loggedUser = req.params.loggedUser;


    if(loggedUser){
        azureLogic.checkTrainingStatus(loggedUser)
            .then( trainStatus => {
                
                let trainingObj = {};

                if(trainStatus.status)
                    trainingObj['trainingStatus'] = trainStatus.status;
                else if(trainStatus.error['statusCode'] == 429)
                    trainingObj['trainingStatus'] = 'RateLimitExceeded';
                else if(trainStatus.error['code'])
                    trainingObj['trainingStatus'] = trainStatus.error['code'];
                else
                    trainingObj['trainingStatus'] = null;

                trainingObj['createdDateTime'] = trainStatus.createdDateTime;
                trainingObj['lastActionDateTime'] = trainStatus.lastActionDateTime;
                trainingObj['message'] = (trainStatus.status)? trainStatus.message : trainStatus.error['message'];
                trainingObj['lastSuccessfulTrainingDateTime'] = trainStatus.lastSuccessfulTrainingDateTime;

                res.status(200).send(trainingObj);
            })
            .catch(e => {
                res.status(400).json({trainingStatus: e.status || e.error.code});
            });
    }

});

module.exports = router;