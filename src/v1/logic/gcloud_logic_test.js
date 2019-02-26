/*
*   Module which interact with Google Cloud Vision API Services
*
*   @author: Devis
*/

//TEST WITH GOOGLE CLOUD VISION SERVICE CLIENT LIBRARY
const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

//features to analyze from the image
const annotateFeatures = [
    {type:'TYPE_UNSPECIFIED'}, {type:'FACE_DETECTION'}, {type:'LANDMARK_DETECTION'}, {type:'LOGO_DETECTION'},
    {type:'LABEL_DETECTION'}, {type:'TEXT_DETECTION'}, {type:'DOCUMENT_TEXT_DETECTION'}, {type:'SAFE_SEARCH_DETECTION'},
    {type:'IMAGE_PROPERTIES'}, {type:'CROP_HINTS'}, {type:'WEB_DETECTION'}, {type:'OBJECT_LOCALIZATION'}
];

function analyseRemoteImage(imageUrl){
    return new Promise((resolve, reject) => {
        const request = {
            image: {source: {imageUri: imageUrl}},
            features: annotateFeatures,
        };
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
}

module.exports = {analyseRemoteImage};