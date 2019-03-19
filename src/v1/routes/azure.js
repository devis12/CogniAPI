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
            res.status(200).json({
                datetime: new Date(),
                msg: data
            });
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

            res.status(err_status).json({
                datetime: new Date(),
                status: err_status,
                msg: err_msg
            });
        });
});

// azure analyze remote image just for testing purpose
router.get('/azure/face', (req, res) => {

    //analyseRemoteImage = azureLogicTEST.analyseRemoteImage; // erase this ROW when you decomment above
    azureLogic.faceRemoteImage(req.query.url)
        .then( data => {
            res.status(200).json({
                datetime: new Date(),
                msg: data
            });
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

            res.status(err_status).json({
                datetime: new Date(),
                status: err_status,
                msg: err_msg
            });
        });
});

// azure add face to face group
router.post('/azure/addFace/:loggedUser', (req, res) => {

    let imageUrl = req.body.imageUrl;
    let target = req.body.target;
    let userData = req.body.userData;
    let loggedUser = req.params.loggedUser;
    /*console.log("SERVER SIDE - ADD FACE NAME");
    console.log("imageUrl: " + imageUrl);
    console.log("target: " + target);
    console.log("userData: " + userData);
    console.log("loggedUser: " + loggedUser);*/

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

module.exports = router;