/*
*   Module which interact with Azure API Services
*
*   @author: Devis
*/

const fetch = require('node-fetch');

const azure1 = require('../../api_url_keys').azure1;
const azure2 = require('../../api_url_keys').azure2;

const subscriptionKey = azure2.key;

const uriBase = azure2.url + '/analyze';

function analyseRemoteImageFetch(imageUrl){
    return new Promise((resolve, reject) => {

        // Request parameters.
        const params = {
            'visualFeatures': 'Tags,Categories,Description,Color,Faces,ImageType,Adult',
            'details': 'Celebrities,Landmarks',
            'language': 'en'
        };

        let uriBQ = uriBase + '?'; //uriBQ will be uri base with the query string params
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
                'Ocp-Apim-Subscription-Key' : subscriptionKey
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
const SubscriptionId = 'your-subscription-key';
const ResourceGroup = 'your-resource-group-name';
const ResourceName = 'resource-name';
let client;

let createAccount = msRestAzure.interactiveLogin().then((credentials) => {
    client = new CognitiveServicesManagement(credentials, SubscriptionId);
    return client.accounts.create(ResourceGroup, ResourceName, {
        sku: {
            name: 'F0'
        },
        kind: 'ComputerVision',
        location: 'westus',
        properties: {}
    });
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
    console.log(result.key2);
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

        let client = new ComputerVisionClient(credentials, 'https://westus.api.cognitive.microsoft.com');
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
}*/

//module.exports = {analyseRemoteImageFetch, analyseRemoteImage};
module.exports = {analyseRemoteImageFetch};