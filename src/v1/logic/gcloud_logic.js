/*
*   Module which interact with Google Cloud Vision API Services
*
*   @author: Devis
*/

//TEST WITH GOOGLE CLOUD VISION SERVICE CLIENT LIBRARY
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

//features which need to be analyzed onto the image
const annotateFeatures = [
    {type:'TYPE_UNSPECIFIED'}, {type:'FACE_DETECTION'}, {type:'LANDMARK_DETECTION'}, {type:'LOGO_DETECTION'},
    {type:'LABEL_DETECTION'}, {type:'TEXT_DETECTION'}, {type:'DOCUMENT_TEXT_DETECTION'}, {type:'SAFE_SEARCH_DETECTION'},
    {type:'IMAGE_PROPERTIES'}, {type:'CROP_HINTS'}, {type:'WEB_DETECTION'}, {type:'OBJECT_LOCALIZATION'}
];


const requestNative = require('request-promise-native').defaults({
    encoding: 'base64'
});
let base64 = true;//slow if you use it, but you're more sure that you don't fall in gcloud api bugs

//functions to perform single image annotation
function analyseRemoteImage(imageUrl, customFeatures){
    return new Promise((resolve, reject) => {
        console.log('gcloud vision request for ' + imageUrl);
        const request = {
            image: {source: {imageUri: imageUrl}},
            features: annotateFeatures,
        };

        if(customFeatures)//custom features
            request['features'] = customFeatures;

        if(base64){// in order to avoid gcloud bug is better if you upload the photo in base64
            requestNative(imageUrl).then(obj64 => {
                request['image'] = {content: obj64};
                client
                    .annotateImage(request)
                    .then(response => {
                        resolve(response);
                    })
                    .catch(err => {
                        console.error(err);
                        reject(err);
                    });
            });
        }else{
            client
                .annotateImage(request)
                .then(response => {
                    resolve(response);
                })
                .catch(err => {
                    console.error(err);
                    reject(err);
                });
        }


    });
}

/*  Utility function in order to delete unnecessary data from the tag detection and then
*   return just labels and relative scores (take only the ones which are above the minScore threshold)*/
function filterTags(gcloudJson, minScore){

    let retObj = {};

    //landmark annotations
    retObj['landmarks'] = [];
    for(let landMarkAnn of gcloudJson['landmarkAnnotations']){
        if(Number.parseFloat(landMarkAnn['score']) > minScore)
            retObj['landmarks'].push({'name': landMarkAnn['description'], 'confidence': Number.parseFloat(landMarkAnn['score'])});
    }

    //logo annotations
    retObj['logos'] = [];
    for(let logoAnn of gcloudJson['logoAnnotations']){
        if(Number.parseFloat(logoAnn['score']) > minScore)
            retObj['logos'].push({'name': logoAnn['description'], 'confidence': Number.parseFloat(logoAnn['score'])});
    }

    //logo annotations
    retObj['tags'] = [];
    for(let labelAnn of gcloudJson['labelAnnotations']){
        if(Number.parseFloat(labelAnn['score']) > minScore)
            retObj['tags'].push({'name': labelAnn['description'], 'confidence': Number.parseFloat(labelAnn['score'])});
    }

    return retObj;
}

module.exports = {analyseRemoteImage, filterTags};