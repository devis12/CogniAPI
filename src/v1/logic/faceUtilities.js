/*
*   Module which provides functions in order to manipulate and extract data
*   from Azure Face & Google Cloud Vision FaceAnnotations provided
*   the json result returned directly from both services
*
*   @author: Devis
*/

/*  given azure face rectangle:
    width, height, top, left
    return object of vertex{bl:{x, y}, br:{x,y}, ...}
    where bl corresponds to bottom-left, br to bottom-right
    tl: top left and tr top-right
* */
function azureFaceVertex(azureFaceRect){
    let bl =    {   'x':    azureFaceRect['left'],
                    'y':    azureFaceRect['top'] + azureFaceRect['height']
                };
    let br =    {   'x':    azureFaceRect['left'] + azureFaceRect['width'],
                    'y':    azureFaceRect['top'] + azureFaceRect['height']
                };
    let tl =    {   'x':    azureFaceRect['left'],
                    'y':    azureFaceRect['top']
                };
    let tr =    {   'x':    azureFaceRect['left'] + azureFaceRect['width'],
                    'y':    azureFaceRect['top']
                };
    return {'bl': bl, 'br': br, 'tr': tr, 'tl': tl, 'height': azureFaceRect['height'], 'width': azureFaceRect['width']};
}


/*  given google face restricted (or unrestricted) rectangle:
    fdBoundingPoly -> 4 vertices
    return object of vertex{bl:{x, y}, br:{x,y}, ...}
    where bl corresponds to bottom-left, br to bottom-right
    tl: top left and tr top-right
* */
function gFaceVertex(gcloudFace){
    let x1 = gcloudFace['vertices'][0]['x']; // min x
    let x2 = gcloudFace['vertices'][0]['x']; // max x
    let y1 = gcloudFace['vertices'][0]['y']; // min y
    let y2 = gcloudFace['vertices'][0]['y']; // max y

    // remind that
    //  - x goes from 0 -> N (left -> right)
    //  - y goes from 0 -> N (top -> bottom)
    for(let point of gcloudFace['vertices']){
        x1 = Math.min(x1, point['x']);
        x2 = Math.max(x2, point['x']);
        y1 = Math.max(y1, point['y']);
        y2 = Math.min(y2, point['y']);
    }

    let bl =    {   'x':    x1,
                    'y':    y1
    };
    let br =    {   'x':    x2,
                    'y':    y1
    };
    let tl =    {   'x':    x1,
                    'y':    y2
    };
    let tr =    {   'x':    x2,
                    'y':    y2
    };
    return {'bl': bl, 'br': br, 'tr': tr, 'tl': tl, 'height': (bl['y']-tl['y']), 'width': (br['x']-bl['x'])};
}

/*  given google face & azure face rectangles unified with the metrics
    {bl, br, tl, tr} defined above calculate the percentage of the overlapped
    area in respect to gcloud rectangle
* */
function faceOverlap(gFaceRect, aFaceRect){
    //first consider the case in which the overlap is not possible, so the result is 0
    if(gFaceRect['br']['x'] < aFaceRect['bl']['x'] || gFaceRect['bl']['x'] > aFaceRect['br']['x'])//considering x
        // when the gFaceRect finished before the start of azure one (or the opposite)
        return 0;

    else if(gFaceRect['bl']['y'] < aFaceRect['tl']['y'] || gFaceRect['tl']['y'] > aFaceRect['bl']['y'])//considering y
        // when the gFaceRect finished before the start of azure one (or the opposite)
        return 0;

    else{ //there is an overlap

        // remind that
        //  - x goes from 0 -> N (left -> right)
        //  - y goes from 0 -> N (top -> bottom)
        let xc1 = Math.max(gFaceRect['bl']['x'], aFaceRect['bl']['x']);
        let xc2 = Math.min(gFaceRect['br']['x'], aFaceRect['br']['x']);
        let yc1 = Math.max(gFaceRect['bl']['y'], aFaceRect['bl']['y']);
        let yc2 = Math.min(gFaceRect['tl']['y'], aFaceRect['tl']['y']);
        let xg1 = gFaceRect['bl']['x'];
        let xg2 = gFaceRect['br']['x'];
        let yg1 = gFaceRect['bl']['y'];
        let yg2 = gFaceRect['tl']['y'];

        let areaC = (xc2-xc1) * (yc2 - yc1); //area covered by the overlapping
        let areaG = (xg2-xg1) * (yg2 - yg1); //area covered by google face

        return areaC/areaG;
    }
}

/*  Providing the object returned by azure computer vision
*   see if there is any celebrities in it and put all of them in an array*/
function azureCelebrities(azureCV){
    let celebrities = [];
    let categories = azureCV['categories'];

    for(let cat of categories){

        if( cat['detail'] && cat['detail']['celebrities'] && Array.isArray(cat['detail']['celebrities']) &&
            (cat['detail']['celebrities']).length > 0){

            for(let celebrity of ((cat['detail']['celebrities']))){ celebrities.push(celebrity);}

        }

    }

    return celebrities;
}

/*  Providing an array of celebrities with relatives face rectangle provided by azure computer vision
    see if one of them match with the face provided by azure face (compare faceRectangle values)
*   */
function checkForCelebrity(aFace, aCelebrities){
    for(let celebrity of aCelebrities){
        if( celebrity['faceRectangle']['top'] == aFace['faceRectangle']['top'] &&
            celebrity['faceRectangle']['left'] == aFace['faceRectangle']['left'] &&
            celebrity['faceRectangle']['width'] == aFace['faceRectangle']['width'] &&
            celebrity['faceRectangle']['height'] == aFace['faceRectangle']['height']
        ){
            return {'name': celebrity['name'], 'confidence': celebrity['confidence']};
        }
    }

    return undefined;
}

/*
    Apply to google cloud vision faceAnnotations the same ids which azure provides for each face
*/
function matchFaces(gcloudFaces, azureFaces, aCelebrities){
    //build a dictionary to check after in constant time if an azure face has already been taken
    let azFaceMatched = {};

    //for every face in Azure put the bounding rectangle in 4 vertex (bl, br, tl, tr)
    for(let aFace of azureFaces) {
        aFace['cogniFaceRect'] = azureFaceVertex(aFace['faceRectangle']);
        aFace['celebrity'] = checkForCelebrity(aFace, aCelebrities);
        azFaceMatched[aFace['faceId']] = false; // init with false (used it later to see it there has been found a matching on the gcloud counterpart)
    }

    //for every face in GCloud put the bounding rectangle in 4 vertex (bl, br, tl, tr)
    for(let gFace of gcloudFaces){
        gFace['cogniFaceRect'] = gFaceVertex(gFace['fdBoundingPoly']);
    }


    //search for every face in gcloud faceAnnotation the one in azure face with the most overlap
    for(let gFace of gcloudFaces){
        let matchId = null; // put here the azure face id value to apply to google face (gFace)
        let matchFace = null; // put here the azure face value which match the google one
        let maxOverlap = 0; //overlap has to be between 0-100 as a percentage value

        // debugging purpose
        //console.log('\n\nOVERLAP\nConsidering gface with tl = ' + JSON.stringify(gFace['cogniFaceRect']['tl']) + ' and br = ' + JSON.stringify(gFace['cogniFaceRect']['br']));

        for(let aFace of azureFaces){

            if(!azFaceMatched[aFace['faceId']]){ //azure face ids is not already taken
                let overLap = faceOverlap(gFace['cogniFaceRect'], aFace['cogniFaceRect']);
                if(overLap > maxOverlap){
                    //console.log('New overlap for ' + aFace['faceId'] + ' equals to ' + overLap);
                    maxOverlap = overLap;
                    matchId = aFace['faceId'];
                    matchFace = aFace;
                }
            }

        }
        azFaceMatched[matchId] = true;

        // debugging purpose
        //console.log('Overlap for ' + matchId + ' equals to ' + maxOverlap);

        // put azure face data into the gface matching one (fast retrieving later on when building the complete and final faces obj)
        gFace['azureId'] = matchId;
        gFace['azureData'] = matchFace;
    }

    return gcloudFaces;
}

/*  Used in order to build face object with a unified and standard schema
* */
function buildFacesObj(gcloudFaces, azureFaces, azureCV){

    if(gcloudFaces && azureFaces && azureCV)
        matchFaces(gcloudFaces, azureFaces, azureCelebrities(azureCV));//apply to google cloud vision faceAnnotations the same ids which azure provides for each face

    // in here the matching operations has already taken place
    return buildFacesObjComplete(gcloudFaces, azureFaces);
}

/*  Used in order to build faces object with a unified and standard schema,
    when you got annotations object from both cognitive services with them
    having recognize the same amount of faces
    (Matching Faces has already taken place at this point, so we have all the azure matching
    data for each face already in the correspondent gcloud face obj)
* */
function buildFacesObjComplete(gcloudFaces, azureFaces){
    let faces = [];
    let matchedFaces = {};

    if(gcloudFaces){ // we've data from google cloud visions
        for (let gFace of gcloudFaces) {
            let face = {};

            if(gFace['azureId']) { // there is a matching face for the considered gFace
                matchedFaces[gFace['azureId']] = true;
                populateFaceObjAzure(face, gFace['azureData']);

            }

            populateFaceObjGcloud(face, gFace);
            faces.push(face);
        }
    }


    if(azureFaces){ // there could be faces from azure not considered
        for(let aFace of azureFaces){
            if(!matchedFaces[aFace['faceId']]){ // face not been considered yet (no matching in the gcloud annotation)
                let face = {};
                matchedFaces[aFace['faceId']] = true;
                populateFaceObjAzure(face, aFace);
                faces.push(face);
            }
        }
    }

    return faces;
}

/*  Commodity function in order to translate enum gcloud likelihood values related to emotion properties into double to perform avg with azure data*/
function likelihoodToDouble(likelihood){
    if(likelihood == 'VERY_UNLIKELY')
        return 0.1;
    else if(likelihood == 'UNLIKELY')
        return 0.3;
    else if(likelihood == 'POSSIBLE')
        return 0.5;
    else if(likelihood == 'LIKELY')
        return 0.7;
    else if(likelihood == 'VERY_LIKELY')
        return 0.9;
    else//UNKNOWN or general error
        return -1;
}

/*  Commodity function in order to translate double into enum gcloud likelihood values related to emotion properties to perform avg with azure data*/
function doubletoLikelihood(confidence){
    if(confidence <= 0.2)
        return 'VERY_UNLIKELY';
    else if(confidence <= 0.4)
        return 'UNLIKELY';
    else if(confidence <= 0.6)
        return 'POSSIBLE';
    else if(confidence <= 0.8)
        return 'LIKELY';
    else if(confidence <= 1.0)
        return 'VERY_LIKELY';
    else//UNKNOWN or general error
        return 'UNKNOWN';
}

/*  Build an empty emotion json object*/
function emptyEmotionObj(){
    return {
        'anger': null,
        'contempt': null,
        'disgust': null,
        'fear': null,
        'happiness': null,
        'neutral': null,
        'sadness': null,
        'surprise': null
    };
}

/*  Given the face object (unified schema) populate it with data provided by azureFace
* */
function populateFaceObjAzure(face, azureFace){
    face['faceId'] = azureFace['faceId'];
    face['faceRectangle'] = azureFace['cogniFaceRect'];
    face['gender'] = azureFace['faceAttributes']['gender'];
    face['age'] = azureFace['faceAttributes']['age'];
    face['glasses'] = azureFace['faceAttributes']['glasses'];
    face['smile'] = azureFace['faceAttributes']['smile'];
    face['celebrity'] = azureFace['celebrity'];

    if(!face['emotions'])
        face['emotions'] = emptyEmotionObj();

    face['emotions']['anger'] = doubletoLikelihood(azureFace['faceAttributes']['emotion']['anger']);
    face['emotions']['contempt'] = doubletoLikelihood(azureFace['faceAttributes']['emotion']['contempt']);
    face['emotions']['disgust'] = doubletoLikelihood(azureFace['faceAttributes']['emotion']['disgust']);
    face['emotions']['fear'] = doubletoLikelihood(azureFace['faceAttributes']['emotion']['fear']);
    face['emotions']['happiness'] = doubletoLikelihood(azureFace['faceAttributes']['emotion']['happiness']);
    face['emotions']['neutral'] = doubletoLikelihood(azureFace['faceAttributes']['emotion']['neutral']);
    face['emotions']['sadness'] = doubletoLikelihood(azureFace['faceAttributes']['emotion']['sadness']);
    face['emotions']['surprise'] = doubletoLikelihood(azureFace['faceAttributes']['emotion']['surprise']);


    face['hair'] = azureFace['faceAttributes']['hair'];
    face['facialHair'] = azureFace['faceAttributes']['facialHair'];
    face['noise'] = azureFace['faceAttributes']['noise'];
    face['accessories'] = azureFace['faceAttributes']['accessories'];
    face['occlusion'] = azureFace['faceAttributes']['occlusion'];
    face['makeup'] = azureFace['faceAttributes']['makeup'];
    face['blurredLikelihood'] = doubletoLikelihood(azureFace['faceAttributes']['blur']['value']);
    face['underExposedLikelihood'] = doubletoLikelihood(1-azureFace['faceAttributes']['exposure']['value']);

    face['headPose'] = {};
    face['headPose']['rollAngle'] = azureFace['faceAttributes']['headPose']['roll'];
    face['headPose']['panAngle'] = azureFace['faceAttributes']['headPose']['yaw'];
    face['headPose']['tiltAngle'] = azureFace['faceAttributes']['headPose']['pitch'];

    face['landmarks'] = azureLandmarksIntoGoogle(azureFace['faceLandmarks']);

}

/*  Given the face object (unified schema) populate it with data provided by gcloud
* */
function populateFaceObjGcloud(face, gFace) {
    if (!face['faceRectangle'])
        face['faceRectangle'] = gFace['cogniFaceRect'];

    //blurred likelihood
    if (face['blurredLikelihood'])
        face['blurredLikelihood'] = doubletoLikelihood(
    (likelihoodToDouble(gFace['blurredLikelihood'])
                +
              gFace['azureData']['faceAttributes']['blur']['value']
            )
          /2);
    else
        face['blurredLikelihood'] = gFace['blurredLikelihood'];

    //exposure likelihood
    if (face['underExposedLikelihood'])
        face['underExposedLikelihood'] = doubletoLikelihood(
            (likelihoodToDouble(gFace['underExposedLikelihood'])
                        +
                      (1-gFace['azureData']['faceAttributes']['exposure']['value'])
                      )
           /2);
    else
        face['underExposedLikelihood'] = gFace['underExposedLikelihood'];


    if (!face['emotions']) {
        face['emotions'] = emptyEmotionObj();

        face['emotions']['anger'] = gFace['angerLikelihood'];
        face['emotions']['contempt'] = 'UNKNOWN';
        face['emotions']['disgust'] = 'UNKNOWN';
        face['emotions']['fear'] = 'UNKNOWN';
        face['emotions']['happiness'] = gFace['joyLikelihood'];
        face['emotions']['neutral'] = 'UNKNOWN';
        face['emotions']['sadness'] = gFace['sorrowLikelihood'];
        face['emotions']['surprise'] = gFace['surpriseLikelihood'];
    }else{

        face['emotions']['anger'] = doubletoLikelihood((gFace['azureData']['faceAttributes']['emotion']['anger'] + likelihoodToDouble(gFace['angerLikelihood']))/2);
        face['emotions']['contempt'] = (face['emotions']['contempt'])? face['emotions']['contempt']:'UNKNOWN';
        face['emotions']['disgust'] = (face['emotions']['disgust'])? face['emotions']['disgust']:'UNKNOWN';
        face['emotions']['fear'] = (face['emotions']['fear'])? face['emotions']['fear']:'UNKNOWN';
        face['emotions']['happiness'] = doubletoLikelihood((gFace['azureData']['faceAttributes']['emotion']['happiness'] + likelihoodToDouble(gFace['joyLikelihood']))/2);
        face['emotions']['neutral'] = (face['emotions']['neutral'])? face['emotions']['neutral']:'UNKNOWN';
        face['emotions']['sadness'] = doubletoLikelihood((gFace['azureData']['faceAttributes']['emotion']['sadness'] + likelihoodToDouble(gFace['sorrowLikelihood']))/2);
        face['emotions']['surprise'] = doubletoLikelihood((gFace['azureData']['faceAttributes']['emotion']['surprise'] + likelihoodToDouble(gFace['surpriseLikelihood']))/2);
    }

    //consider in every case headPose and lanmarks provided by google cloud better than the ones provided by azure
    face['headPose'] = {};
    face['headPose']['rollAngle'] = gFace['rollAngle'];
    face['headPose']['panAngle'] = gFace['panAngle'];
    face['headPose']['tiltAngle'] = gFace['tiltAngle'];

    face['landmarks'] = gFace['landmarks'];
}

/*  This function will return the face landmarks provided by azure face into the
*   google cloud ones by matching the similar ones.
*   Google Cloud Vision landmarks are preferable because it gives you more fields and
*   data for landmark (also z for depth, and not just x and y coordinates)*/
function azureLandmarksIntoGoogle(aFaceLandmarks){
    return [
        {type: 'LEFT_EYE_PUPIL', position: aFaceLandmarks['pupilLeft']},
        {type: 'RIGHT_EYE_PUPIL', position: aFaceLandmarks['pupilRight']},
        {type: 'NOSE_TIP', position: aFaceLandmarks['noseTip']},
        {type: 'MOUTH_LEFT', position: aFaceLandmarks['mouthLeft']},
        {type: 'MOUTH_RIGHT', position: aFaceLandmarks['mouthRight']},
        {type: 'LEFT_OF_LEFT_EYEBROW', position: aFaceLandmarks['eyebrowLeftOuter']},
        {type: 'RIGHT_OF_LEFT_EYEBROW', position: aFaceLandmarks['eyebrowLeftInner']},
        {type: 'LEFT_EYE_LEFT_CORNER', position: aFaceLandmarks['eyeLeftOuter']},
        {type: 'LEFT_EYE_RIGHT_CORNER', position: aFaceLandmarks['eyeLeftInner']},
        {type: 'LEFT_EYE_TOP_BOUNDARY', position: aFaceLandmarks['eyeLeftTop']},
        {type: 'LEFT_EYE_BOTTOM_BOUNDARY', position: aFaceLandmarks['eyeLeftBottom']},
        {type: 'LEFT_OF_RIGHT_EYEBROW', position: aFaceLandmarks['eyebrowRightOuter']},
        {type: 'RIGHT_OF_RIGHT_EYEBROW', position: aFaceLandmarks['eyebrowRightInner']},
        {type: 'RIGHT_EYE_LEFT_CORNER', position: aFaceLandmarks['eyeRightOuter']},
        {type: 'RIGHT_EYE_RIGHT_CORNER', position: aFaceLandmarks['eyeRightInner']},
        {type: 'RIGHT_EYE_TOP_BOUNDARY', position: aFaceLandmarks['eyeRightTop']},
        {type: 'RIGHT_EYE_BOTTOM_BOUNDARY', position: aFaceLandmarks['eyeRightBottom']},
        {   type: 'UPPER_LIP',
            position: {
                x: +((aFaceLandmarks['upperLipTop']['x'] + aFaceLandmarks['upperLipBottom']['x'])/2).toFixed(1),
                y: +((aFaceLandmarks['upperLipTop']['y'] + aFaceLandmarks['upperLipBottom']['y'])/2).toFixed(1)
            }
        },
        {   type: 'LOWER_LIP',
            position: {
                x: +((aFaceLandmarks['underLipTop']['x'] + aFaceLandmarks['underLipBottom']['x'])/2).toFixed(1),
                y: +((aFaceLandmarks['underLipTop']['y'] + aFaceLandmarks['underLipBottom']['y'])/2).toFixed(1)
            }
        }
    ];
}

/*  Given an array of imageAnnotations (e.g. after a batch analysis)
    provide an array with all the temporary faceIds supplied by Azure Face
* */
function retrieveFaceIds(imgAnnotations){
    if(imgAnnotations && Array.isArray(imgAnnotations)){
        let faceIds = [];
        for(let imgAnn of imgAnnotations){

            if(imgAnn.faces && Array.isArray(imgAnn.faces)){

                for(let face of imgAnn.faces){
                    if(face.faceId)
                        faceIds.push(face.faceId);
                }

            }
        }

        return faceIds;

    }else
        return [];
}

/*  Given an array of imageAnnotations (e.g. after a batch analysis)
    and the array of array with faceIds grouped by Azure Face
    put the right data in the faces json obj inside similarFaces.similarBatchFaceIds
* */
function putSimilarBatchFaces(imgAnnotations, faceIdsGrouped){
    if(imgAnnotations && Array.isArray(imgAnnotations)){

        for(let imgAnn of imgAnnotations){

            if(imgAnn.faces && Array.isArray(imgAnn.faces)){

                for(let face of imgAnn.faces){
                    if(face.faceId){
                        if(!face['similarFaces'])
                            face['similarFaces'] = {};

                        face['similarFaces']['similarBatchFaceIds'] = groupOfBatchFaceIds(face.faceId, faceIdsGrouped);

                    }
                }

            }
        }
    }
}

/*  Given a face id and the array of array with faceIds grouped by Azure Face
    return the one containing faceId, if there is not return an empty []
* */
function groupOfBatchFaceIds(faceId, faceIdsGrouped){
    if(faceId && faceIdsGrouped && Array.isArray(faceIdsGrouped)){

        for(let faceIdsG of faceIdsGrouped){
            if(Array.isArray(faceIdsG)){
                for(let faceIdinG of faceIdsG){
                    if(faceIdinG == faceId)
                        return faceIdsG;
                }
            }
        }

        return []; // not found

    }else
        return [];
}

module.exports = {buildFacesObj, retrieveFaceIds, putSimilarBatchFaces};
