/*
*   Module which interact with Azure API Services
*
*   @author: Devis
*/

//in order to read env variables
require('dotenv').config();

//perform the api request with node-fetch
const fetch = require('node-fetch');

//key for accessing the azure computer vision api services
const subscriptionKeyV = process.env.AZURE_VISION_KEY1;

//url for accessing the azure computer vision api services
const uriBaseVision = 'https://westeurope.api.cognitive.microsoft.com/vision/v2.0/analyze';

function analyseRemoteImage(imageUrl){
    return new Promise((resolve, reject) => {
        console.log('azure comp vision request for ' + imageUrl);//TODO debugging

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

//key for accessing the azure face api services
const subscriptionKeyF = process.env.AZURE_FACE_KEY1;

//url for accessing the azure face api services
const uriBaseFace = 'https://westeurope.api.cognitive.microsoft.com/face/v1.0/detect';

function faceRemoteImage(imageUrl){
    return new Promise((resolve, reject) => {
        console.log('azure face request for ' + imageUrl);//TODO debugging

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

module.exports = {analyseRemoteImage, faceRemoteImage};