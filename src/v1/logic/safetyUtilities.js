/*
*   Module which provides functions in order to manipulate and extract data
*   from Azure Computer Vision adult tag & Google Cloud Vision safeSearchAnnotation,
*   cross check and combine them
*
*   @author: Devis
*/


/*  Build a unique single safety field tag from azure and google cloud data
    (same schema independent of considered property)
* */
function buildSafetyField(gcloudSafetyAnn, azureAdult, property){
    //property string starting with capital letter
    let propertyC = property.substr(0,1).toUpperCase() + property.substr(1,property.length-1);
    let safetyField = {};

    if(gcloudSafetyAnn){
        safetyField['confidenceLikelihood'] = gcloudSafetyAnn[property];
    }

    if(azureAdult){
        safetyField['present'] = azureAdult['is' + propertyC + 'Content'];
        safetyField['confidence'] = azureAdult[property + 'Score'];
    }

    return safetyField;
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
