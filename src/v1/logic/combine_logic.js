/*
*   Module which call the api different services in order to make the combination
*   in a unified and most useful schema
*
*   @author: Devis
*/

//GOOGLE CLOUD VISION FUNCTIONS
const gcloudVision = require('./gcloud_logic_test');
const azureCompVision = require('./azure_logic_test');

function multipleAnalysisRemoteImage(imageUrl){
    return new Promise((resolve, reject) => {
        /*resolve({imgUrl: imageUrl});*/
        let pGCloudV = gcloudVision.analyseRemoteImage(imageUrl);
        let pAzureF = azureCompVision.faceRemoteImageFetch(imageUrl);
        let pAzureV = azureCompVision.analyseRemoteImageFetch(imageUrl);

        Promise.all([pGCloudV, pAzureV, pAzureF]).then( values => {
            resolve({imgUrl: imageUrl, gCloud: values[0], azureV: values[1], azureF: values[2]});
        });
    });
}

/*function multipleAnalysisRemoteImages(imagesUrl){
    return new Promise((resolve, reject) => {
        gcloudVision.analyseBatchRemoteImages(imagesUrl).then(data => console.log(data))
    });
}*/

module.exports = {multipleAnalysisRemoteImage/*, multipleAnalysisRemoteImages*/};