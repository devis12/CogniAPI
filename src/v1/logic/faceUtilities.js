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
                    'y':    ((azureFaceRect['top'] - azureFaceRect['height']) > 0)? (azureFaceRect['top'] - azureFaceRect['height']) : 0
                };
    let br =    {   'x':    azureFaceRect['left'] + azureFaceRect['width'],
                    'y':    ((azureFaceRect['top'] - azureFaceRect['height']) > 0)? (azureFaceRect['top'] - azureFaceRect['height']) : 0
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
    for(let point of gcloudFace['vertices']){
        x1 = Math.min(x1, point['x']);
        x2 = Math.max(x2, point['x']);
        y1 = Math.min(y1, point['y']);
        y2 = Math.max(y2, point['y']);
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
    return {'bl': bl, 'br': br, 'tr': tr, 'tl': tl, 'height': (tl['y']-bl['y']), 'width': (br['x']-bl['x'])};
}

/*  given google face & azure face rectangles unified with the metrics
    {bl, br, tl, tr} defined above calculate the percentage of the overlapped
    area in respect to gloud rectangle
* */
function faceOverlap(gFaceRect, aFaceRect){
    //first consider case in which the overlap is not possible, so the result is 0
    if(gFaceRect['br']['x'] < aFaceRect['bl']['x'] || gFaceRect['bl']['x'] > aFaceRect['br']['x'])//considering x
        return 0;

    else if(gFaceRect['bl']['y'] > aFaceRect['tl']['y'] || gFaceRect['tl']['y'] < aFaceRect['bl']['y'])//considering y
        return 0;

    else{ //there is an overlap
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
        if( cat['detail'] && cat['detail']['celebrities']  && Array.isArray(cat['detail']['celebrities']) &&
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
        azFaceMatched[aFace['faceId']] = false;
    }

    //for every face in GCloud put the bounding rectangle in 4 vertex (bl, br, tl, tr)
    for(let gFace of gcloudFaces){
        gFace['cogniFaceRect'] = gFaceVertex(gFace['fdBoundingPoly']);
    }


    //search for every face in gcloud faceAnnotation the one in azure face with the most overlap
    for(let gFace of gcloudFaces){
        let matchId = null; //put here the azure face id value to apply to google
        let matchFace = null; //put here the azure face value which match the google one
        let maxOverlap = 0; //overlap has to be between 0-100 as a percentage value
        for(let aFace of azureFaces){

            if(!azFaceMatched[aFace['faceId']]){ //azure face ids is not already taken
                let overLap = faceOverlap(gFace['cogniFaceRect'], aFace['cogniFaceRect']);
                if(overLap > maxOverlap){
                    maxOverlap = overLap;
                    matchId = aFace['faceId'];
                    matchFace = aFace;
                }
            }

        }
        azFaceMatched[matchId] = true;
        gFace['azureId'] = matchId;
        gFace['azureData'] = matchFace;
    }

    return gcloudFaces;
}

/*  Used in order to build face object with a unified and standard schema
* */
function buildFacesObj(gcloudFaces, azureFaces, azureCV){

    //apply to google cloud vision faceAnnotations the same ids which azure provides for each face
    matchFaces(gcloudFaces, azureFaces, azureCelebrities(azureCV));

    // in here the matching operations has already taken place
    return buildFacesObjComplete(gcloudFaces, azureFaces);
}

/*  Used in order to build face object with a unified and standard schema,
    when you got annotations object from both cognitive services with them
    having recognize the same amount of faces
* */
function buildFacesObjComplete(gcloudFaces, azureFaces){
    let faces = [];
    let matchedFaces = {};
    for (let gFace of gcloudFaces) {
        let face = {};

        if(gFace['azureId']) { // there is a matching face for the considered gFace
            matchedFaces[gFace['azureId']] = true;
            populateFaceObjAzure(face, gFace['azureData']);

        }

        populateFaceObjGcloud(face, gFace);
        faces.push(face);
    }

    if(gcloudFaces.length != azureFaces.length){ // there could be faces from azure not considered
        for(let aFace of azureFaces){
            if(!matchedFaces[aFace['faceId']]){ // face not been considered yet
                let face = {};
                matchedFaces[aFace['faceId']] = true;
                populateFaceObjAzure(face, aFace);
                faces.push(face);
            }
        }
    }

    return faces;
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

    face['emotions']['anger']['confidence'] = azureFace['faceAttributes']['emotion']['anger'];
    face['emotions']['contempt']['confidence'] = azureFace['faceAttributes']['emotion']['contempt'];
    face['emotions']['disgust']['confidence'] = azureFace['faceAttributes']['emotion']['disgust'];
    face['emotions']['fear']['confidence'] = azureFace['faceAttributes']['emotion']['fear'];
    face['emotions']['happiness']['confidence'] = azureFace['faceAttributes']['emotion']['happiness'];
    face['emotions']['neutral']['confidence'] = azureFace['faceAttributes']['emotion']['neutral'];
    face['emotions']['sadness']['confidence'] = azureFace['faceAttributes']['emotion']['sadness'];
    face['emotions']['surprise']['confidence'] = azureFace['faceAttributes']['emotion']['surprise'];

    face['hair'] = azureFace['faceAttributes']['hair'];
    face['facialHair'] = azureFace['faceAttributes']['facialHair'];
    face['noise'] = azureFace['faceAttributes']['noise'];
    face['accessories'] = azureFace['faceAttributes']['accessories'];
    face['occlusion'] = azureFace['faceAttributes']['occlusion'];
    face['makeup'] = azureFace['faceAttributes']['makeup'];
    face['blur'] = azureFace['faceAttributes']['blur'];
    face['exposure'] = azureFace['faceAttributes']['exposure'];

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

    if (!face['blur'])
        face['blur'] = {};
    face['blur']['blurredLikelihood'] = gFace['blurredLikelihood'];

    if (!face['exposure'])
        face['exposure'] = {};
    face['exposure']['underExposedLikelihood'] = gFace['underExposedLikelihood'];

    if (!face['emotions'])
        face['emotions'] = emptyEmotionObj();
    face['emotions']['anger']['confidenceLabel'] = gFace['angerLikelihood'];
    face['emotions']['contempt']['confidenceLabel'] = undefined;
    face['emotions']['disgust']['confidenceLabel'] = undefined;
    face['emotions']['fear']['confidenceLabel'] = undefined;
    face['emotions']['happiness']['confidenceLabel'] = gFace['joyLikelihood'];
    face['emotions']['neutral']['confidenceLabel'] = undefined;
    face['emotions']['sadness']['confidenceLabel'] = gFace['sorrowLikelihood'];
    face['emotions']['surprise']['confidenceLabel'] = gFace['surpriseLikelihood'];

    //consider in every case headPose and lanmarks provided by google cloud better than the ones provided by azure
    face['headPose'] = {};
    face['headPose']['rollAngle'] = gFace['rollAngle'];
    face['headPose']['panAngle'] = gFace['panAngle'];
    face['headPose']['tiltAngle'] = gFace['tiltAngle'];

    face['landmarks'] = gFace['landmarks'];
}

/*  Build an empty emotion json object*/
function emptyEmotionObj(){
    return {
        'anger': {},
        'contempt': {},
        'disgust': {},
        'fear': {},
        'happiness': {},
        'neutral': {},
        'sadness': {},
        'surprise': {}
    };
}

/*  This function will return the face landmarks provided by azure face into the
*   google cloud ones by matching the similar ones and put them the google cloud label.
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

module.exports = {matchFaces, buildFacesObj};
