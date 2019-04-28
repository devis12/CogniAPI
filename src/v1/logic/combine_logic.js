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
                cogniAPI: reconciliateSchema(values[0][0], values[1], values[2], minScore)
            };

            if(loggedUser){
                //add tag in case you find a similar faces, already registered by the logged user
                azureCompVision.findSimilar(
                    loggedUser,
                    jsonCombineRes.cogniAPI.faces)

                    .then(() => resolve(jsonCombineRes));
            }else
                resolve(jsonCombineRes);
        });
    });
}

/*  This function will help us in order to annotate the images and render the result*/
function imagesAnn(username, imgUrls, caching, imgAnnb64){
    return new Promise(resolve => {
        let promiseFaceGroup;
        if(username != undefined && username != ''){
            //trying creating a group faces related to the logged user (if it doesn't exist)
            promiseFaceGroup = azureCompVision.createFaceGroup(username);
        }else{
            console.log('No user logged');
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
                //console.log('\n\n\nFINAL JSON:\n');
                //console.log(JSON.stringify(data));
                if(!caching) {//save on the cache system on first (or later if the caching system is disabled) the retrieved data
                    encodeB64Annotation(username, data);
                }
                resolve(data);
            });
        });
    });
}

/*  This function will help us in order to annotate the images in an async way*/
function asyncImagesAnn(username, imgUrls){
    return new Promise(resolve => {

        let promiseFaceGroup;
        if(username != undefined && username != ''){
            //trying creating a group faces related to the logged user (if it doesn't exist)
            promiseFaceGroup = azureCompVision.createFaceGroup(username);
        }else{
            console.log('No user logged');
            promiseFaceGroup = new Promise(resolve2 => resolve2(null));
        }

        promiseFaceGroup.then(() => {
            resolve(202); //annotation process has been initiated

            for (let i=0; i<imgUrls.length; i++){

                setTimeout(()=>{
                    //for now make a combo call (azure computer vision call + gcloud vision) for each url
                    multipleAnalysisRemoteImage(imgUrls[i], username)
                        .then(data => {
                            //save on the cache system on first (or later if the caching system is disabled) the retrieved data
                            encodeB64Annotation(username, [data])
                        });
                }, i*timeInterval);//perform calls detached at least 60-80s from one another
            }

        });
    });
}

/*  This function will reconcile the schema in a unique and standard one
* */
function reconciliateSchema(gCloudVision, azureVision, azureFace, minScore){
    let cogniAPI = {};//add field for cogniAPI data

    cogniAPI['description'] = descriptionUtilities.buildDescriptionObj(gCloudVision, azureVision);
    cogniAPI['tags'] = descriptionUtilities.buildTagsObj(gCloudVision, azureVision, minScore);
    cogniAPI['objects'] = descriptionUtilities.buildObjectsObj(gCloudVision, azureVision, minScore);
    cogniAPI['landmarks'] = descriptionUtilities.buildLandmarksObj(gCloudVision, azureVision);
    cogniAPI['texts'] = descriptionUtilities.buildTextsObj(gCloudVision, azureVision);

    cogniAPI['faces'] = faceUtilities.buildFacesObj(gCloudVision['faceAnnotations'], azureFace, azureVision);

    cogniAPI['safetyAnnotation'] = safetyUtilities.buildSafetyObj(gCloudVision['safeSearchAnnotation'], azureVision['adult']);
    cogniAPI['metadata'] = azureVision['metadata'];
    cogniAPI['graphicalData'] = colorInfoUtilities.buildColorInfoObj(gCloudVision['imagePropertiesAnnotation']['dominantColors'], azureVision['color'], azureVision['imageType']);


    return cogniAPI;
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


/*  Multiple analysis of an image performed by two main services:
        -Google Cloud Vision
        -Azure Computer Vision
* */
function multipleTagsAnalysisRemoteImage(imageUrl, minScore){
    return new Promise((resolve, reject) => {
        console.log('Request tags for ' + imageUrl);
        let pGCloudV = gcloudVision.analyseRemoteImage(imageUrl, [
            {type:'LANDMARK_DETECTION'}, {type:'LOGO_DETECTION'}, {type:'LABEL_DETECTION'}]);
        let pAzureV = azureCompVision.analyseRemoteImage(imageUrl, 'Tags,Categories,Description');

        Promise.all([pGCloudV, pAzureV])
            .then( values => {

                let jsonCombineRes = {
                    annotationDate: new Date(),
                    imgUrl: imageUrl,
                    imgName: imageUrl.substr(imageUrl.lastIndexOf('/')+1),
                    gCloud: gcloudVision.filterTags(values[0], minScore),
                    azureV: azureCompVision.filterTags(values[1], minScore)
                };

                resolve(jsonCombineRes);
            })

            .catch(e => reject(e));

    });
}

module.exports = {multipleAnalysisRemoteImage, imagesAnn, asyncImagesAnn, multipleTagsAnalysisRemoteImage};