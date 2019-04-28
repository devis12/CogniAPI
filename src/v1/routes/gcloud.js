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

// gcloud analyse remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/analyse', (req, res) => {
    let imgUrl = req.query.url;
    let minScore = Number.parseFloat(req.query.minscore); //threshold
    if(Number.isNaN(minScore) || minScore < 0 || minScore > 1) //with invalid input or without the param just keep 0 as default
        minScore = 0.0;

    googleLogic.analyseRemoteImageCogniSchema(imgUrl)
        .then( data => {
            res.status(200).json(data);
        })
        .catch(e => {
            res.status(400).json({});
        });
});

// gcloud faces analysis remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/faces', (req, res) => {
    let imgUrl = req.query.url;

    googleLogic.analyseRemoteImageCogniSchema(imgUrl)
        .then( data => {
            res.status(200).json(data.faces);
        })
        .catch(e => {
            res.status(400).json({});
        });
});

// gcloud tags analysis remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/tags', (req, res) => {
    let imgUrl = req.query.url;

    googleLogic.analyseRemoteImageCogniSchema(imgUrl)
        .then( data => {
            res.status(200).json(data.tags);
        })
        .catch(e => {
            res.status(400).json({});
        });
});

// gcloud objects analysis remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/objects', (req, res) => {
    let imgUrl = req.query.url;

    googleLogic.analyseRemoteImageCogniSchema(imgUrl)
        .then( data => {
            res.status(200).json(data.objects);
        })
        .catch(e => {
            res.status(400).json({});
        });
});

// gcloud description analysis remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/description', (req, res) => {
    let imgUrl = req.query.url;

    googleLogic.analyseRemoteImageCogniSchema(imgUrl)
        .then( data => {
            res.status(200).json(data.description);
        })
        .catch(e => {
            res.status(400).json({});
        });
});

// gcloud texts analysis remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/texts', (req, res) => {
    let imgUrl = req.query.url;

    googleLogic.analyseRemoteImageCogniSchema(imgUrl)
        .then( data => {
            res.status(200).json(data.texts);
        })
        .catch(e => {
            res.status(400).json({});
        });
});

// gcloud landmarks analysis remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/landmarks', (req, res) => {
    let imgUrl = req.query.url;

    googleLogic.analyseRemoteImageCogniSchema(imgUrl)
        .then( data => {
            res.status(200).json(data.landmarks);
        })
        .catch(e => {
            res.status(400).json({});
        });
});

// gcloud safety analysis remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/safety', (req, res) => {
    let imgUrl = req.query.url;

    googleLogic.analyseRemoteImageCogniSchema(imgUrl)
        .then( data => {
            res.status(200).json(data.safetyAnnotation);
        })
        .catch(e => {
            res.status(400).json({});
        });
});

// gcloud colors analysis remote image (annotation returned with cogniAPI schema)
router.get('/gcloud/colors', (req, res) => {
    let imgUrl = req.query.url;

    googleLogic.analyseRemoteImageCogniSchema(imgUrl)
        .then( data => {
            res.status(200).json(data.graphicalData);
        })
        .catch(e => {
            res.status(400).json({});
        });
});




module.exports = router;