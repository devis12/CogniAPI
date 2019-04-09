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

// azure analyze remote image just for testing purpose
router.get('/gcloud/analyze', (req, res) => {

    googleLogic.analyseRemoteImage(req.query.url)
        .then( data => {
            res.status(200).json(data[0]);
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

// azure analyze remote image just for testing purpose
router.get('/gcloud/tags', (req, res) => {

    googleLogic.analyseRemoteImage(req.query.url, [
        {type:'LANDMARK_DETECTION'}, {type:'LOGO_DETECTION'}, {type:'LABEL_DETECTION'}])

        .then( data => {

            let minScore = Number.parseFloat(req.query.minscore); //threshold
            if(Number.isNaN(minScore) || minScore < 0 || minScore > 1) //with invalid input or without the param just keep 0 as default
                minScore = 0.0;

            res.status(200).json(googleLogic.filterTags(data, minScore));
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