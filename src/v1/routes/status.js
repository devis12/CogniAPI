/*
*   App router for health-check and status of application;
*   Developed in order to discover error or generally to find out
*   if the server is up & running and/or operating properly
*
*   @author: Devis
*/

const express = require('express');
const router = express.Router();

const statusLogic = require('../logic/status_logic.js');

// health check (public endpoint)
router.get('/status', (req, res) => {
    statusLogic.hello()
        .then( data => {
            res.status(200).json({
                msg: data
            });
        })
        .catch(e => {
           rres.status(500).json({
               err_msg: '' + e
           });
        });
});

module.exports = router;