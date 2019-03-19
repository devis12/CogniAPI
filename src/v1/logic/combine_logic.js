/*
*   Module which call the api different services in order to make the combination
*   in a unified and most useful schema
*
*   @author: Devis
*/

//GOOGLE CLOUD VISION FUNCTIONS (API CALLS)
const gcloudVision = require('./gcloud_logic');
//AZURE COMPUTER VISION & AZURE FACE FUNCTIONS (API CALLS)
const azureCompVision = require('./azure_logic');

//Face utilities in order to combine, merge & cross check data
const faceUtilities = require('./faceUtilities');

/*  Multiple analysis of an image performed by three main service:
        -Google Cloud Vision
        -Azure Computer Vision
        -Azure Face
* */
function multipleAnalysisRemoteImage(imageUrl, loggedUser){
    return new Promise((resolve, reject) => {
        console.log('Request for ' + imageUrl + ' logged as ' + loggedUser);
        let pGCloudV = gcloudVision.analyseRemoteImage(imageUrl);
        let pAzureF = azureCompVision.faceRemoteImage(imageUrl);
        let pAzureV = azureCompVision.analyseRemoteImage(imageUrl);

        Promise.all([pGCloudV, pAzureV, pAzureF]).then( values => {
            //apply to google cloud vision faceAnnotations the same ids which azure provides for each face
            values[0]['faceAnnotations'] = faceUtilities.matchFaces(values[0][0]['faceAnnotations'], values[2]);

            let jsonCombineRes = {imgUrl: imageUrl, gCloud: values[0], azureV: values[1], azureF: values[2]};
            if(loggedUser){
                //add tag in case you find a similar faces, already registered by the logged user
                azureCompVision.findSimilar(
                    loggedUser,
                    jsonCombineRes)

                    .then(() => resolve(jsonCombineRes));
            }else
                resolve(jsonCombineRes);
        });
    });
}


module.exports = {multipleAnalysisRemoteImage};