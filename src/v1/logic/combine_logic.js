/*
*   Module which call the api different services in order to make the combination
*   in a unified and most useful schema
*
*   @author: Devis
*/

//perform the request with node-fetch
const fetch = require('node-fetch');
//url for our backend storage
const backendStorage = require('../general').backendStorage;

//GOOGLE CLOUD VISION FUNCTIONS (API CALLS)
const gcloudVision = require('./gcloud_logic');
//AZURE COMPUTER VISION & AZURE FACE FUNCTIONS (API CALLS)
const azureCompVision = require('./azure_logic');

//description tags utilities
const descriptionUtilities = require('./descriptionUtilities');

//Face utilities in order to combine, merge & cross check data
const faceUtilities = require('./faceUtilities');

//safety tags utilities
const safetyUtilities = require('./safetyUtilities');

//colorinfo tags utilities
const colorInfoUtilities = require('./colorInfoUtilities');

//time interval between different images analysis
const timeInterval = require('../general').asyncAnalysisInterval;

/*  Multiple analysis of an image performed by three main services:
        -Google Cloud Vision
        -Azure Computer Vision
        -Azure Face
* */
function multipleAnalysisRemoteImage(imageUrl, loggedUser, minScore = 0.0){
    return new Promise((resolve, reject) => {
        console.log('Request for ' + imageUrl + ' logged as ' + loggedUser);
        let pGCloudV = gcloudVision.analyseRemoteImage(imageUrl);
        let pAzureF = azureCompVision.faceRemoteImage(imageUrl);
        let pAzureV = azureCompVision.analyseRemoteImage(imageUrl);

        Promise.all([pGCloudV, pAzureV, pAzureF]).then( values => {

            let jsonCombineRes = {
                annotationDate: new Date(),
                imgUrl: imageUrl,
                imgName: imageUrl.substr(imageUrl.lastIndexOf('/')+1),
                gCloud: values[0],
                azureV: values[1],
                azureF: values[2],
                cogniAPI: reconciliateSchema(imageUrl, values[0][0], values[1], values[2], minScore)
            };

            if(loggedUser){
                //add tag in case you find a similar faces, already registered by the logged user
                azureCompVision.findSimilar(
                    loggedUser,
                    jsonCombineRes.cogniAPI.faces)

                    .then(() => resolve(jsonCombineRes));
            }else
                resolve(jsonCombineRes);


        }).catch( err_values => {
            err_values['imageUrl'] = imageUrl;
            console.log('Rejecting ');console.log(err_values);
            reject(err_values);
        });

    });
}

/*  This function will reconcile the schema in a unique and standard one
* */
function reconciliateSchema(imageUrl, gCloudVision, azureVision, azureFace, minScore){
    let cogniAPI = {};//add field for cogniAPI data

    cogniAPI['imageUrl'] = imageUrl;
    cogniAPI['description'] = descriptionUtilities.buildDescriptionObj(gCloudVision, azureVision);
    cogniAPI['tags'] = descriptionUtilities.buildTagsObj(gCloudVision, azureVision, minScore);
    cogniAPI['objects'] = descriptionUtilities.buildObjectsObj(gCloudVision, azureVision, minScore);
    cogniAPI['landmarks'] = descriptionUtilities.buildLandmarksObj(gCloudVision, azureVision);
    cogniAPI['texts'] = descriptionUtilities.buildTextsObj(gCloudVision, azureVision);
    cogniAPI['webDetection'] = descriptionUtilities.buildWebDetectionObj(gCloudVision);

    cogniAPI['faces'] = faceUtilities.buildFacesObj(gCloudVision['faceAnnotations'], azureFace, azureVision);

    cogniAPI['safetyAnnotations'] = safetyUtilities.buildSafetyObj(gCloudVision['safeSearchAnnotation'], azureVision['adult']);
    cogniAPI['metadata'] = azureVision['metadata'];
    cogniAPI['graphicalData'] = colorInfoUtilities.buildColorInfoObj(gCloudVision['imagePropertiesAnnotation']['dominantColors'], azureVision['color'], azureVision['imageType']);

    cogniAPI['responseStatus'] = {
        status: 200,
        code: 'OK',
        msg: 'Analysis has been successfully performed'
    };

    return cogniAPI;
}

/*  This function will help us in order to annotate the images and render the result*/
function imagesAnn(imgUrls, username, caching, imgAnnb64){
    return new Promise((resolve, reject) => {

        let promiseFaceGroup;
        if(username != undefined && username != '' && !caching){
            //trying creating a group faces related to the logged user (if it doesn't exist)
            promiseFaceGroup = azureCompVision.createFaceGroup(username);

        }else{// no user logged or just browsing through the cached results presented by the widget
            promiseFaceGroup = new Promise(resolve2 => resolve2(null));
        }

        promiseFaceGroup.then(() => {
            let imgAnnotationPromises = [];
            for (let url of imgUrls){
                if(!caching){//recover json object from previous cached data
                    //for now make a combo call (azure computer vision call + gcloud vision) for each url
                    imgAnnotationPromises.push(multipleAnalysisRemoteImage(url, username));//p will handle annotate api node-fetch call)
                }else{
                    imgAnnotationPromises.push(new Promise(resolve =>{
                        resolve(JSON.parse(
                            Buffer.from(imgAnnb64, 'base64').toString()
                        ));
                    }));
                }
            }

            Promise.all(imgAnnotationPromises).then(data => { //format json object with result

                if(username != undefined && username != '' && !caching) {//save on the cache system on first (or later if the caching system is disabled) the retrieved data
                    encodeB64Annotation(username, data);
                }

                resolve(data);

            }).catch( err_values => reject(err_values));

        });
    });
}

/*  This function will help us in order to annotate the images in an async way
*   It's the wrapper of the actual async operation
* */
function asyncImagesAnn(imgUrls, username, minScore, widgetCalling){
    return new Promise(resolve => {

        let promiseFaceGroup;
        if(username != undefined && username != ''){
            //trying creating a group faces related to the logged user (if it doesn't exist)
            promiseFaceGroup = azureCompVision.createFaceGroup(username);

        }else{//no user logged
            promiseFaceGroup = new Promise(resolve2 => resolve2(null));
        }

        promiseFaceGroup.then(() => {
            if(widgetCalling) {
                performAsyncImagesAnn(imgUrls, username, minScore, widgetCalling);
                resolve(202);//annotation process has been initiated by widget (no need for token)

            }else{//call made from api call: need to request a token to get the final result
                // requesting token
                requestTokenBatchAnn().then(token => {
                    resolve(token);//202 Accepted with token

                    performAsyncImagesAnn(imgUrls, username, minScore)

                        .then( imgAnnotations => {
                            encodeB64AnnotationBatch(token, imgAnnotations);
                        })

                        .catch(error => {
                            console.log(error);
                        });

                });

            }

        });
    });
}

/*  This function will help us in order to annotate the images in an async way*/
function performAsyncImagesAnn(imgUrls, username, minScore, widgetCalling){
    return new Promise((resolve, reject) => {

        let annPromises = [];
        let imgAnnotations = [];

        for (let i=0; i<imgUrls.length; i++){

            setTimeout(()=>{
                //for now make a combo call (azure computer vision call + gcloud vision) for each url
                annPromises.push( new Promise(resolve2 => {
                    multipleAnalysisRemoteImage(imgUrls[i], username, minScore)

                        .then(data => {
                            imgAnnotations.push(data);
                            resolve2(data);
                            //save on the cache system on first (or later if the caching system is disabled) the retrieved data
                            if(username != undefined && username != '' && widgetCalling)
                                encodeB64Annotation(username, [data]);
                        })

                        .catch(dataErr => {
                            console.log('Annotation process in async operations has gone into error:');
                            console.log(dataErr);
                            imgAnnotations.push(dataErr);
                            resolve2(dataErr);
                        });
                }));

            }, i*timeInterval);//perform calls detached at least 60-80s from one another
        }

        //when all the annotations have been performed
        setTimeout(() => {
            Promise.all(annPromises)
                .then(() => resolve(imgAnnotations))

        }, imgUrls.length * timeInterval);


    });
}

/*  This function will call the db management service to get a token which will allow to store the final
    results where all the annotations will be performed
 *  */
function requestTokenBatchAnn(){
    return new Promise(resolve => {
        let date = new Date();
        let d = date.getDate();
        if(+d < 10)
            d = '0' + d;
        let h = date.getHours();
        if(+h < 10)
            h = '0' + h;

        let secret = d + 'cogni' + h;
        //console.log('Requesting token to ' + backendStorage + 'getTokenBatchAnn.php?secret=' + secret );
        fetch(backendStorage + 'getTokenBatchAnn.php?secret=' + secret)
            .then(php_response => {
                php_response.json().then(php_JSONresp =>{
                    //console.log('Received from the server the following json obj for token');
                    //console.log(php_JSONresp);
                    resolve(php_JSONresp['btoken']);
                });
            });
    });
}


/*  This function will call the db management service to get the result json object
    of a batch annotation given the token related to it.
    FilterOn will eventually decide on which attributes you want to focus your analysis,
        - if null it'll just return the whole annotations
        - if it has a value, it could be something like 'faces', 'objects' and so on...
 *  */
function getBatchAnn(token, filterOn){
    return new Promise((resolve, reject) => {

        //console.log('Requesting with token ' + token + ' the batch annotation results');
        fetch(backendStorage + 'getBatchAnn.php?btoken=' + token)
            .then(php_response => {
                php_response.json().then(php_JSONresp =>{

                    if(php_JSONresp['json_b64']) {
                        //console.log('Received from the server the following json obj for token');
                        let imgAnnotations = JSON.parse(Buffer.from(php_JSONresp['json_b64'], 'base64').toString());
                        //console.log(imgAnnotations);

                        if(filterOn)
                            resolve(batchAnnFilterOn(imgAnnotations, filterOn));
                        else
                            resolve(imgAnnotations);

                    }else if(php_JSONresp['notReady'] && +php_JSONresp['notReady'] == 204) {
                        //console.log('Analysis has not been completed yet');
                        reject({responseStatus:{status: 204}});

                    }else
                        reject(
                            {   responseStatus: {
                                    status: 404,
                                    msg: 'Bad or Broken token: there is no results related to it',
                                    code: 'Not Found'
                                }
                            });
                });
            });
    });
}

/*  FilterOn will decide on which attributes you want to focus your analysis:
    it could be something like 'faces', 'objects' and so on...
* */
function batchAnnFilterOn(imgAnnotations, filterOn){
    if(imgAnnotations && Array.isArray(imgAnnotations)){
        if(filterOn){

            let finalResults = [];
            for(let imgAnn of imgAnnotations) {
                let cogniImgAnn = {
                    imageUrl: imgAnn['imageUrl'],
                    responseStatus: imgAnn['responseStatus']
                };
                cogniImgAnn[filterOn] = imgAnn[filterOn];
                finalResults.push(cogniImgAnn);
            }

            return finalResults;

        }else

            return imgAnnotations;


    }else
        return {};
}

/*  FilterOn will decide on which attributes you want to focus your analysis:
    it could be something like 'faces', 'objects' and so on...
* */
function batchAnnFilterOn(imgAnnotations, filterOn){
    if(imgAnnotations && Array.isArray(imgAnnotations)){
        if(filterOn){

            let finalResults = [];
            for(let imgAnn of imgAnnotations) {
                let cogniImgAnn = {
                    imageUrl: imgAnn['imageUrl'],
                    responseStatus: imgAnn['responseStatus']
                };
                cogniImgAnn[filterOn] = imgAnn[filterOn];
                finalResults.push(cogniImgAnn);
            }

            return finalResults;

        }else

            return imgAnnotations;


    }else
        return {};
}

/*  FilterOnEmotion will decide which annotations to filter out based on the pass emotion
    and a given threshold emotionscore
* */
function batchAnnFilterOnEmotion(imgAnnotations, emotion, emotionScore){
    let imgAnnotationsFiltered = [];

    for(let imgAnn of imgAnnotations) {
        if(imgAnn.faces && Array.isArray(imgAnn.faces) && imgAnn.faces.length > 0){
            for(let face of imgAnn.faces){
                if( face.emotions && face.emotions[emotion] &&
                    face.emotions[emotion]['confidence'] > emotionScore){
                    imgAnnotationsFiltered.push(imgAnn);
                    break; // exit from the cycle and go the next imgAnn, because you found at least a face which matches the requested emotion
                }
            }
        }

    }

    return imgAnnotationsFiltered;

}

/*  This function will help us in order to store the answer elaborated from the api
    encoding it in base 64 for future development & analysis (a sort of caching system. necessary for batch analysis)
* */
function encodeB64AnnotationBatch(token, imgAnnotations){
    let cogniImgAnnotations = [];

    for(let imgAnn of imgAnnotations) {

        if(imgAnn['cogniAPI'])
            cogniImgAnnotations.push(imgAnn['cogniAPI']);

        else//annotation has gone into error
            cogniImgAnnotations.push({
                imageUrl: imgAnn['imageUrl'],
                responseStatus:  imgAnn['responseStatus']
            });

    }

    //console.log('loading to cognidb the following json (token = ' + token + ')');
    //console.log(cogniImgAnnotations);

    let bodyReq = {
        'btoken': token,
        'data64': Buffer.from(JSON.stringify(cogniImgAnnotations)).toString('base64')
    };

    fetch(backendStorage + 'updateBatchAnn.php', {
        method: 'POST',
        body: JSON.stringify(bodyReq),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(php_response => {
        //console.log('PHP response: ');console.log(php_response);
    });
}

/*  This function will help us in order to store the answer elaborated from the api
    encoding it in base 64 for future development & analysis (a sort of caching system)
* */
function encodeB64Annotation(username, imgAnnotations){
    for(let imgAnn of imgAnnotations){
        let bodyReq = {
            'username':   username,
            'img_url':    imgAnn['imgUrl'],
            'data64': Buffer.from(JSON.stringify({
                'annotationDate':imgAnn['annotationDate'],
                'imgUrl':imgAnn['imgUrl'],
                'imgName':imgAnn['imgName'],
                'gCloud':imgAnn['gCloud'],
                'azureV':imgAnn['azureV'],
                'azureF':imgAnn['azureF'],
                'cogniAPI':imgAnn['cogniAPI']
            })).toString('base64')
        };

        fetch(backendStorage + 'updateImgData.php', {
            method: 'POST',
            body: JSON.stringify(bodyReq),
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(php_response => {
            php_response.json().then(php_JSONresp =>{
                //console.log('PHP response: ');console.log(php_response); console.log(php_JSONresp);
            });
        });
    }
}


module.exports = {multipleAnalysisRemoteImage, imagesAnn, asyncImagesAnn, getBatchAnn, batchAnnFilterOnEmotion};