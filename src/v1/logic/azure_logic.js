/*
*   Module which interact with Azure API Services
*
*   @author: Devis
*/

//in order to read env variables
require('dotenv').config();

//perform the api request with node-fetch
const fetch = require('node-fetch');

//url for our backend storage
const backendStorage = require('../general').backendStorage;

//key for accessing the azure computer vision api services
const subscriptionKeyV = process.env.AZURE_VISION_KEY1;

//url for accessing the azure computer vision api services
const uriBaseVision = require('../general').uriAzureCompVision;

function analyseRemoteImage(imageUrl, visualFeatures){
    return new Promise((resolve, reject) => {
        console.log('azure comp vision request for ' + imageUrl);//TODO debugging

        // Request parameters.
        const params = {
            'visualFeatures': 'Tags,Objects,Categories,Description,Color,Faces,ImageType,Adult',
            'details': 'Celebrities,Landmarks',
            'language': 'en'
        };

        if(visualFeatures)//custom features
            params['visualFeatures'] = visualFeatures;

        let uriBQ = uriBaseVision + '/analyze?'; //uriBQ will be uri base with the query string params
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
            retObj['tags'].push({'name': tagAnn['name'], 'confidence': Number.parseFloat(tagAnn['confidence'])});
    }

    //logo annotations
    retObj['generic_tags'] = azureJson['description']['tags'];


    //tags annotations
    retObj['captions'] = [];
    for(let captionAnn of azureJson['description']['captions']){
        if(Number.parseFloat(captionAnn['confidence']) > minScore)
            retObj['captions'].push({'name': captionAnn['text'], 'confidence': Number.parseFloat(captionAnn['confidence'])});
    }

    return retObj;
}

//key for accessing the azure face api services
const subscriptionKeyF = process.env.AZURE_FACE_KEY1;

//url for accessing the azure face api services
const uriBaseFace = require('../general').uriAzureFace;

// following boolean will indicate if the user data stored and related to a face will be saved on azure
// or on our personal storage
const userDataStoredOnAzure = require('../general').userDataStoredOnAzure;

function faceRemoteImage(imageUrl){
    return new Promise((resolve, reject) => {
        console.log('azure face request for ' + imageUrl);//TODO debugging

        // Request parameters.
        const params = {
            'returnFaceId': 'true',
            'returnFaceLandmarks': 'true',
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

        // Request parameters.
        const params = {
            'largeFaceListId': groupName,
            'userData': (userDataStoredOnAzure)? userData:'',  // if the userData are not stored on azure you will need to upload them on our storage
            'targetFace': target
        };

        let uriBQ = uriBaseFace + '/largefacelists/' + groupName + '/persistedfaces?'; //uriBQ will be uri base with the parameters
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
                else{
                    console.log('Added face correctly for user ' + loggedUser + ' on azure face list');

                    if(userDataStoredOnAzure){
                        resolve(200); // face added to face group on azure with user data saved on azure

                    }else{ // if the userData are not stored on azure you will need to upload them on our storage

                        res.json().then( resAddFace => {
                            console.log('Adding in our cogni storage ' + userData + ' for ' + resAddFace['persistedFaceId']);
                            fetch(backendStorage + '/addFace.php', {
                                method: 'POST',
                                body: JSON.stringify({
                                    cogni_fg: groupName,
                                    pface_id: resAddFace['persistedFaceId'],
                                    user_data: userData}),
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            })
                                .then( resStorage => {
                                    resolve(200);
                                })

                                .catch( errStorage => {
                                    reject(errStorage);
                                });
                        });
                    }
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

        if(userDataStoredOnAzure){// face will be patch to face group on azure with user data saved on azure
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
                        resolve(200); // face patched in face group
                    }

                }).catch(e => reject(e));

        }else{ // face will be patch to face group on our cogni storage with user data saved on it

            fetch(backendStorage + '/patchFaceData.php', {
                method: 'POST',
                body: JSON.stringify({
                    cogni_fg: groupName,
                    pface_id: persistedFaceId,
                    user_data: userData}),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then( resStorage => {
                    console.log('Patched face correctly for user ' + loggedUser + ' on cogni storage');
                    resolve(200);
                })

                .catch( errStorage => {
                    reject(errStorage);
                });
        }

    });
}

/*  Given a persisted face & some user_data, store them in the face list related to the user (updating the ones
*   which are already saved)
* */
function forgetFace(persistedFaceId, loggedUser){
    let groupName = (loggedUser + faceGroupSuffix).toLowerCase();//fix bug azure largelistface id
    return new Promise((resolve, reject) => {

        let uriBQ = uriBaseFace + '/largefacelists/' + groupName + '/persistedfaces/' + persistedFaceId; //uriBQ will be uri base with the parameters

        fetch(uriBQ, {
            method: 'DELETE',
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
                    console.log('Delete persisted face correctly for user ' + loggedUser);
                    if(!userDataStoredOnAzure){// face user data will be deleted also from our db
                        fetch(backendStorage + '/deleteFaceData.php', {
                            method: 'POST',
                            body: JSON.stringify({
                                cogni_fg: groupName,
                                pface_id: persistedFaceId
                            }),
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                            .then( resStorage => {
                                console.log('Delete face data correctly for user ' + loggedUser + ' on cogni storage');
                                resolve(200);
                            })

                            .catch( errStorage => {
                                reject(errStorage);
                            });
                    }else
                        resolve(200); // face deleted from face group
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
            .then( persistedIdVals => {//persisted face id + confidence value in an array of max (max candidate) elements
            console.log('The following array of persisted ids has been discovered for ' + imgAnnotation.imgUrl + ': ' + JSON.stringify(persistedIdVals));

            findUserDataForPersistedIds(groupName, persistedIdVals).then(persistedUserData => {
                console.log('The following array of persisted userData has been discovered for ' + imgAnnotation.imgUrl + ': ' + JSON.stringify(persistedUserData));

                for(let i = 0; i < imgAnnotation.cogniAPI.faces.length; i++){
                    imgAnnotation.cogniAPI.faces[i]['similarFaces'] = persistedUserData[i];
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
            "maxNumOfCandidatesReturned": 3,
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
                    persistedValues[i].json().then(persistedJSONValues => {
                        if(persistedJSONValues.length > 0){
                            console.log('Adding the following p_ids ' + persistedJSONValues + ' for ' + faceIds[i]);
                            persistedIds[i] = persistedJSONValues;
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
function findUserDataForPersistedIds(faceList, persistedFaces) {
    return new Promise((resolve, reject) => {
        let uriBQ2 = '';

        if(userDataStoredOnAzure) // retrieve userData from azure directly
            uriBQ2 = uriBaseFace + '/largefacelists/' + faceList + '/persistedfaces/';

        else
            uriBQ2 = backendStorage + '/getFaceData.php?cogni_fg=' + faceList + '&pface_id='; // retrieve data from cogni storage

        let promisesPersistedUserData = [];//promises to find for every array of matching persisted faces the user data related to it

        //find the user data related for the persisted face ids
        for(let i = 0; i < persistedFaces.length; i++){
            promisesPersistedUserData[i] = new Promise( (resolve, reject) => {
                let promisesPersistedUserDataFaceI = [];
                if(Array.isArray(persistedFaces[i])){

                    for(let j=0; j<persistedFaces[i].length; j++) {//to every face has been associate a number of candidates (retrieve user data for each one of them)
                        if (persistedFaces[i][j]['persistedFaceId'] &&
                            userDataStoredOnAzure) {//you've got to make a call for every persisted face ids

                            promisesPersistedUserDataFaceI.push(
                                fetch(uriBQ2 + persistedFaces[i][j]['persistedFaceId'], {
                                    method: 'GET',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Ocp-Apim-Subscription-Key': subscriptionKeyF
                                    }
                                }));

                        } else if (persistedFaces[i][j]['persistedFaceId']
                            && !userDataStoredOnAzure) { // retrieve data from cogni storage

                            promisesPersistedUserDataFaceI.push(
                                fetch(uriBQ2 + persistedFaces[i][j]['persistedFaceId'], {
                                    method: 'GET'
                                }));

                        } else
                            promisesPersistedUserDataFaceI.push(new Promise(res => res(null)));
                    }

                    Promise.all(promisesPersistedUserDataFaceI).then( arrayOfUserData => resolve(arrayOfUserData));
                }else{

                   resolve(null);
                }

            });
        }

        let waitAllPData = [];//json still need to be unpacked

        //get userdata for the matching persisted id
        Promise.all(promisesPersistedUserData).then(persistedValues => {
            for(let i = 0; i < persistedValues.length; i++){
                waitAllPData.push(new Promise( resolve2 => {

                    if(persistedValues[i]){
                        let unpackEverything = []; //unpack all the jsons and then resolve promise for face i
                        for(let j=0; j<persistedValues[i].length; j++){
                            unpackEverything.push(new Promise((resolve3) => {
                                persistedValues[i][j].json().then(persistedJSONValue => {
                                    console.log('Adding the following p_userdata ' + persistedJSONValue['userData'] + ' for ' + persistedFaces[i][j]);
                                    persistedFaces[i][j]['userData'] = (persistedJSONValue['userData']);
                                    resolve3(null);
                                });
                            }));
                        }
                        Promise.all(unpackEverything).then( () => resolve2(null));

                    }else{
                        console.log('Adding the following p_userdata undefined for ' + persistedFaces[i]);
                        persistedFaces[i] = (undefined);
                        resolve2(null);
                    }

                }));
            }

            //wait the unpack of all the json objects with the persistent ids
            Promise.all(waitAllPData).then(() => {
                resolve(persistedFaces);
            });

        });
    });
}

module.exports = {  analyseRemoteImage, faceRemoteImage, createFaceGroup,
                    addToFaceGroup, patchFace, forgetFace, trainFaceGroup, findSimilar,
                    filterTags};