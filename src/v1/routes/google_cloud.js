/*
*   App router for google cloud vision API testing
*
*   @author: Devis
*/

//'use strict';
const express = require('express');
const router = express.Router();

//azure logic implemented just for testing purpose
const googleLogicTEST = require('../logic/gcloud_logic_test');

// azure analyze remote image just for testing purpose
router.get('/gcloud/analyze', (req, res) => {

    googleLogicTEST.analyseRemoteImage(req.query.url)
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

module.exports = router;