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

        let minScore = req.query.minscore; //threshold
        if(minScore == null)
            minScore = 0.0;

        cogniCombine.multipleTagsAnalysisRemoteImage(imgUrl, minScore)
            .then( jsonTags => res.status(200).json(jsonTags))
            .catch(e => res.status(400).json({}));

    }else{
        res.status(400).json({});
    }
});


module.exports = router;