/*
*   Module which provides functions in order to manipulate and extract data
*   from Azure Computer Vision color tag & Google Cloud Vision colorInfo,
*   cross check and combine them
*
*   @author: Devis
*/

/*  Build cogniAPI colorInfo obj provided azure adult & google cloud
*   safety annotation
*   */
function buildColorInfoObj(gcloudColorInfo, azureColor, azureImageType){
    let resObj = null;
    if(azureColor && azureImageType) {
        resObj = azureColor;
        resObj['clipArtType'] = azureImageType['clipArtType'];
        resObj['lineDrawingType'] = (+azureImageType['lineDrawingType']) == 1;
    }

    if(gcloudColorInfo) {
        if (resObj == null)
            resObj = {};
        resObj['colorInfoRGBA'] = gcloudColorInfo['colors'];
    }

    return resObj;
}
module.exports = {buildColorInfoObj};
