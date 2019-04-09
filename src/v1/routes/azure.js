/*
*   App router for azure vision API testing
*
*   @author: Devis
*/

const express = require('express');
const router = express.Router();

//azure logic implemented just for testing purpose
const azureLogic = require('../logic/azure_logic');

// azure analyze remote image just for testing purpose
router.get('/azure/analyze', (req, res) => {
    azureLogic.analyseRemoteImage(req.query.url)
        .then( data => {
            res.status(200).json(data);
        })
        .catch(e => {
            let err_status;
            let err_msg = {};
            if(e.err_status != null){
                err_status = e.err_status;
            }else{
                err_status = 503;
                err_msg = '' + e;
            }

            res.status(err_status).json({err_msg: err_msg, err_status: err_status});
        });
});

// azure analyze remote image just for testing purpose
router.get('/azure/face', (req, res) => {

    azureLogic.faceRemoteImage(req.query.url)
        .then( data => {
            res.status(200).json(data);
        })
        .catch(e => {
            let err_status;
            let err_msg = {};
            if(e.err_status != null){
                err_status = e.err_status;
            }else{
                err_status = 503;
                err_msg = '' + e;
            }

            res.status(err_status).json({err_msg: err_msg});
        });
});

// azure add face to face group
router.post('/azure/addFace/:loggedUser', (req, res) => {

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
                res.status(400).send(e);
            });
    }else{
        res.status(400).send('Invalid Data');
    }

});

// azure update face data to face group
router.post('/azure/patchFace/:loggedUser', (req, res) => {

    let persistedFaceId = req.body.persistedFaceId;
    let userData = req.body.userData;
    let loggedUser = req.params.loggedUser;

    if(persistedFaceId &&  userData && loggedUser){
        azureLogic.patchFace(persistedFaceId, userData, loggedUser)
            .then( data => {
                res.status(200).send('Patched face correctly for user ' + loggedUser);
            })
            .catch(e => {
                res.status(400).send(e);
            });
    }else{
        res.status(400).send('Invalid Data');
    }

});

// azure train face group
router.post('/azure/trainFace/:loggedUser', (req, res) => {

    let loggedUser = req.params.loggedUser;


    if(loggedUser){
        azureLogic.trainFaceGroup(loggedUser)
            .then( data => {
                res.status(200).send('Training face group phase has started correctly for user ' + loggedUser);
            })
            .catch(e => {
                res.status(400).send(e);
            });
    }else{
        res.status(400).send('Invalid Data');
    }

});

// azure analyze remote image (just for tags, description & categories)
router.get('/azure/tags', (req, res) => {
    azureLogic.analyseRemoteImage(req.query.url, 'Tags,Categories,Description')
        .then( data => {

            let minScore = Number.parseFloat(req.query.minscore); //threshold
            if(Number.isNaN(minScore) || minScore < 0 || minScore > 1) //with invalid input or without the param just keep 0 as default
                minScore = 0.0;

            res.status(200).json(azureLogic.filterTags(data, minScore));
        })
        .catch(e => {
            let err_status;
            let err_msg = {};
            if(e.err_status != null){
                err_status = e.err_status;
            }else{
                err_status = 503;
                err_msg = '' + e;
            }

            res.status(err_status).json({err_msg: err_msg});
        });
});

module.exports = router;