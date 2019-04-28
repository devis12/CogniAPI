/*
*   Module which displays some utilities in order to manipulate, process and reconciliate
*   description, tags, objects and general content info related to an image in a single
*   and standard schema
*
*   @author: Devis
*/

//GOOGLE CLOUD VISION FUNCTIONS (API CALLS)
const gcloudVision = require('./gcloud_logic');
//AZURE COMPUTER VISION & AZURE FACE FUNCTIONS (API CALLS)
const azureCompVision = require('./azure_logic');

/*  Utility function in order to build a sorted array of string with tag names
*   provided a preexisted array string of tag names and an array of tag objects
*   with a property called name which is the tag name*/
function uniqueTagNames(tags, tagsConfidence){
    tags.sort();
    let tagsToAdd = [];
    let j = 0;// j = index for tagsConfidence
    let i = 0;// i = index for tags
    while(i < tags.length && j < tagsConfidence.length){
        if(tagsConfidence[j]['name'] < tags[i]){
            if(tagsConfidence[j]['name'] != tagsToAdd[tagsToAdd.length-1])
                tagsToAdd.push(tagsConfidence[j]['name']);
            j++;
        }else{
            if(tags[i] != tagsToAdd[tagsToAdd.length-1])
                tagsToAdd.push(tags[i]);
            i++;
        }
    }

    while(j < tagsConfidence.length){
        if(tagsConfidence[j]['name'] != tagsToAdd[tagsToAdd.length-1])
            tagsToAdd.push(tagsConfidence[j]['name']);
        j++;
    }

    while(i < tags.length){
        if(tags[i] != tagsToAdd[tagsToAdd.length-1])
            tagsToAdd.push(tags[i]);
        i++;
    }
    tags = tagsToAdd;
    tags.sort();
    return tags;
}

/*  Starting from google cloud vision and azure computer vision objects
    build a common description objects
* */
function buildDescriptionObj(gCloudV, azureCV){
    let categoriesArray = []; //array of categories based on the 86 taxonomy defined by Azure
    for(let category of azureCV['categories']){
        categoriesArray.push({name: category['name'],confidence: category['score']});
    }

    let tags = azureCV['description']['tags'];
    let tagsConfidence = buildTagsObj(gCloudV, azureCV, 0.0, 'name');//build tags object in order to fill better the generic_tags array

    //process to add tags retrieved in azure computer vision and google cloud vision tag fields into generic_tags
    tags = uniqueTagNames(tags, tagsConfidence);

    return {
        generic_tags: [tags],
        captions: azureCV['description']['captions'],
        categories: categoriesArray
    };
}

/*  Starting from google cloud vision and azure computer vision objects
    build a common tag objects
* */
function buildTagsObj(gCloudV, azureCV, minScore = 0.0, sortCat = 'confidence'){
    let tags = [];
    let gCloudTags = gcloudVision.filterTags(gCloudV, minScore);
    tags = tags.concat(gCloudTags['tags']);
    tags = tags.concat(gCloudTags['logos']);

    let azureTags = azureCompVision.filterTags(azureCV, minScore);
    tags = tags.concat(azureTags['tags']);

    //move all the tags name to lower case
    for(let t of tags){
        t['name'] = t['name'].toLowerCase();
    }

    // sort by sortCat
    if(sortCat == 'name')
        tags.sort((a, b) => {
            if(a[sortCat]>b[sortCat])
                return 1;
            else if(a[sortCat]==b[sortCat])
                return 0;
            else
                return -1;
        });

    else if(sortCat == 'confidence')//put highest confidence values before
        tags.sort((a, b) => {
            if(a[sortCat]>b[sortCat])
                return -1;
            else if(a[sortCat]==b[sortCat])
                return 0;
            else
                return 1;
        });

    return tags;
}

/*  Providing the object returned by azure computer vision
*   see if there is any landmarks in it and put all of them in an array*/
function azureLandmarks(azureCV){
    let landmarks = [];
    let categories = azureCV['categories'];

    for(let cat of categories){
        if( cat['detail'] && cat['detail']['landmarks']  && Array.isArray(cat['detail']['landmarks']) &&
            (cat['detail']['landmarks']).length > 0){
            for(let landmark of ((cat['detail']['landmarks']))){
                landmarks.push(landmark);
            }
        }
    }

    return landmarks;
}

/*  Starting from google cloud vision and azure computer vision objects
    build a common landmarks array
* */
function buildLandmarksObj(gCloudV, azureCV, minScore = 0.0){
    let landmarks = [];
    let gCloudLandMarks = gCloudV['landmarkAnnotations'];
    //apply standard bounding box to all the landmarks objects
    gCloudVObjsToCogniBoundingBox(gCloudLandMarks, azureCV['metadata']['width'], azureCV['metadata']['height']);
    for(let gLandMark of gCloudLandMarks){
        landmarks.push({
            name: gLandMark['description'],
            confidence: gLandMark['score'],
            latitude: gLandMark['locations'][0]['latLng']['latitude'],
            longitude: gLandMark['locations'][0]['latLng']['longitude'],
            boundingBox: gLandMark['boundingBox']
        });
    }

    let azureCVLandmarks = azureLandmarks(azureCV);
    landmarks = landmarks.concat(azureCVLandmarks);

    landmarks.sort((a, b) => {
        if(a['confidence']>b['confidence'])
            return -1;
        else if(a['confidence']==b['confidence'])
            return 0;
        else
            return 1;
    });

    return landmarks;
}


/*  Starting from google cloud vision and azure computer vision objects
    build a common objects array
* */
function buildObjectsObj(gCloudV, azureCV, minScore = 0.0){
    let objects = [];
    let gCloudObjects = gCloudV['localizedObjectAnnotations'];
    //apply standard bounding box to all the detected objects
    gCloudVObjsToCogniBoundingBox(gCloudObjects, azureCV['metadata']['width'], azureCV['metadata']['height']);
    for(let gCloudObj of gCloudObjects){
        if(gCloudObj['score'] > minScore) { //filter out unwanted tags
            objects.push({
                name: gCloudObj['name'],
                confidence: gCloudObj['score'],
                boundingBox: gCloudObj['boundingBox']
            });
        }
    }

    let azureObjects = azureCV['objects'];
    //apply standard bounding box to all the detected objects
    azureCVVObjsToCogniBoundingBox(azureObjects, azureCV['metadata']['width']);
    for(let aObj of azureObjects){
        if(aObj['confidence'] > minScore) { //filter out unwanted tags
            objects.push({
                name: aObj['object'],
                confidence: aObj['confidence'],
                boundingBox: aObj['boundingBox']
            });
        }
    }

    objects.sort((a, b) => {
        if(a['confidence']>b['confidence'])
            return -1;
        else if(a['confidence']==b['confidence'])
            return 0;
        else
            return 1;
    });

    return objects;
}

/*  Starting from google cloud vision detected texts
    build a common objects array
* */
function buildTextsObj(gCloudV, azureCV, minScore = 0.0){
    let texts = [];
    let gCloudTexts = gCloudV['textAnnotations'];
    //apply standard bounding box to all the detected objects
    gCloudVObjsToCogniBoundingBox(gCloudTexts, azureCV['metadata']['width'], azureCV['metadata']['height']);
    for(let gCloudObj of gCloudTexts){
        texts.push({
            name: gCloudObj['description'],
            confidence: gCloudObj['score'],
            boundingBox: gCloudObj['boundingBox']
        });
    }

    texts.sort((a, b) => {
        if(a['confidence']>b['confidence'])
            return -1;
        else if(a['confidence']==b['confidence'])
            return 0;
        else
            return 1;
    });

    return texts;
}

/*  Add boundingBox property to azure computer vision objects with the standard cogni bounding box schema*/
function azureCVVObjsToCogniBoundingBox(azureCVObjects, width){
    for(let aObj of azureCVObjects){
        let bl =    {   'x':    aObj['rectangle']['x'],
                        'y':    (aObj['rectangle']['y']-aObj['rectangle']['h'] > 0)? aObj['rectangle']['y']-aObj['rectangle']['h']:0
        };
        let br =    {   'x':    (aObj['rectangle']['x']+aObj['rectangle']['w']<width)? aObj['rectangle']['x']+aObj['rectangle']['w']:width,
                        'y':    (aObj['rectangle']['y']-aObj['rectangle']['h'] > 0)? aObj['rectangle']['y']-aObj['rectangle']['h']:0
        };
        let tl =    {   'x':    aObj['rectangle']['x'],
                        'y':    aObj['rectangle']['y'],
        };
        let tr =    {   'x':    (aObj['rectangle']['x']+aObj['rectangle']['w']<width)? aObj['rectangle']['x']+aObj['rectangle']['w']:width,
                        'y':    aObj['rectangle']['y'],
        };
        aObj['boundingBox'] = {
            'bl': bl, 'br': br, 'tr': tr, 'tl': tl,
            'height': +(tl['y']-bl['y']).toFixed(1), 'width': +(br['x']-bl['x']).toFixed(1)
        };
    }
}

/*  Add boundingBox property to gCloud objects with the standard cogni bounding box schema*/
function gCloudVObjsToCogniBoundingBox(gCloudObjects, width, height){
    for(let gCloudObj of gCloudObjects){
        let vertices;
        let normalized = false;

        if(gCloudObj['boundingPoly']['vertices'].length > 0)
            vertices = gCloudObj['boundingPoly']['vertices'];

        else if(gCloudObj['boundingPoly']['normalizedVertices'].length > 0) {
            vertices = gCloudObj['boundingPoly']['normalizedVertices'];
            normalized = true;
        }

        let x1 = vertices[0]['x']; // min x
        let x2 = vertices[0]['x']; // max x
        let y1 = vertices[0]['y']; // min y
        let y2 = vertices[0]['y']; // max y

        for(let point of vertices){
            x1 = Math.min(x1, point['x']);
            x2 = Math.max(x2, point['x']);
            y1 = Math.min(y1, point['y']);
            y2 = Math.max(y2, point['y']);
        }

        let bl =    {   'x':    (normalized)? +(x1 * width).toFixed(1):x1,
                        'y':    (normalized)? +(y1 * height).toFixed(1):y1
        };
        let br =    {   'x':    (normalized)? +(x2 * width).toFixed(1):x2,
                        'y':    (normalized)? +(y1 * height).toFixed(1):x1
        };
        let tl =    {   'x':    (normalized)? +(x1 * width).toFixed(1):x1,
                        'y':    (normalized)? +(y2 * height).toFixed(1):y2
        };
        let tr =    {   'x':    (normalized)? +(x2 * width).toFixed(1):x2,
                        'y':    (normalized)? +(y2 * height).toFixed(1):y2
        };
        gCloudObj['boundingBox'] = {
            'bl': bl, 'br': br, 'tr': tr, 'tl': tl,
            'height': +(tl['y']-bl['y']).toFixed(1), 'width': +(br['x']-bl['x']).toFixed(1)
        };
    }
}

module.exports = {buildDescriptionObj, buildTagsObj, buildObjectsObj, buildLandmarksObj, buildTextsObj};