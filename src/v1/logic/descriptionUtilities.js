/*
*   Module which displays some utilities in order to manipulate, process and reconciliate
*   description, tags, objects and general content info related to an image in a single
*   and standard schema
*
*   @author: Devis
*/

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
    let descr = {}; // descr obj to return

    let categoriesArray = []; //array of categories based on the 86 taxonomy defined by Azure
    let tags = []; // generic tags array

    if(azureCV) {
        for (let category of azureCV['categories']) {
            categoriesArray.push({name: category['name'], confidence: category['score']});
        }

        descr['categories'] = categoriesArray; // you can have this value just with azure cv
        descr['captions'] = azureCV['description']['captions'];// you can have this value just with azure cv

        tags = azureCV['description']['tags']; // add cv generic tags
    }

    let tagsConfidence = buildTagsObj(gCloudV, azureCV, 0.0, 'name');//build tags object in order to fill better the generic_tags array

    //process to add tags retrieved in azure computer vision and google cloud vision tag fields into generic_tags
    tags = uniqueTagNames(tags, tagsConfidence);

    descr['generic_tags'] = [tags];

    return descr;
}

/*  Utility function in order to delete unnecessary data from the tag detection and then
*   return just labels and relative scores (take only the ones which are above the minScore threshold)*/
function gcloudFilterTags(gcloudJson, minScore){

    let retObj = {};

    //landmark annotations
    retObj['landmarks'] = [];
    for(let landMarkAnn of gcloudJson['landmarkAnnotations']){
        if(Number.parseFloat(landMarkAnn['score']) > minScore)
            retObj['landmarks'].push({
                'name': landMarkAnn['description'],
                'mid': (landMarkAnn['mid'] &&  landMarkAnn['mid']!= '')? landMarkAnn['mid']: undefined,
                'confidence': Number.parseFloat(landMarkAnn['score'])});
    }

    //logo annotations
    retObj['logos'] = [];
    for(let logoAnn of gcloudJson['logoAnnotations']){
        if(Number.parseFloat(logoAnn['score']) > minScore)
            retObj['logos'].push({
                'name': logoAnn['description'],
                'mid': (logoAnn['mid'] &&  logoAnn['mid']!= '')? logoAnn['mid']: undefined,
                'confidence': Number.parseFloat(logoAnn['score'])});
    }

    //logo annotations
    retObj['tags'] = [];
    for(let labelAnn of gcloudJson['labelAnnotations']){
        if(Number.parseFloat(labelAnn['score']) > minScore)
            retObj['tags'].push({
                'name': labelAnn['description'],
                'mid': (labelAnn['mid'] &&  labelAnn['mid']!= '')? labelAnn['mid']: undefined,
                'confidence': Number.parseFloat(labelAnn['score'])});
    }

    return retObj;
}

/*  Utility function in order to delete unnecessary data from the tag detection and then
*   return just labels and relative scores (take only the ones which are above the minScore threshold)*/
function azureFilterTags(azureJson, minScore){

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


/*  Starting from google cloud vision and azure computer vision objects
    build a common tag objects
* */
function buildTagsObj(gCloudV, azureCV, minScore = 0.0, sortCat = 'confidence'){
    let tags = [];

    if(gCloudV) {
        let gCloudTags = gcloudFilterTags(gCloudV, minScore);
        tags = tags.concat(gCloudTags['tags']);
        tags = tags.concat(gCloudTags['logos']);
    }

    if(azureCV) {
        let azureTags = azureFilterTags(azureCV, minScore);
        tags = tags.concat(azureTags['tags']);
    }

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

    if(gCloudV){
        let gCloudLandMarks = gCloudV['landmarkAnnotations'];
        //apply standard bounding box to all the landmarks objects
        if(azureCV)
            gCloudVObjsToCogniBoundingBox(gCloudLandMarks, azureCV['metadata']['width'], azureCV['metadata']['height']);

        else//need to retrieve image sizes from gcloud (already done and put in the metadata tag of gcloudv with appropriate calls)
            gCloudVObjsToCogniBoundingBox(gCloudLandMarks, gCloudV['metadata']['width'], gCloudV['metadata']['height']);


        for(let gLandMark of gCloudLandMarks){
            landmarks.push({
                name: gLandMark['description'],
                mid: (gLandMark['mid'] &&  gLandMark['mid']!= '')? gLandMark['mid']: undefined,
                confidence: gLandMark['score'],
                latitude: gLandMark['locations'][0]['latLng']['latitude'],
                longitude: gLandMark['locations'][0]['latLng']['longitude'],
                boundingBox: gLandMark['boundingBox']
            });
        }
    }

    if(azureCV){
        let azureCVLandmarks = azureLandmarks(azureCV);
        landmarks = landmarks.concat(azureCVLandmarks);
    }

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
    if(gCloudV) {
        let gCloudObjects = gCloudV['localizedObjectAnnotations'];
        //apply standard bounding box to all the detected objects
        if(azureCV)
            gCloudVObjsToCogniBoundingBox(gCloudObjects, azureCV['metadata']['width'], azureCV['metadata']['height']);

        else//need to retrieve image sizes from gcloud (already done and put in the metadata tag of gcloudv with appropriate calls)
            gCloudVObjsToCogniBoundingBox(gCloudObjects, gCloudV['metadata']['width'], gCloudV['metadata']['height']);

        for (let gCloudObj of gCloudObjects) {
            if (gCloudObj['score'] > minScore) { //filter out unwanted tags
                objects.push({
                    name: gCloudObj['name'],
                    mid: (gCloudObj['mid'] &&  gCloudObj['mid']!= '')? gCloudObj['mid']: undefined,
                    confidence: gCloudObj['score'],
                    boundingBox: gCloudObj['boundingBox']
                });
            }
        }
    }

    if(azureCV){
        let azureObjects = azureCV['objects'];
        //apply standard bounding box to all the detected objects
        azureCVObjsToCogniBoundingBox(azureObjects, azureCV['metadata']['width'], azureCV['metadata']['height']);
        for(let aObj of azureObjects){
            if(aObj['confidence'] > minScore) { //filter out unwanted tags
                objects.push({
                    name: aObj['object'],
                    confidence: aObj['confidence'],
                    boundingBox: aObj['boundingBox']
                });
            }
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
    if(azureCV)
        gCloudVObjsToCogniBoundingBox(gCloudTexts, azureCV['metadata']['width'], azureCV['metadata']['height']);

    else//need to retrieve image sizes from gcloud (already done and put in the metadata tag of gcloudv with appropriate calls)
        gCloudVObjsToCogniBoundingBox(gCloudTexts, gCloudV['metadata']['width'], gCloudV['metadata']['height']);

    for(let gCloudObj of gCloudTexts){
        texts.push({
            name: gCloudObj['description'],
            confidence: gCloudObj['score'],
            locale: gCloudObj['locale'],
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

/*  Starting from google cloud vision web detection elements
    build a web detection obj
* */
function buildWebDetectionObj(gCloudV){
    let webDetection = gCloudV['webDetection'];


    return webDetection;
}

/*  Add boundingBox property to azure computer vision objects with the standard cogni bounding box schema*/
function azureCVObjsToCogniBoundingBox(azureCVObjects, width, height){
    for(let aObj of azureCVObjects){
        let bl =    {   'x':    aObj['rectangle']['x'],
                        'y':    (aObj['rectangle']['y']+aObj['rectangle']['h'] > height)? aObj['rectangle']['y']+aObj['rectangle']['h']:height
        };
        let br =    {   'x':    (aObj['rectangle']['x']+aObj['rectangle']['w'] < width)? aObj['rectangle']['x']+aObj['rectangle']['w']:width,
                        'y':    (aObj['rectangle']['y']+aObj['rectangle']['h'] > height)? aObj['rectangle']['y']+aObj['rectangle']['h']:height
        };
        let tl =    {   'x':    aObj['rectangle']['x'],
                        'y':    aObj['rectangle']['y'],
        };
        let tr =    {   'x':    (aObj['rectangle']['x']+aObj['rectangle']['w']<width)? aObj['rectangle']['x']+aObj['rectangle']['w']:width,
                        'y':    aObj['rectangle']['y'],
        };
        aObj['boundingBox'] = {
            'bl': bl, 'br': br, 'tr': tr, 'tl': tl,
            'height': +(bl['y']-tl['y']).toFixed(1), 'width': +(br['x']-bl['x']).toFixed(1)
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
            y1 = Math.max(y1, point['y']);
            y2 = Math.min(y2, point['y']);
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
            'height': +(bl['y']-tl['y']).toFixed(1), 'width': +(br['x']-bl['x']).toFixed(1)
        };
    }
}

module.exports = {buildDescriptionObj, buildTagsObj, buildObjectsObj, buildLandmarksObj, buildTextsObj, buildWebDetectionObj};