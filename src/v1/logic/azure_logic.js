/*
*   Module which interact with Azure API Services:
*       - Image analysis with Azure Computer Vision
*       - Image Face API for face detection & recognition (aiming to simplify the workflow)
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

//key for accessing the azure face api services
const subscriptionKeyF = process.env.AZURE_FACE_KEY1;

//url for accessing the azure face api services
const uriBaseFace = require('../general').uriAzureFace;

// indicates if the user data stored and related to a face will be saved on azure
// or on our personal storage
const userDataStoredOnAzure = require('../general').userDataStoredOnAzure;

//description tags utilities
const descriptionUtilities = require('./descriptionUtilities');

//Face utilities in order to combine, merge & cross check data
const faceUtilities = require('./faceUtilities');

//safety tags utilities
const safetyUtilities = require('./safetyUtilities');

//colorinfo tags utilities
const colorInfoUtilities = require('./colorInfoUtilities');

//const string to add as suffix in order to identify a face group name related to a specific logged user
const faceGroupSuffix = '_cogni_fg';

/*  Simple annotation call given an imageUrl and selecting specific visualFeatures
* */
function analyseRemoteImage(imageUrl, visualFeatures){
    return new Promise((resolve, reject) => {

        //console.log('azure comp vision request for ' + imageUrl);// debugging purpose

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
            body: '{"url": ' + '"' + imageUrl + '"}',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key' : subscriptionKeyV
            }
        })

            .then(res => {
                //console.log('Azure CV status: ' + res.status); // debugging purpose

                if(!res.ok) {//res.status<200 || res.status >=300

                    res.json().then(resErr =>
                        reject({
                            responseStatus: {
                                status: res.status,
                                msg: resErr.message,
                                code: resErr.code
                            }
                        })
                    );

                }else //res 200 ok -> annotation performed
                    res.json().then(json => resolve(json)).catch(e => reject(e));

            })

            .catch(e => reject(e));

    });
}

//functions to perform single image annotation, but to pack the values as a json respecting the cogniAPI schema
function analyseRemoteImageCogniSchema(imageUrl, loggedUser, minScore){
    return new Promise( (resolve, reject) => {

        let azureCVP = analyseRemoteImage(imageUrl); // perform image analysis with Azure Computer Vision API
        let azureFP = faceRemoteImage(imageUrl); // perform face detection with Azure Face API

        Promise.all([azureCVP, azureFP])

            .then(azureAnn => {
                let azureCV = azureAnn[0]; // results from Azure Computer Vision API
                let azureF = azureAnn[1]; // results from Azure Face API

                let cogniAPI = reconcileSchemaAzure(imageUrl, azureCV, azureF, minScore); // standard cogni schema

                if(loggedUser){ //perform findSimilar (face recognition with stored face) if the user is logged

                    //add tag in case you find a similar faces, already registered by the logged user
                    findSimilar(
                        loggedUser,
                        cogniAPI.faces)

                        .then(() => resolve(cogniAPI));

                }else //user not logged
                    resolve(cogniAPI);
            })

            .catch(err_values => {
               console.error(err_values);
               err_values['imageUrl'] = imageUrl;
               reject(err_values);
            });

    });
}

/*  This function will reconcile the schema in a unique and standard one
    (in respect to the std cogniAPI schema which you get from a complete analysis)
* */
function reconcileSchemaAzure(imageUrl, azureCV, azureFaces, minScore){
    let cogniAPI = {};//add field for cogniAPI data

    cogniAPI['imageUrl'] = imageUrl;
    cogniAPI['description'] = descriptionUtilities.buildDescriptionObj(null, azureCV);
    cogniAPI['tags'] = descriptionUtilities.buildTagsObj(null, azureCV, minScore);
    cogniAPI['objects'] = descriptionUtilities.buildObjectsObj(null, azureCV, minScore);
    cogniAPI['landmarks'] = descriptionUtilities.buildLandmarksObj(null, azureCV);

    cogniAPI['faces'] = faceUtilities.buildFacesObj(null, azureFaces, azureCV);

    cogniAPI['safetyAnnotations'] = safetyUtilities.buildSafetyObj(null, azureCV['adult']);
    cogniAPI['metadata'] = azureCV['metadata'];
    cogniAPI['graphicalData'] = colorInfoUtilities.buildColorInfoObj(null, azureCV['color'], azureCV['imageType']);

    cogniAPI['responseStatus'] = {
        status: 200,
        code: 'OK',
        msg: 'Analysis has been successfully performed'
    };

    return cogniAPI;
}


/*  Face detection performed by Azure Face API (age, gender, emotion, face landmarks and so on)
* */
function faceRemoteImage(imageUrl){
    return new Promise((resolve, reject) => {

        //console.log('azure face request for ' + imageUrl);// debugging purpose

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
            body: '{"url": ' + '"' + imageUrl + '"}',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key' : subscriptionKeyF
            }
        })
            .then(res => {
                //console.log('Azure Face status: ' + res.status);

                if(!res.ok){//res.status<200 || res.status >=300
                    res.json().then(resErr =>
                        reject({
                            responseStatus: {
                                status: res.status,
                                msg: resErr.message,
                                code: resErr.code
                            }})
                    );

                }else //res 200 ok -> annotation (for face detection & analysis) performed
                    res.json().then(json => resolve(json)).catch(e => reject(e));

            })

            .catch(e => reject(e));

    });
}


/*  Given a loggedUser instantiate a LargeFaceList on azure with the name related to it (if doesn't exist yet)
* */
function createFaceGroup(loggedUser){
    //largefacelist has a name related to the logged user (one largefacelist for each user)
    let groupName = (loggedUser + faceGroupSuffix).toLowerCase();

    return new Promise((resolve, reject) => {
        //console.log('azure face request for creating the following face group ' + groupName);// debugging purpose

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

                if(res.status == 409){ // this will happen every time a user perform a call after the absolute first one
                    // conflict: group already exists
                    //console.log('Face group already exist for user ' + loggedUser);
                    resolve(null);

                }else if(!res.ok)//res.status<200 || res.status >=300
                    reject({responseStatus:{status: res.status}});

                else{ // this will happen just for the first one call performed by a specific loggedUser
                    //console.log('Face group instantiated correctly for user ' + loggedUser);
                    resolve(200); // face group created with no problem
                }

            })

            .catch(e => reject(e));

    });
}

/*  Given a face target & some user_data, store them in the face list related to the user.
*   If we're on a free tier is preferable to store the userData on our backend storage in order
*   to perform less call later on (after the find similar calls return us a bunch of persisted face ids
*   and we've got to retrieve all the user data related to them one by one with exclusive calls.. which can
*   be costly if performed on azure).
*   Note: target is the bounding box of the face express as a string with values separated by commas (left,top,width,height).
*   In order to have them, you have to perform a face detection (given also with a face or full analysis of the img) before
* */
function addToFaceGroup(imageUrl, target, userData, loggedUser){
    //largefacelist has a name related to the logged user (one largefacelist for each user)
    let groupName = (loggedUser + faceGroupSuffix).toLowerCase();

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
            body: '{"url": ' + '"' + imageUrl + '"}',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key' : subscriptionKeyF
            }
        })
            .then(res => {
                if(!res.ok)//res.status<200 || res.status >=300
                    reject({responseStatus:{status: res.status}});

                else{
                    //console.log('Added face correctly for user ' + loggedUser + ' on azure face list');

                    if(userDataStoredOnAzure){
                        resolve(200); // face added to face group on azure with user data saved on azure

                    }else{ // if the userData are not stored on azure we will need to upload them on our backend storage

                        res.json().then( resAddFace => {
                            //console.log('Adding in our cogni storage ' + userData + ' for ' + resAddFace['persistedFaceId']);

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

            })

            .catch(e => reject(e));

    });
}

/*  Given a persisted face & some user_data, store them in the face list related to the user (updating the ones
*   which are already saved). User data could be directly stored on azure (on a premium tier) or saved in our
*   backend storage (which could be preferable on a free tier)
* */
function patchFace(persistedFaceId, userData, loggedUser){
    //largefacelist has a name related to the logged user (one largefacelist for each user)
    let groupName = (loggedUser + faceGroupSuffix).toLowerCase();

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
                        reject({responseStatus:{status: res.status}});

                    else{
                        //console.log('Patched face correctly for user ' + loggedUser);
                        resolve(200); // face patched in face group
                    }

                })

                .catch(e => reject(e));

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
                    //console.log('Patched face correctly for user ' + loggedUser + ' on cogni storage');
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
    //largefacelist has a name related to the logged user (one largefacelist for each user)
    let groupName = (loggedUser + faceGroupSuffix).toLowerCase();

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
                    reject({responseStatus:{status: res.status}});

                else{
                    //console.log('Delete persisted face correctly for user ' + loggedUser);

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

                    }else // user data related to the persisted face are stored on azure, so we're finished
                        resolve(200); // face deleted from face group
                }

            })

            .catch(e => reject(e));

    });
}


/*  Call the method which performs a call to the api in order to start training a model with a specific face group
*   Note: This API will return a 202 saying that the training phase has been STARTED correctly
* */
function trainFaceGroup(loggedUser){
    //largefacelist has a name related to the logged user (one largefacelist for each user)
    let groupName = (loggedUser + faceGroupSuffix).toLowerCase();//fix bug azure largelistface id

    return new Promise((resolve, reject) => {
        //console.log('azure face request for training the following face group ' + groupName);// debugging purpose

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
                    reject({responseStatus:{status: res.status}});

                else{ // training phase has been started correctly
                    //console.log('Face group training phase started correctly for user ' + loggedUser);
                    resolve(202);
                }

            })

            .catch(e => reject(e));

    });
}


/*  Given the array with all the azure faceIds retrieved in face analysis of multiple images
    group them by person using group azure face service
    (https://westus.dev.cognitive.microsoft.com/docs/services/563879b61984550e40cbbe8d/operations/563879b61984550f30395238)

    cogniFaceIds is an array of temporary face ids related to face detected in the last 24hrs
*/
function findSimilarInBatchAnn(cogniFaceIds) {
    return new Promise((resolve, reject) => {

        if(cogniFaceIds && Array.isArray(cogniFaceIds)){ //check if cogniFaceIds is a proper array

            let uriBQ = uriBaseFace + '/group';

            fetch(uriBQ, {
                method: 'POST',
                body: '{faceIds: ' + JSON.stringify(cogniFaceIds) + '}',
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key' : subscriptionKeyF
                }
            })
                .then(res => {
                    if(!res.ok) {//res.status<200 || res.status >=300
                        //res.json().then( dataErr  => console.log('Something went wrong in groupFace:\n ' + JSON.stringify(dataErr))); // debugging purpose
                        reject([]);

                    }else{ // there is also data.messyGroups where there will be put all the face ids not grouped (for now we just ignore this field)
                        res.json().then( data => resolve(data.groups));
                    }

                })

                .catch(e => reject(e));

        }else // cogniFaceIds is not an array
            reject([]);
    });
}



/*  Function will perform request in order to find the most suitable match for each face
    recognized inside the image. The match will be found inside the group of persisted faces
    related to the logged user and will be associated with the info the user has supplied in the
    first place

    IMPORTANT IF THE USER DOESN'T EXIST, but there is a username prompted, the face group related
    to this user will be created at this point
*/
function findSimilar(loggedUser, cogniFaces){
    //largefacelist has a name related to the logged user (one largefacelist for each user)
    let groupName = (loggedUser + faceGroupSuffix).toLowerCase();

    return new Promise((resolve, reject) => {

        checkTrainingStatus(loggedUser).then( trainingStatus => { // check if the system is trained and could be used in order to answer to some query
            //console.log('Training system status for user ' + loggedUser);//debugging purpose
            //console.log(trainingStatus);//debugging purpose

            // in similarFaces field put also the trainingStatus, so the user can check it and have more valuable information, instead of a simple empty array
            for(let i = 0; i < cogniFaces.length; i++){
                cogniFaces[i]['similarFaces'] = {
                    trainingStatus: trainingStatus.status || trainingStatus.error.code
                };
            }

            if(trainingStatus.status == 'succeeded'){ // system is trained, so you can perform the findSimilar task

                let faceIds = []; //stored the temporary face ids in the same order for easily perform some operations later
                for(let azFace of cogniFaces){//iterating over all the faces detected (could be also the ones detected just by google)
                    if(azFace['faceId'])//find similar just if the face has effectively been detected by azure face
                        faceIds.push(azFace['faceId']);
                }

                //find the matching ids for the persisted face ids
                findSimilarPersistedIds(groupName, faceIds)

                    .then( persistedIdVals => {//persisted face id + confidence value in an array of max (max candidate) elements

                        //find user data related to these persisted face ids and put them in
                        findUserDataForPersistedIds(groupName, persistedIdVals).then(persistedUserData => {

                            for(let i = 0; i < cogniFaces.length; i++){
                                cogniFaces[i]['similarFaces']['similarPersistedFaces'] = persistedUserData[i];
                            }

                            resolve(cogniFaces);
                        });

                    });

            }else if(trainingStatus.error && trainingStatus.error.code == 'LargeFaceListNotFound' && loggedUser != ''){ //first time which this user is performing the call
                createFaceGroup(loggedUser);// create new face group list
                resolve(cogniFaces);

            }else{ // facelist group not trained... you can't perform analysis in order to find similar faces

                resolve(cogniFaces);
            }

        });

    });
}

/*  Given a groupName, find if it is trained and it's possible to use the model for query it with
    the findSimilar task
* */
function checkTrainingStatus(loggedUser){
    //largefacelist has a name related to the logged user (one largefacelist for each user)
    let groupName = (loggedUser + faceGroupSuffix).toLowerCase();

    return new Promise((resolve, reject) => {
        let uriBQ = uriBaseFace + '/largefacelists/' + groupName + '/training';
        fetch(uriBQ, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Ocp-Apim-Subscription-Key' : subscriptionKeyF
            }
        })

        .then(data => data.json().then(trainingData => resolve(trainingData)))

        .catch(err => reject(err));

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

        // Request parameters (after that we're going to add faceId for each request)
        const bodyParams = {
            'largeFaceListId': faceList,
            "maxNumOfCandidatesReturned": 3,
            "mode": "matchPerson"
        };

        let promisesPersistedId = []; //promises to find matching persisted ids for the face

        //find the matching persisted face ids for the temporary faceIds
        for(let azFaceId of faceIds){

            let bodyParamsReq = JSON.parse(JSON.stringify(bodyParams));//clone body param
            bodyParamsReq['faceId'] = azFaceId;//add the specific face id in order to find the similar in the request body

            //console.log('Requesting with the following params ' + JSON.stringify(bodyParamsReq) + ' to ' + uriBQ);//debugging purpose

            //making the findsimilar api call for each face
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

        let waitAllPIds = [];//fetched results with json that still need to be unpacked -> promises for json() called on each result of the fetch above
        let persistedIds = [];//actual array of persisted Ids
        persistedIds = new Array(faceIds.length).fill(false);//fill the array with silly values, so you can mantain the order


        Promise.all(promisesPersistedId).then(persistedValues => {

            for(let i = 0; i < persistedValues.length; i++){
                waitAllPIds.push(new Promise( resolve2 => {
                    persistedValues[i].json().then(persistedJSONValues => {
                        if(persistedJSONValues.length > 0){
                            //console.log('Adding the following p_ids ' + persistedJSONValues + ' for ' + faceIds[i]);
                            persistedIds[i] = persistedJSONValues;

                        }else{ // no persisted matching face has been found for this detected face
                            //console.log('Adding the following p_id undefined for ' + faceIds[i]);
                            persistedIds[i] = undefined;
                        }
                        resolve2(null); // just to signal that the findsimilar operations for this face has been completed
                    });
                }));
            }

            //wait the unpack of all the json objects with the persistent ids
            Promise.all(waitAllPIds).then(() => {
                resolve(persistedIds);//find similar operation completed for each face -> return persisted face ids + confidence level for each face id in faceIds
            });

        });
    });
}


/*  Given an array of persisted face ids and the faceList in which to find them, return an array of
    userData related to those faces

    Note: if data are stored on azure you'll perform the azure api call GET Azure LargeFaceList Face, otherwise
    you'll retrieve them from our backend storage
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

                let promisesPersistedUserDataFaceI = []; // for each face detected you're going to perform multiple calls (one for every persisted face id)
                if(Array.isArray(persistedFaces[i])){

                    for(let j=0; j<persistedFaces[i].length; j++) {//to every face has been associate a number of candidates (retrieve user data for each one of them)
                        if (persistedFaces[i][j]['persistedFaceId'] &&
                            userDataStoredOnAzure) { // retrieve data directly from azure (not on a free tier)

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

                        } else // no persistedFaceId -> just go on
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
                                    //console.log('Adding the following p_userdata ' + persistedJSONValue['userData'] + ' for ' + persistedFaces[i][j]);
                                    persistedFaces[i][j]['userData'] = (persistedJSONValue['userData']);
                                    resolve3(null);
                                });
                            }));
                        }
                        Promise.all(unpackEverything).then( () => resolve2(null));

                    }else{
                        //console.log('Adding the following p_userdata undefined for ' + persistedFaces[i]);
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

module.exports = {  analyseRemoteImage, faceRemoteImage, analyseRemoteImageCogniSchema, createFaceGroup,
                    addToFaceGroup, patchFace, forgetFace, trainFaceGroup, findSimilar, findSimilarInBatchAnn, checkTrainingStatus};