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

//this will be useful when we have just gcloud annotation and we need image sizes
const requestImageSize = require('request-image-size');

//description tags utilities
const descriptionUtilities = require('./descriptionUtilities');

//Face utilities in order to combine, merge & cross check data
const faceUtilities = require('./faceUtilities');

//safety tags utilities
const safetyUtilities = require('./safetyUtilities');

//colorinfo tags utilities
const colorInfoUtilities = require('./colorInfoUtilities');

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
                        reject(err);
                    });
            }).catch( errRequest => {
                if(errRequest.error && errRequest.error.code == 'ENOTFOUND')
                    reject({err_status: 404, err_code: 'Not Found'});
                else
                    reject({err_status: 400, err_code: 'Bad Request'});
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

//functions to perform single image annotation, but to pack the values as a json respecting the cogniAPI schema
function analyseRemoteImageCogniSchema(imageUrl, minScore){
    return new Promise( (resolve, reject) => {
        analyseRemoteImage(imageUrl)
            .then(gCloudJSON => {
                let imgAnn = gCloudJSON[0];//gCloudJSON is basically an array of imgAnnotations, but we're analyzing a single one
                requestImageSize(imageUrl)
                    .then(size => {
                        imgAnn['metadata'] = {};
                        imgAnn['metadata']['width'] = size['width'];
                        imgAnn['metadata']['height'] = size['height'];
                        imgAnn['metadata']['format'] = size['type'];

                        resolve (reconciliateSchemaGCloud(imageUrl, imgAnn, minScore));
                    })
                .catch(err => console.error(err));


            })
            .catch( errValue => {
               console.log(errValue);
                errValue['imageUrl'] = imageUrl;
               reject(errValue);
            });
    });
}

/*  This function will reconcile the schema in a unique and standard one
* */
function reconciliateSchemaGCloud(imageUrl, gCloudVision, minScore){
    let cogniAPI = {};//add field for cogniAPI data

    cogniAPI['imageUrl'] = imageUrl;
    cogniAPI['description'] = descriptionUtilities.buildDescriptionObj(gCloudVision);
    cogniAPI['tags'] = descriptionUtilities.buildTagsObj(gCloudVision, null, minScore);
    cogniAPI['objects'] = descriptionUtilities.buildObjectsObj(gCloudVision, null, minScore);
    cogniAPI['landmarks'] = descriptionUtilities.buildLandmarksObj(gCloudVision);
    cogniAPI['texts'] = descriptionUtilities.buildTextsObj(gCloudVision);
    cogniAPI['webDetection'] = descriptionUtilities.buildWebDetectionObj(gCloudVision);

    cogniAPI['faces'] = faceUtilities.buildFacesObj(gCloudVision['faceAnnotations']);

    cogniAPI['safetyAnnotation'] = safetyUtilities.buildSafetyObj(gCloudVision['safeSearchAnnotation']);
    cogniAPI['metadata'] = gCloudVision['metadata'];
    cogniAPI['graphicalData'] = colorInfoUtilities.buildColorInfoObj(gCloudVision['imagePropertiesAnnotation']['dominantColors']);


    return cogniAPI;
}

module.exports = {analyseRemoteImage, analyseRemoteImageCogniSchema};