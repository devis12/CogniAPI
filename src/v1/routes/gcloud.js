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

    //googleLogicTEST.analyseBatchRemoteImages([req.query.url, req.query.url, req.query.url]) //trying batch method
    googleLogic.analyseRemoteImage(req.query.url)
        .then( data => {
            res.status(200).json({
                datetime: new Date(),
                msg: data[0]
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
router.get('/gcloud/tags', (req, res) => {

    googleLogic.analyseRemoteImage(req.query.url, [
        {type:'LANDMARK_DETECTION'}, {type:'LOGO_DETECTION'}, {type:'LABEL_DETECTION'}])

        .then( data => {
            res.status(200).json({
                datetime: new Date(),
                msg: googleLogic.filterTags(data, req.query.minscore)
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

module.exports = router;