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

//functions to perform single image annotation
function analyseRemoteImage(imageUrl){
    return new Promise((resolve, reject) => {
        console.log('gcloud vision request for ' + imageUrl);
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

function analyseBatchRemoteImages(imageUrls){
    return new Promise((resolve, reject) => {
        let request = [];
        for(let imgUrl of imageUrls){
            request.push({
                image: {source: {imageUri: imgUrl}},
                features: annotateFeatures,
            });
        }

        console.log('Preparing to send to gcloud vision the following request:');
        console.log(JSON.stringify(request));

        client
            .batchAnnotateImages(request)
            .then(response => {
                console.log('Response from gcloud vision for batch request is the following:');
                console.log(response);
                resolve(response);
            })
            .catch(err => {
                console.error(err);
                reject(err);
            });

    });
}

module.exports = {analyseRemoteImage, analyseBatchRemoteImages};