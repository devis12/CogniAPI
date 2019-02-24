/*
*   API Services key for Azure, Google Cloud, Amazon Web Services
*
*   @author: Devis
*/
const azureUrl1 = "https://westcentralus.api.cognitive.microsoft.com/vision/v1.0";
const azureUrl2 = "https://westcentralus.api.cognitive.microsoft.com/vision/v2.0";
const azureKey1 = "1c5fef3d8a9e4dd9bc18fc9603b353bc";
const azureKey2 = "9c33b98694a64d8d8fc7a07d63a15fae";

module.exports = {
    azure1: {url: azureUrl1, key: azureKey1},
    azure2: {url: azureUrl2, key: azureKey2}
};