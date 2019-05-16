/*
*   Module which provides functions in order to manipulate and extract data
*   from Azure Computer Vision color tag & Google Cloud Vision colorInfo,
*   cross check and combine them
*
*   @author: Devis
*/

/*  Build cogniAPI colorInfo obj provided azure colors, azure image type (clipart, linedrawing)
*   & google cloud imagePropertiesAnnotation.dominantColors
*   */
function buildColorInfoObj(gcloudColorInfo, azureColor, azureImageType){
    let colorsObj = null;

    if(azureColor && azureImageType) { // check if there are the info from azure
        //populate the obj with azure info
        colorsObj = azureColor;
        colorsObj['clipArtType'] = azureImageType['clipArtType'];
        colorsObj['lineDrawingType'] = (+azureImageType['lineDrawingType']) == 1;
    }

    if(gcloudColorInfo) { // check if there are the info from gcloud
        if (colorsObj == null) //check if the object is already popolated or not
            colorsObj = {};

        //popoulate the object with gcloud attributes
        colorsObj['colorInfoRGBA'] = gcloudColorInfo['colors'];
    }

    return colorsObj;
}

module.exports = {buildColorInfoObj};
