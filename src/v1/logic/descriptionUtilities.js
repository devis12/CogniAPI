/*
*   Module which displays some utilities in order to manipulate, process and reconcile
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

    //inserting all the tags in tagsToAdd in a sorted way
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

    // tags.sort(); // this won't be necessary
    return tags;
}

/*  Starting from google cloud vision and azure computer vision objects
    build a common description objects
* */
function buildDescriptionObj(gCloudV, azureCV){
    let descr = {}; // descr obj to return

    let categoriesArray = []; //array of categories based on the 86 taxonomy defined by Azure
    let tags = []; // generic tags array

    if(azureCV) { // in case we get azure CV data, get categories and captions

        for (let category of azureCV['categories']) {
            categoriesArray.push({name: category['name'], confidence: category['score']});
        }

        descr['categories'] = categoriesArray; // you can have this value just with azure cv
        descr['captions'] = azureCV['description']['captions'];// you can have this value just with azure cv

        tags = azureCV['description']['tags']; // add cv generic tags
    }

    let tagsConfidence = buildTagsObj(gCloudV, azureCV, 0.0, 'name');//build tags object in order to fill better the generic_tags array

    //process to add tags retrieved in azure computer vision and google cloud vision tag fields into generic_tags (just tag names)
    tags = uniqueTagNames(tags, tagsConfidence);

    descr['generic_tags'] = tags;

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

/*  Given an array of tags combine the ones with the same name averaging the confidence values */
function combineTagsArray(tags){
    //move all the tags name to lower case
    for(let t of tags){
        t['name'] = t['name'].toLowerCase();
    }

    // sort by name
    tags.sort((a, b) => {
        if(a['name']>b['name'])
            return 1;
        else if(a['name']==b['name'])
            return 0;
        else
            return -1;
    });

    let tags_combine = []; // combine multiple occurences by averaging the confidence scores

    //combine multiple tags with same name in a single one
    for(let i=0; i<tags.length-1; i++){
        let t = tags[i];

        let total_confidence = tags[i]['confidence'];//confidence sum in order to compute the avg
        let num_of_tags = 1;//num of taken tags in order to compute the avg

        while(i<tags.length-1 && tags[i]['name']==tags[i+1]['name']){
            if(!tags[i]['mid'] && tags[i+1]['mid'] != null) // don't drop the mid value
                t['mid'] = tags[i+1]['mid'];

            total_confidence += tags[i+1]['confidence'];
            num_of_tags++;

            i++;
        }

        t['confidence'] = total_confidence/num_of_tags;
        tags_combine.push(t);
    }

    return tags_combine;
}

/*  Starting from google cloud vision and azure computer vision objects
    build a common tag objects (given also a minimum confidence threshold)
* */
function buildTagsObj(gCloudV, azureCV, minScore = 0.0, sortCat = 'confidence'){
    let tags = [];

    if(gCloudV) { // google cloud vision results are available
        let gCloudTags = gcloudFilterTags(gCloudV, minScore);
        tags = tags.concat(gCloudTags['tags']);
        tags = tags.concat(gCloudTags['logos']);
    }

    if(azureCV) {  // azure computer vision results are available
        let azureTags = azureFilterTags(azureCV, minScore);
        tags = tags.concat(azureTags['tags']);
    }

    tags = combineTagsArray(tags);// build an array where labels regarding the same exact tags are combined with averaged confidence + order by name


    if(sortCat == 'confidence')//put highest confidence values before
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

/*  Given an array of landmarks combine the ones with the same name averaging the confidence values and sort them by name */
function combineLandmarksArray(landmarks){
    let landmarks_combine = []; // combine multiple occurences by averaging the confidence scores
    // sort by name
    landmarks.sort((a, b) => {
        if(a['name']>b['name'])
            return 1;
        else if(a['name']==b['name'])
            return 0;
        else
            return -1;
    });
    //combine multiple tags with same name in a single one
    for(let i=0; i<landmarks.length-1; i++){
        let l = landmarks[i];
        if(landmarks[i]['name'].toLowerCase()==landmarks[i+1]['name'].toLowerCase()){

            //basically all needed checks in order to select the gcloud obj and just make the avg with the tag offered by azure

            if(!landmarks[i]['mid'] && landmarks[i+1]['mid'] != null ) // don't drop mid value
                l['mid'] = tags[i+1]['mid'];

            if(!landmarks[i]['latitude'] && landmarks[i+1]['latitude'] != null ) //don't drop latitude value
                l['latitude'] = tags[i+1]['latitude'];

            if(!landmarks[i]['longitude'] && landmarks[i+1]['longitude'] != null ) //don't drop longitude value
                l['longitude'] = tags[i+1]['longitude'];

            if(!landmarks[i]['boundingBox'] && landmarks[i+1]['boundingBox'] != null ) //don't drop latitude value
                l['boundingBox'] = tags[i+1]['boundingBox'];

            l['confidence'] = (landmarks[i]['confidence'] + landmarks[i+1]['confidence'])/2;
            i++;// landmarks[i] and landmarks[i+1] are already combined in a single obj
        }
        landmarks_combine.push(l);
    }

    return landmarks_combine;
}

/*  Providing the object returned by azure computer vision
*   see if there is any landmarks in it and put all of them in an array*/
function azureLandmarks(azureCV){
    let landmarks = [];
    let categories = azureCV['categories'];

    for(let cat of categories){

        if( cat['detail'] && cat['detail']['landmarks'] &&
            Array.isArray(cat['detail']['landmarks']) &&
            (cat['detail']['landmarks']).length > 0){

            for(let landmark of ((cat['detail']['landmarks']))){
                landmarks.push(landmark);
            }

        }

    }

    return landmarks;
}

/*  Starting from google cloud vision and azure computer vision objects
    build a common landmarks array (given also a minimum confidence threshold)
* */
function buildLandmarksObj(gCloudV, azureCV, minScore = 0.0){
    let landmarks = [];

    if(gCloudV){ //google cloud vision results are available

        let gCloudLandMarks = gCloudV['landmarkAnnotations'];

        //apply standard bounding box to all the landmarks objects
        if(azureCV)// azure computer vision results are available
            gCloudVObjsToCogniBoundingBox(gCloudLandMarks, azureCV['metadata']['width'], azureCV['metadata']['height']);

        else//WARNING! need to retrieve image sizes from gcloud (already done and put in the metadata tag of gcloudv with appropriate calls)
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

    if(azureCV){// azure computer vision results are available
        let azureCVLandmarks = azureLandmarks(azureCV);
        landmarks = landmarks.concat(azureCVLandmarks);
    }

    if(gCloudV && gCloudV['landmarkAnnotations'] && gCloudV['landmarkAnnotations'].length < landmarks.length)//we picked landmarks tag from azure & google cloud
        landmarks = combineLandmarksArray(landmarks);//combine azure landmark tags with google ones

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

/*  Giving two objects with their bounding box calc the overlap value*/
function objectsOverlap(obj1, obj2){
    let obj1_b = obj1['boundingBox'];
    let obj2_b = obj2['boundingBox'];

    if(!obj1_b || !obj2_b)//one of the two objs has no bounding box
        return 0;

    //first consider the case in which the overlap is not possible, so the result is 0
    if(obj1_b['br']['x'] < obj2_b['bl']['x'] || obj1_b['bl']['x'] > obj2_b['br']['x'])//considering x
    // when the gFaceRect finished before the start of azure one (or the opposite)
        return 0;

    else if(obj1_b['bl']['y'] < obj2_b['tl']['y'] || obj1_b['tl']['y'] > obj2_b['bl']['y'])//considering y
    // when the gFaceRect finished before the start of azure one (or the opposite)
        return 0;

    else{ //there is an overlap

        // remind that
        //  - x goes from 0 -> N (left -> right)
        //  - y goes from 0 -> N (top -> bottom)
        let xc1 = Math.max(obj1_b['bl']['x'], obj2_b['bl']['x']);
        let xc2 = Math.min(obj1_b['br']['x'], obj2_b['br']['x']);
        let yc1 = Math.max(obj1_b['bl']['y'], obj2_b['bl']['y']);
        let yc2 = Math.min(obj1_b['tl']['y'], obj2_b['tl']['y']);
        let xg1 = obj1_b['bl']['x'];
        let xg2 = obj1_b['br']['x'];
        let yg1 = obj1_b['bl']['y'];
        let yg2 = obj1_b['tl']['y'];

        let areaO = (xc2-xc1) * (yc2 - yc1); //area covered by the overlapping
        let areaI = (xg2-xg1) * (yg2 - yg1); //area covered by the first bounding box

        return areaO/areaI;
    }
}

/*  Return objects where all the element referring to the same object are clusterized in a single one
*   by averaging the confidence value*/
function combineObjectsArray(objects){

    if(objects.length == 1)//nothing to combine
        return objects;

    //move all the objects name to lower case
    for(let o of objects){
        o['name'] = o['name'].toLowerCase();
    }

    let taken = [];//taken[i]=true <=> objects[i] has been already considered
    taken.fill(false, 0, objects.length);

    let combine_objects = [];
    for(let i=0; i<objects.length-1; i++){
        if(!taken[i]){//see if the object has been already clusterized in another previous one

            taken[i] = true;
            let obj = objects[i]; //obj = final clusterized objects

            //these two variables will help in order to perform the final avg between al the confidence values
            let total_confidence = objects[i]['confidence'];
            let n_taken_objects = 1;

            for(let j=1; j<objects.length;j++) {

                if(!taken[j] && objects[i]['name'] == objects[j]['name']){ // check if the element has not already been clusterized and if they have the same name
                    let overlap = objectsOverlap(objects[i], objects[j]);//overlap percentage between objects[i] & objects[j]

                    if (overlap > 0.9) {//considering the same obj if they have a high overlap value

                        taken[j] = true;
                        if (!objects[i]['mid'] && objects[j]['mid'] != null) // don't drop the mid value
                            obj['mid'] = objects[j]['mid'];

                        total_confidence += objects[j]['confidence'];
                        n_taken_objects++;
                    }
                }

            }

            obj['confidence'] = (total_confidence) / n_taken_objects; //compute the confidence avg

            combine_objects.push(obj);
        }

    }

    return combine_objects;

}

/*  Starting from google cloud vision and azure computer vision objects
    build a common objects array (given also a minimum confidence threshold)
* */
function buildObjectsObj(gCloudV, azureCV, minScore = 0.0){
    let objects = [];

    if(gCloudV) {// gcloud vision results are available
        let gCloudObjects = gCloudV['localizedObjectAnnotations'];

        //apply standard bounding box to all the detected objects
        if(azureCV)// azure computer vision results are available
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

    if(azureCV){// azure computer vision results are available
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

    objects = combineObjectsArray(objects);// build an array where labels regarding the same exact object are combined with averaged confidence

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
    build a common objects array (given also a minimum confidence threshold)
* */
function buildTextsObj(gCloudV, azureCV, minScore = 0.0){
    let texts = [];

    let gCloudTexts = gCloudV['textAnnotations']; //text is going to be detected just from gcloud

    //apply standard bounding box to all the detected objects
    if(azureCV)// azure computer vision results are available
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
    // need for now to process this data (we take as it is)
    let webDetection = gCloudV['webDetection']; //web detection data is given from google cloud vision

    return webDetection;
}

/*  Add boundingBox property to azure computer vision objects with the standard cogni bounding box schema.
*   We're passing from top,left,width,height to bl,br,tl,tr,width,height
* */
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

/*  Add boundingBox property to gCloud objects with the standard cogni bounding box schema
*   We're passing from an array of vertices to bl,br,tl,tr,width,height
* */
function gCloudVObjsToCogniBoundingBox(gCloudObjects, width, height){
    for(let gCloudObj of gCloudObjects){
        let vertices;
        let normalized = false;

        if(gCloudObj['boundingPoly']['vertices'].length > 0) // we can't know for sure that vertices will be filled (in case we check and use normalizedVertices)
            vertices = gCloudObj['boundingPoly']['vertices'];

        else if(gCloudObj['boundingPoly']['normalizedVertices'].length > 0) {
            vertices = gCloudObj['boundingPoly']['normalizedVertices'];
            normalized = true;
        }

        let x1 = vertices[0]['x']; // min x
        let x2 = vertices[0]['x']; // max x
        let y1 = vertices[0]['y']; // min y
        let y2 = vertices[0]['y']; // max y

        // remind that
        //  - x goes from 0 -> N (left -> right)
        //  - y goes from 0 -> N (top -> bottom)
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