/*
*   App router for azure vision API testing
*
*   @author: Devis
*/

//'use strict';
const express = require('express');
const router = express.Router();

//azure logic implemented just for testing purpose
const azureLogicTEST = require('../logic/azure_logic_test.js');

// azure analyze remote image just for testing purpose
router.get('/azure/analyze', (req, res) => {
    let analyseRemoteImage;
    /*
    if(req.query.nf == null){// do the call with client libraries
        analyseRemoteImage = azureLogicTEST.analyseRemoteImage;
    }else{ // do the call with node-fetch
        analyseRemoteImage = azureLogicTEST.analyseRemoteImageFetch;
    }*/

    analyseRemoteImage = azureLogicTEST.analyseRemoteImageFetch; // erase this ROW when you decomment above
    analyseRemoteImage(req.query.url)
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