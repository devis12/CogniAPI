/*
*   Module which provides functions in order to manipulate and extract data
*   from Azure Computer Vision adult tag & Google Cloud Vision safeSearchAnnotation,
*   cross check and combine them
*
*   @author: Devis
*/

/*  Commodity function in order to translate enum gcloud likelihood values related to safety properties into double to perform avg with azure data*/
function likelihoodtoDouble(likelihood){
    if(likelihood == 'VERY_UNLIKELY')
        return 0.1;
    else if(likelihood == 'UNLIKELY')
        return 0.3;
    else if(likelihood == 'POSSIBLE')
        return 0.5;
    else if(likelihood == 'LIKELY')
        return 0.7;
    else if(likelihood == 'VERY_LIKELY')
        return 0.9;
    else//UNKNOWN or general error
        return -1;
}

/*  Commodity function in order to translate double into enum gcloud likelihood values related to safety properties to perform avg with azure data*/
function doubletoLikelihood(confidence){
    if(confidence <= 0.2)
        return 'VERY_UNLIKELY';
    else if(confidence <= 0.4)
        return 'UNLIKELY';
    else if(confidence <= 0.6)
        return 'POSSIBLE';
    else if(confidence <= 0.8)
        return 'LIKELY';
    else if(confidence <= 1.0)
        return 'VERY_LIKELY';
    else//UNKNOWN or general error
        return 'UNKNOWN';
}



/*  Build a unique single safety field tag from azure and google cloud data
    (same schema independent of considered property)
* */
function buildSafetyField(gcloudSafetyAnn, azureAdult, property){

    let likelihoodValue = null;

    if(gcloudSafetyAnn){ // we've data from gcloud vision
        likelihoodValue = gcloudSafetyAnn[property];
    }

    if(azureAdult && azureAdult[property + 'Score']){ // we've data from azure computer vision

        if(likelihoodValue)//perform the avg by considering real value and then go back to the euristic likelihood metric offered by gcloud
            likelihoodValue = doubletoLikelihood((likelihoodtoDouble(likelihoodValue) + azureAdult[property + 'Score'])/2);
        else
            likelihoodValue = doubletoLikelihood(azureAdult[property + 'Score']);
    }

    if(!likelihoodValue)
        likelihoodValue = 'UNKNOWN';

    return likelihoodValue;
}

/*  Build cogniAPI safety obj provided azure adult & google cloud
*   safety annotation
*   */
function buildSafetyObj(gcloudSafetyAnn, azureAdult){
    let resObj = {};

    //for this we have data from both cognitive services
    resObj['adult'] = buildSafetyField(gcloudSafetyAnn, azureAdult, 'adult');
    resObj['racy'] = buildSafetyField(gcloudSafetyAnn, azureAdult, 'racy');

    //for the following threes just likelihood data from google cloud
    resObj['spoof'] = buildSafetyField(gcloudSafetyAnn, azureAdult, 'spoof');
    resObj['medical'] = buildSafetyField(gcloudSafetyAnn, azureAdult, 'medical');
    resObj['violence'] = buildSafetyField(gcloudSafetyAnn, azureAdult, 'violence');

    return resObj;
}
module.exports = {buildSafetyObj};
