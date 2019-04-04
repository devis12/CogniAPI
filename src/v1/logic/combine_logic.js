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

//safety tags utilities
const safetyUtilities = require('./safetyUtilities');

//colorinfo tags utilities
const colorInfoUtilities = require('./colorInfoUtilities');

/*  Multiple analysis of an image performed by three main services:
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

            let jsonCombineRes = {
                annotationDate: new Date(),
                imgUrl: imageUrl,
                gCloud: values[0],
                azureV: values[1],
                azureF: values[2]
            };
            jsonCombineRes['cogniAPI'] = {};//add field for cogniAPI data
            /*console.log("AZURE SAFETY");
            console.log(values[1]['adult']);
            console.log("GOOGLE SAFETY");
            console.log(values[0][0]['safeSearchAnnotation']);
            jsonCombineRes['cogniAPI']['safety'] = safetyUtilities.buildSafetyTag(values[1]['adult'], values[0][0]['safeSearchAnnotation']);


            console.log("AZURE COLORS");
            console.log(values[1]['color']);
            console.log("GOOGLE COLORINFO");
            console.log(values[0][0]['imagePropertiesAnnotation']['dominantColors']);
            jsonCombineRes['cogniAPI']['colorInfo'] = colorInfoUtilities.buildColorInfoTag(
                                                        values[1]['color'],
                                                        values[0][0]['imagePropertiesAnnotation']['dominantColors']);
            */
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


/*  Multiple analysis of an image performed by two main services:
        -Google Cloud Vision
        -Azure Computer Vision
* */
function multipleTagsAnalysisRemoteImage(imageUrl, minScore){
    return new Promise((resolve, reject) => {
        console.log('Request tags for ' + imageUrl);
        let pGCloudV = gcloudVision.analyseRemoteImage(imageUrl, [
            {type:'LANDMARK_DETECTION'}, {type:'LOGO_DETECTION'}, {type:'LABEL_DETECTION'}]);
        let pAzureV = azureCompVision.analyseRemoteImage(imageUrl, 'Tags,Categories,Description');

        Promise.all([pGCloudV, pAzureV])
            .then( values => {

                let jsonCombineRes = {
                    imgUrl: imageUrl,
                    gCloud: gcloudVision.filterTags(values[0], minScore),
                    azureV: azureCompVision.filterTags(values[1], minScore)
                };

                resolve(jsonCombineRes);
            })

            .catch(e => reject(e));

    });
}

module.exports = {multipleAnalysisRemoteImage, multipleTagsAnalysisRemoteImage};