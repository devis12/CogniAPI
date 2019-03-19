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
                    'y':    azureFaceRect['top'] - azureFaceRect['height']
                };
    let br =    {   'x':    azureFaceRect['left'] + azureFaceRect['width'],
                    'y':    azureFaceRect['top'] - azureFaceRect['height']
                };
    let tl =    {   'x':    azureFaceRect['left'],
                    'y':    azureFaceRect['top']
                };
    let tr =    {   'x':    azureFaceRect['left'] + azureFaceRect['width'],
                    'y':    azureFaceRect['top']
                };
    return {'bl': bl, 'br': br, 'tr': tr, 'tl': tl};
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
    return {'bl': bl, 'br': br, 'tr': tr, 'tl': tl};
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


/*
    Apply to google cloud vision faceAnnotations the same ids which azure provides for each face
*/
function matchFaces(gcloudFaces, azureFaces){
    //build a dictionary to check after in constant time if an azure face has already been taken
    let azFaceMatched = {};

    //for every face in Azure put the bounding rectangle in 4 vertex (bl, br, tl, tr)
    for(let aFace of azureFaces) {
        aFace['cogniFaceRect'] = azureFaceVertex(aFace['faceRectangle']);
        azFaceMatched[aFace['faceId']] = false;
    }

    //for every face in GCloud put the bounding rectangle in 4 vertex (bl, br, tl, tr)
    for(let gFace of gcloudFaces){
        gFace['cogniFaceRect'] = gFaceVertex(gFace['fdBoundingPoly']);
    }


    //search for every face in gcloud faceAnnotation the one in azure face with the most overlap
    for(let gFace of gcloudFaces){
        let matchId = null; //put here the azure face id value to apply to google
        let maxOverlap = 0; //overlap has to be between 0-100 as a percentage value
        for(let aFace of azureFaces){
            if(!azFaceMatched[aFace['faceId']]){ //azure face ids is not already taken
                let overLap = faceOverlap(gFace['cogniFaceRect'], aFace['cogniFaceRect']);
                if(overLap > maxOverlap){
                    maxOverlap = overLap;
                    matchId = aFace['faceId'];
                }
            }
        }
        azFaceMatched[matchId] = true;
        gFace['azureId'] = matchId;
    }

    return gcloudFaces;
}

module.exports = {matchFaces};
