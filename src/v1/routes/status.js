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
                responseStatus: {
                    status: 200,
                    code: 'OK',
                    msg: 'Server up & Running'
                }
            });
        })
        .catch(e => {
            res.status(500).json({
                responseStatus: {
                    status: 500,
                    code: 'Internal Server Error'
                }
            });
        });
});

module.exports = router;