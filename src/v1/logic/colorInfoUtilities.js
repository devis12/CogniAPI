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
function buildColorInfoObj(azureColor, gcloudColorInfo){
    let resObj = azureColor;

    resObj['colorInfoRGBA'] = gcloudColorInfo['colors'];

    return resObj;
}
module.exports = {buildColorInfoObj};
