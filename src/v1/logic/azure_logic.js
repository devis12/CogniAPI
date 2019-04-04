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

function analyseRemoteImage(imageUrl, visualFeatures){
    return new Promise((resolve, reject) => {
        console.log('azure comp vision request for ' + imageUrl);//TODO debugging

        // Request parameters.
        const params = {
            'visualFeatures': 'Tags,Categories,Description,Color,Faces,ImageType,Adult',
            'details': 'Celebrities,Landmarks',
            'language': 'en'
        };

        if(visualFeatures)//custom features
            params['visualFeatures'] = visualFeatures;

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

/*  Utility function in order to delete unnecessary data from the tag detection and then
*   return just labels and relative scores (take only the ones which are above the minScore threshold)*/
function filterTags(azureJson, minScore){

    let retObj = {};

    //categories annotations
    retObj['categories'] = [];
    for(let category of azureJson['categories']){
        if(Number.parseFloat(category['score']) > minScore)
            retObj['categories'].push(category);
    }

    //tags annotations
    retObj['tags'] = [];
    for(let tagAnn of azureJson['tags']){
        if(Number.parseFloat(tagAnn['confidence']) > minScore)
            retObj['tags'].push({'name': tagAnn['name'], 'score': Number.parseFloat(tagAnn['confidence'])});
    }

    //logo annotations
    retObj['generic_tags'] = azureJson['description']['tags'];


    //tags annotations
    retObj['captions'] = [];
    for(let captionAnn of azureJson['description']['captions']){
        if(Number.parseFloat(captionAnn['confidence']) > minScore)
            retObj['captions'].push({'name': captionAnn['text'], 'score': Number.parseFloat(captionAnn['confidence'])});
    }

    return retObj;
}

//key for accessing the azure face api services
const subscriptionKeyF = process.env.AZURE_FACE_KEY1;

//url for accessing the azure face api services
const uriBaseFace = 'https://westeurope.api.cognitive.microsoft.com/face/v1.0';

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

        let uriBQ = uriBaseFace + '/detect?'; //uriBQ will be uri base with the query string params
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

//const string to add as suffix in order to identify a face group name related to a specific logged user
const faceGroupSuffix = '_cogni_fg';

/*  Given a loggedUser instantiate a LargeFaceList on azure with the name related to it (if doesn't exist yet)
* */
function createFaceGroup(loggedUser){
    let groupName = (loggedUser + faceGroupSuffix).toLowerCase();//fix bug azure largelistface id
    return new Promise((resolve, reject) => {
        console.log('azure face request for creating the following face group ' + groupName);//TODO debugging

        let uriBQ = uriBaseFace + '/largefacelists/' + groupName;


        fetch(uriBQ, {
            method: 'PUT',
            body: '{"name": ' + '"' + groupName + '"}',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key' : subscriptionKeyF
            }
        })
            .then(res => {
                if(res.status == 409){
                    // conflict: group already exists
                    console.log('Face group already exist for user ' + loggedUser);
                    resolve(null);
                }else if(!res.ok)//res.status<200 || res.status >=300
                    reject({err_status: res.status});
                else{
                    console.log('Face group instantiated correctly for user ' + loggedUser);
                    resolve(200); // face group created with no problem
                }

            }).catch(e => reject(e));

    });
}

/*  Given a face target & some user_data, store them in the face list related to the user
* */
function addToFaceGroup(imageUrl, target, userData, loggedUser){
    let groupName = (loggedUser + faceGroupSuffix).toLowerCase();//fix bug azure largelistface id
    return new Promise((resolve, reject) => {
        //console.log("azure face request for adding a face (" + imageUrl + ") to the following face group " + groupName);//TODO debugging

        // Request parameters.
        const params = {
            'largeFaceListId': groupName,
            'userData': userData, // name of the recognized person (supplied by the user)
            'targetFace': target
        };

        let uriBQ = uriBaseFace + '/largefacelists/' + groupName + '/persistedfaces?'; //uriBQ will be uri base with the parameters
        for(let p in params){
            uriBQ += p + "=" + params[p] + "&";
        }
        uriBQ = uriBQ.slice(0,uriBQ.length - 1);//erase last &

        //console.log("Node-fetch to " + uriBQ);

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
                else{
                    console.log('Added face correctly for user ' + loggedUser);
                    resolve(200); // face added to face group
                }

            }).catch(e => reject(e));

    });
}

/*  Given a persisted face & some user_data, store them in the face list related to the user (updating the ones
*   which are already saved)
* */
function patchFace(persistedFaceId, userData, loggedUser){
    let groupName = (loggedUser + faceGroupSuffix).toLowerCase();//fix bug azure largelistface id
    return new Promise((resolve, reject) => {

        let uriBQ = uriBaseFace + '/largefacelists/' + groupName + '/persistedfaces/' + persistedFaceId; //uriBQ will be uri base with the parameters

        fetch(uriBQ, {
            method: 'PATCH',
            body: '{"userData": ' + '"' + userData + '"}',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key' : subscriptionKeyF
            }
        })
            .then(res => {
                if(!res.ok)//res.status<200 || res.status >=300
                    reject({err_status: res.status});
                else{
                    console.log('Patched face correctly for user ' + loggedUser);
                    resolve(200); // face added to face group
                }

            }).catch(e => reject(e));

    });
}

/*  Call the method which performs a call to the api in order to instantiate a new face group
* */
function trainFaceGroup(loggedUser){
    let groupName = (loggedUser + faceGroupSuffix).toLowerCase();//fix bug azure largelistface id
    return new Promise((resolve, reject) => {
        console.log('azure face request for training the following face group ' + groupName);//TODO debugging

        let uriBQ = uriBaseFace + '/largefacelists/' + groupName + '/train';


        fetch(uriBQ, {
            method: 'POST',
            body: '{}',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key' : subscriptionKeyF
            }
        })
            .then(res => {
                if(!res.ok)//res.status<200 || res.status >=300
                    reject({err_status: res.status});
                else{
                    console.log('Face group training phase started correctly for user ' + loggedUser);
                    resolve(200); // face group created with no problem
                }

            }).catch(e => reject(e));

    });
}


/*  Function will perform request in order to find the most suitable match for each face
    recognized inside the image. The match will be found inside the group faces related
    to the logged user and will be associated with the info the user has supplied in the
    first place
*/
function findSimilar(loggedUser, imgAnnotation){
    let groupName = (loggedUser + faceGroupSuffix).toLowerCase();//fix bug azure largelistface id
    return new Promise((resolve, reject) => {

        let faceIds = []; //stored the face id (not persisted) in the same order for easily perform some operations later
        for(let azFace of imgAnnotation.azureF){faceIds.push(azFace['faceId']);}

        //find the matching ids for the persisted face ids
        findSimilarPersistedIds(groupName, faceIds)
            .then( persistedIds => {
            console.log('The following array of persisted ids has been discovered for ' + imgAnnotation.imgUrl + ': ' + JSON.stringify(persistedIds));
            //resolve(imgAnnotation);
            findUserDataPersistedIds(groupName, persistedIds).then(persistedUserData => {
                console.log('The following array of persisted userData has been discovered for ' + imgAnnotation.imgUrl + ': ' + JSON.stringify(persistedUserData));
                for(let i = 0; i < imgAnnotation.azureF.length; i++){
                    imgAnnotation.azureF[i]['persistedName'] = persistedUserData[i];
                    imgAnnotation.azureF[i]['persistedFaceId'] = persistedIds[i];
                }
                resolve(imgAnnotation);
            });
        });
    });
}


/*  Function will perform request in order to find the most suitable match for each face
    recognized inside the image (here present as an array of detected face ids). The match will
    be found inside the group face related to the logged user (faceList) and will be returned as
    an array of persisted face ids which will be subsequentially examinated
*/
function findSimilarPersistedIds(faceList, faceIds){
    return new Promise((resolve, reject) => {
        let uriBQ = uriBaseFace + '/findsimilars';

        // Request parameters (to add faceId for each request)
        const bodyParams = {
            'largeFaceListId': faceList,
            "maxNumOfCandidatesReturned": 1,
            "mode": "matchPerson"
        };

        let promisesPersistedId = []; //promises to find matching persisted ids for the face

        //find the matching ids for the persisted face ids
        for(let azFaceId of faceIds){
            let bodyParamsReq = JSON.parse(JSON.stringify(bodyParams));//clone body param
            bodyParamsReq['faceId'] = azFaceId;//add the specific face id in order to find the similar in the request body

            console.log('Requesting with the following params ' + JSON.stringify(bodyParamsReq) +
                ' to ' + uriBQ);

            promisesPersistedId.push(
                fetch(uriBQ, {
                    method: 'POST',
                    body: JSON.stringify(bodyParamsReq),
                    headers: {
                        'Content-Type': 'application/json',
                        'Ocp-Apim-Subscription-Key' : subscriptionKeyF
                    }
                }));
        }

        let waitAllPIds = [];//json still need to be unpacked
        let persistedIds = [];//actual array of persisted Ids
        persistedIds = new Array(faceIds.length).fill(false);//fill the array with silly values, so you can mantain the order

        //get userdata for the matching persisted id
        Promise.all(promisesPersistedId).then(persistedValues => {
            for(let i = 0; i < persistedValues.length; i++){
                waitAllPIds.push(new Promise( resolve2 => {
                    persistedValues[i].json().then(persistedJSONValue => {
                        if(persistedJSONValue.length > 0){
                            console.log('Adding the following p_id ' + persistedJSONValue[0]['persistedFaceId'] + ' for ' + faceIds[i]);
                            persistedIds[i] = persistedJSONValue[0]['persistedFaceId'];
                        }else{
                            console.log('Adding the following p_id undefined for ' + faceIds[i]);
                            persistedIds[i] = undefined;
                        }
                        resolve2(null);
                    });
                }));
            }

            //wait the unpack of all the json objects with the persistent ids
            Promise.all(waitAllPIds).then(() => {
                resolve(persistedIds);
            });

        });
    });
}


/*  Given an array of persisted face ids and the faceList in which to find them, return an array of
    userData related to those faces
*/
function findUserDataPersistedIds(faceList, persistedFaceIds) {
    return new Promise((resolve, reject) => {
        let uriBQ2 = uriBaseFace + '/largefacelists/' + faceList + '/persistedfaces/';

        let promisesPersistedUserData = [];//promises to find for a matching persisted face id the user data related to it

        //find the user data related for the persisted face ids
        for(let i = 0; i < persistedFaceIds.length; i++){
            if(persistedFaceIds[i])
                promisesPersistedUserData.push(
                    fetch(uriBQ2 + persistedFaceIds[i], {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Ocp-Apim-Subscription-Key' : subscriptionKeyF
                        }
                    }));
            else
                promisesPersistedUserData.push(new Promise(res => res(null)));
        }

        let waitAllPData = [];//json still need to be unpacked
        let persistedData = [];//actual array of persisted user data related to the persistent ids
        persistedData = new Array(persistedFaceIds.length).fill(false);//fill the array with silly values, so you can mantain the order

        //get userdata for the matching persisted id
        Promise.all(promisesPersistedUserData).then(persistedValues => {
            for(let i = 0; i < persistedValues.length; i++){
                waitAllPData.push(new Promise( resolve2 => {
                    if(persistedValues[i]){
                        persistedValues[i].json().then(persistedJSONValue => {
                            console.log('Adding the following p_userdata ' + persistedJSONValue['userData'] + ' for ' + persistedFaceIds[i]);
                            persistedData[i] = (persistedJSONValue['userData']);
                            resolve2(null);
                        });
                    }else{
                        console.log('Adding the following p_userdata undefined for ' + persistedFaceIds[i]);
                        persistedData[i] = (undefined);
                        resolve2(null);
                    }

                }));
            }

            //wait the unpack of all the json objects with the persistent ids
            Promise.all(waitAllPData).then(() => {
                resolve(persistedData);
            });

        });
    });
}

module.exports = {  analyseRemoteImage, faceRemoteImage, createFaceGroup,
                    addToFaceGroup, patchFace, trainFaceGroup, findSimilar,
                    filterTags};