/*
*   Module which interact with Azure API Services
*
*   @author: Devis
*/

//in order to read env variables
require('dotenv').config();

const fetch = require('node-fetch');

const subscriptionKeyV = process.env.AZURE_VISION_KEY1;

const uriBaseVision = 'https://westeurope.api.cognitive.microsoft.com/vision/v2.0/analyze';

function analyseRemoteImageFetch(imageUrl){
    return new Promise((resolve, reject) => {
        console.log('azure comp vision request for ' + imageUrl);
        // Request parameters.
        const params = {
            'visualFeatures': 'Tags,Categories,Description,Color,Faces,ImageType,Adult',
            'details': 'Celebrities,Landmarks',
            'language': 'en'
        };

        let uriBQ = uriBaseVision + '?'; //uriBQ will be uri base with the query string params
        for(let p in params){
            uriBQ += p + "=" + params[p] + "&";
        }
        uriBQ = uriBQ.slice(0,uriBQ.length - 1);//erase last &

        fetch(uriBQ, {
            method: 'POST',
            qs: JSON.stringify(params),
            body: '{"url": ' + '"' + imageUrl + '"}',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key' : subscriptionKeyV
            }
        })
            .then(res => {
                if(!res.ok)//res.status<200 || res.status >=300
                    reject({err_status: res.status});

                res.json().then(json => resolve(json)).catch(e => reject(e));
            }).catch(e => reject(e));

    });
}

const subscriptionKeyF = process.env.AZURE_FACE_KEY1;

const uriBaseFace = 'https://westeurope.api.cognitive.microsoft.com/face/v1.0/detect';

function faceRemoteImageFetch(imageUrl){
    return new Promise((resolve, reject) => {
        console.log('azure face request for ' + imageUrl);
        // Request parameters.
        const params = {
            'returnFaceId': 'true',
            'returnFaceLandmarks': 'false',
            'returnFaceAttributes': 'age,gender,headPose,smile,facialHair,glasses,' +
                'emotion,hair,makeup,occlusion,accessories,blur,exposure,noise'
        };

        let uriBQ = uriBaseFace + '?'; //uriBQ will be uri base with the query string params
        for(let p in params){
            uriBQ += p + "=" + params[p] + "&";
        }
        uriBQ = uriBQ.slice(0,uriBQ.length - 1);//erase last &

        fetch(uriBQ, {
            method: 'POST',
            qs: JSON.stringify(params),
            body: '{"url": ' + '"' + imageUrl + '"}',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key' : subscriptionKeyF
            }
        })
            .then(res => {
                if(!res.ok)//res.status<200 || res.status >=300
                    reject({err_status: res.status});

                res.json().then(json => resolve(json)).catch(e => reject(e));
            }).catch(e => reject(e));

    });
}

//TRY WITH COGNITIVE SERVICE CLIENT LIBRARY
/*
const msRestAzure = require('ms-rest-azure');
const CognitiveServicesManagement = require('azure-arm-cognitiveservices');
const SubscriptionId = '8d12d792-7603-4265-a8a2-290cdc5c4ef7';
const ResourceGroup = 'cogni-api';
const ResourceName = 'cogni-api';
let client;

let createAccount = msRestAzure.interactiveLogin().then((credentials) => {
    client = new CognitiveServicesManagement(credentials, SubscriptionId);
    return client;
}).catch((err) => {
    console.log('An error ocurred');
    console.dir(err, {depth: null, colors: true});
});


//TODO  try to change with msRestAzure
const CognitiveServicesCredentials = require('ms-rest-azure').CognitiveServicesCredentials;

let credentials;
let serviceKey;

createAccount.then((result) => {
    return client.accounts.listKeys(ResourceGroup, ResourceName);
}).then((result) => {
    serviceKey = result.key1;
    console.log('Azure Cognitive Service Computer Vision Key: ' + result.key1);
    console.log('Azure Cognitive Service Computer Vision Key: ' + result.key2);
    // Creating the Cognitive Services credentials
    // This requires a key corresponding to the service being used (i.e. text-analytics, etc)
    credentials = new CognitiveServicesCredentials(serviceKey);
}).catch((err) => {
    console.log('An error ocurred');
    console.dir(err, {depth: null, colors: true});
});


const ComputerVisionClient = require('azure-cognitiveservices-computervision');

function analyseRemoteImage(imageUrl){
    return new Promise((resolve, reject) => {

        let client = new ComputerVisionClient({'Ocp-Apim-Subscription-Key' : subscriptionKey}, 'https://westus.api.cognitive.microsoft.com');
        //let fileStream = require('fs').createReadStream('pathToSomeImage.jpg');
        client.analyzeImageInStreamWithHttpOperationResponse(imageUrl, { //you can pass the fileStream here
            visualFeatures: ['Categories', 'Tags', 'Description', 'Color', 'Faces', 'ImageType', 'Adult'],
            details: ['Celebrities' ,'Landmarks'],
            language: 'en'
        }).then((response) => {
            resolve(response.body);
            //console.log(response.body.tags);
            //console.log(response.body.description.captions[0]);
        }).catch((err) => {
            reject(err);
        });

    });
}
*/
module.exports = {analyseRemoteImageFetch, faceRemoteImageFetch /*, analyseRemoteImage*/};