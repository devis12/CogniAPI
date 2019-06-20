/*
*   Module which call different api services in order to make the combination
*   in a unified and most useful schema.
*   Image annotations will be performed in an async way in this module, that's why it
*   differs from the combine_logic
*
*   @author: Devis
*/

//perform the request with node-fetch
const fetch = require('node-fetch');
//url for our backend storage
const backendStorage = require('../general').backendStorage;

//AZURE COMPUTER VISION & AZURE FACE FUNCTIONS (API CALLS)
const azureCompVision = require('./azure_logic');

//Face utilities in order to combine, merge & cross check data
const faceUtilities = require('./faceUtilities');

//combine logic (for single annotations) implemented in a module apart
const cogniCombine = require('../logic/combine_logic');

//time interval between different images analysis
const timeInterval = require('../general').asyncAnalysisInterval;

/*  This function will help us in order to annotate the images in an async way
*   It's the wrapper of the actual async operation
* */
function asyncImagesAnn(imgUrls, username, minScore, widgetCalling){
    return new Promise(resolve => {

        let promiseFaceGroup;
        if(username != undefined && username != ''){
            //trying creating a group faces related to the logged user
            // (if it doesn't exist) -> create it
            // if it exists -> no problem
            promiseFaceGroup = azureCompVision.createFaceGroup(username);

        }else{
            //no user logged -> no need to create or check the existence of a face group
            promiseFaceGroup = new Promise(resolve2 => resolve2(null));
        }

        promiseFaceGroup.then(() => {

            if(widgetCalling) {
                performAsyncImagesAnn(imgUrls, username, minScore, widgetCalling);
                resolve(202);//annotation process has been initiated by widget (no need for token)

            }else{//call made from api call: need to request a token to get the final result

                // requesting token to our backend storage
                requestTokenBatchAnn().then(token => {
                    resolve(token);//202 Accepted with token

                    performAsyncImagesAnn(imgUrls, username, minScore)

                        .then( imgAnnotations => {
                            // extract just cogni api img annotations
                            let cogniImgAnnotations = extractCogniImgAnnotations(imgAnnotations);

                            //put similarFaces.similarBatchFaceIds into faces objects using grouping provided by Azure Face on face ids
                            batchFacesRecognition(cogniImgAnnotations).then( () => {
                                // send the annotations encoded in base64 to our backend storage
                                // the call with the appropriate token will allow to retrieve them from it
                                encodeB64AnnotationBatch(token, cogniImgAnnotations);
                            });

                        })

                        .catch(error => {
                            console.error(error); // debugging purpose
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
                //make a combo call (azure computer vision call + gcloud vision + azure face) for each url
                annPromises.push( new Promise(resolve2 => {
                    cogniCombine.multipleAnalysisRemoteImage(imgUrls[i], username, minScore)

                        .then(data => {
                            imgAnnotations.push(data);
                            resolve2(data);

                            // JUST if the user is logged and using the widget
                            // save on the cache system on first (or later if the caching system is disabled) single img annotation
                            if(username != undefined && username != '' && widgetCalling)
                                cogniCombine.encodeB64Annotation(username, [data]);
                        })

                        .catch(dataErr => { //Annotation process for an image url has gone into error:
                            imgAnnotations.push(dataErr);
                            resolve2(dataErr);
                        });
                }));

            }, i*timeInterval);// perform calls detached at least 60-80s from one another (in order to not exceed the upper bound limit)
        }

        //when all the annotations have been launched and executed, returned them
        setTimeout(() =>
        {
            Promise.all(annPromises)
                .then(() => resolve(imgAnnotations));

        }, imgUrls.length * timeInterval);


    });
}

/*  Given an array of cogni img annotations provided after the batch analysis,
*   put in the similarFaces object of each face an array of temporary face ids (the
*   ones which last 24hrs), which contains all the face ids related to the same person
*   that has been attributed in that batch analysis.
*
*   E.g. if John Doe has been detected in two different images, without knowing that it's John Doe
*   Azure Face will give him two different temporary face ids ('xyz-123', 'vcv-445'). With this function
*   we'll make sure that in the objects describing the face of John Doe there is the array
*   similarFaces.similarBatchFaces = ['xyz-123', 'vcv-445']
* */
function batchFacesRecognition(cogniImgAnnotations){
    return new Promise((resolve, reject) => {

        //putting all faceids (retrieved in the different imgAnnotations of the batch annotation) in a unique array
        let faceIds = faceUtilities.retrieveFaceIds(cogniImgAnnotations);

        if(faceIds.length > 0) {
            azureCompVision.findSimilarInBatchAnn(faceIds)

                .then(faceIdsGrouped => {
                    faceUtilities.putSimilarBatchFaces(cogniImgAnnotations, faceIdsGrouped); // use the grouped face ids to put them inside the imgAnnotations
                    resolve(cogniImgAnnotations);
                })

                .catch( () => resolve(cogniImgAnnotations));


        }else//just return imgAnnotations as it is, because there are no face detected by Azure on which you can perform the analysis
            resolve(cogniImgAnnotations);

    });
}

/*  This function will call our backend storage to get a token which will allow to store the final
 *  results where all the annotations results will be present
 *  */
function requestTokenBatchAnn(){
    return new Promise(resolve => {
        //get current datetime in Europe/Rome GMT
        let date = new Date(new Date().toLocaleString("it-IT", {timeZone: "Europe/Rome"})); // IMPORTANT using Europe/Rome here and also in the backend storage
        let d = date.getDate();
        if(+d < 10)
            d = '0' + d;
        let h = date.getHours();
        if(+h < 10)
            h = '0' + h;

        let secret = d + 'cogni' + h; // secret pwd to pass to our backend storage in order to get a token
        //console.log('Requesting token to ' + backendStorage + 'getTokenBatchAnn.php?secret=' + secret ); // debugging purpose

        fetch(backendStorage + 'getTokenBatchAnn.php?secret=' + secret)
            .then(php_response => {
                php_response.json().then(php_JSONresp =>{
                    //console.log('Received from the server the following json obj for token'); // debugging purpose
                    //console.log(php_JSONresp); // debugging purpose
                    resolve(php_JSONresp['btoken']);
                });
            });
    });
}


/*  This function will call our backend storage to get the result json object
    of a batch annotation given the token related to it.
    FilterOn will eventually decide on which attributes you want to focus your analysis,
        - if null it'll just return the whole annotations
        - if it has a value, it could be something like 'faces', 'objects' and so on...
 *  */
function getBatchAnn(token, filterOn){
    return new Promise((resolve, reject) => {
        //console.log('Requesting with token ' + token + ' the batch annotation results'); // debugging purpose

        fetch(backendStorage + 'getBatchAnn.php?btoken=' + token)

            .then(php_response => {
                php_response.json().then(php_JSONresp =>{

                    if(php_JSONresp['json_b64']) { // batch analysis completed & ready
                        let imgAnnotations = JSON.parse(Buffer.from(php_JSONresp['json_b64'], 'base64').toString());

                        if(filterOn) //user just asked for a single field (tags, objects, description,...)
                            resolve(batchAnnFilterOn(imgAnnotations, filterOn));
                        else
                            resolve(imgAnnotations);

                    }else if(php_JSONresp['notReady'] && +php_JSONresp['notReady'] == 204) { // analysis is still processing
                        reject({responseStatus:{status: 204}});

                    }else //using bad or old token
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

                // extract imageUrl & responseStatus (independently of the attribute you want to filter on)
                let cogniImgAnn = {
                    imageUrl: imgAnn['imageUrl'],
                    responseStatus: imgAnn['responseStatus']
                };

                // field you want to filter on
                cogniImgAnn[filterOn] = imgAnn[filterOn];

                // push the filtered annotations in the result
                finalResults.push(cogniImgAnn);
            }

            return finalResults;

        }else

            return imgAnnotations;


    }else
        return [];
}

/*  FilterOnEmotion will decide which annotations to filter out based on the passed emotion
    and a given threshold emotionscore
* */
function batchAnnFilterOnEmotion(imgAnnotations, emotion){
    let imgAnnotationsFiltered = [];

    for(let imgAnn of imgAnnotations) { // iterate over all the possible image annotations

        if(imgAnn.faces && Array.isArray(imgAnn.faces) && imgAnn.faces.length > 0){

            for(let face of imgAnn.faces){ //for each image annotation iterate over all the faces detected in it, until eventually you find one which match with the requested emotion
                if( face.emotions && face.emotions[emotion] &&
                    (face.emotions[emotion] == 'LIKELY' || face.emotions[emotion] == 'VERY_LIKELY')){
                    imgAnnotationsFiltered.push(imgAnn); // found a face which match the requested emtion -> push the entire img annotation in the filtered results
                    break; // exit from the cycle and go the next imgAnn, because you found at least a face which matches the requested emotion
                }
            }

        }

    }

    return imgAnnotationsFiltered;

}


/*  Given the whole imgAnnotations array extract just the cogniAPI data (excluding gcloud, azurecv & azure face results)
* */
function extractCogniImgAnnotations(imgAnnotations){
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
    return cogniImgAnnotations;
}

/*  This function will help us in order to store the answer elaborated from the api
    encoding it in base 64.
    It's really important in the case of batch analysis, because in this way, when the analysis
    has been completed, the results could be retrieved by the user through the token he received
    in the first place.
* */
function encodeB64AnnotationBatch(token, imgAnnotations){

    let bodyReq = {
        'btoken': token, // really important since every batch annotations is identified by a unique token
        'data64': Buffer.from(JSON.stringify(imgAnnotations)).toString('base64')
    };

    fetch(backendStorage + 'updateBatchAnn.php', {
        method: 'POST',
        body: JSON.stringify(bodyReq),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(php_response => {
            //console.log('PHP response: ');console.log(php_response);
        });
}



module.exports = { asyncImagesAnn, getBatchAnn, batchAnnFilterOnEmotion};