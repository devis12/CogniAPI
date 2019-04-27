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
function buildSafetyField(azureAdult, gcloudSafetyAnn, property){
    //property string starting with capital letter
    let propertyC = property.substr(0,1).toUpperCase() + property.substr(1,property.length-1);

    return {
        'present': azureAdult['is' + propertyC + 'Content'],
        'confidence': azureAdult[property + 'Score'],
        'confidenceLikelihood': gcloudSafetyAnn[property],

    };
}

/*  Build cogniAPI safety obj provided azure adult & google cloud
*   safety annotation
*   */
function buildSafetyObj(azureAdult, gcloudSafetyAnn){
    let resObj = {};

    //for this we have data from both cognitive services
    resObj['adult'] = buildSafetyField(azureAdult, gcloudSafetyAnn, 'adult');
    resObj['racy'] = buildSafetyField(azureAdult, gcloudSafetyAnn, 'racy');

    //for the following threes just likelihood data from google cloud
    resObj['spoof'] = buildSafetyField(azureAdult, gcloudSafetyAnn, 'racy');
    resObj['medical'] = buildSafetyField(azureAdult, gcloudSafetyAnn, 'racy');
    resObj['violence'] = buildSafetyField(azureAdult, gcloudSafetyAnn, 'racy');

    return resObj;
}
module.exports = {buildSafetyObj};
