/*
*   App router for combined results calling the apis
*
*   @author: Devis
*/

const express = require('express');
const router = express.Router();

//combine logic implemented in a module apart
const cogniCombine = require('../logic/combine_logic');

//combine tags
router.get('/tags', (req, res) => {
    let imgUrl = req.query.url;
    if(imgUrl){

        let minScore = Number.parseFloat(req.query.minscore); //threshold
        if(Number.isNaN(minScore) || minScore < 0 || minScore > 1) //with invalid input or without the param just keep 0 as default
            minScore = 0.0;

        cogniCombine.multipleTagsAnalysisRemoteImage(imgUrl, minScore)
            .then( jsonTags => res.status(200).json(jsonTags))
            .catch(e => res.status(400).json({}));

    }else{
        res.status(400).json({});
    }
});


module.exports = router;