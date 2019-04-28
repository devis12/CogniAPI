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
function buildColorInfoObj(azureColor, azureImageType, gcloudColorInfo){
    let resObj = azureColor;

    resObj['colorInfoRGBA'] = gcloudColorInfo['colors'];
    resObj['clipArtType'] = azureImageType['clipArtType'];
    resObj['lineDrawingType'] = (+azureImageType['lineDrawingType']) == 1;

    return resObj;
}
module.exports = {buildColorInfoObj};
