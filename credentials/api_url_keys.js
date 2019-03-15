/*
*   API Services key for Azure, Google Cloud, Amazon Web Services
*
*   @author: Devis
*/
const azureUrlVision = "https://westeurope.api.cognitive.microsoft.com/vision/v2.0";

const azureVisionKey1 = "cb497c76ce864d56af112ca82600a4dd";
const azureVisionKey2 = "218ef8fbeaad48cfad2caa1bb7ebd8b7";

const azureUrlFace = "https://westeurope.api.cognitive.microsoft.com/face/v1.0";
const azureFaceKey1 = "cec281c4ca8c4994b64fc9c1e681e4f1";
const azureFaceKey2 = "cec281c4ca8c4994b64fc9c1e681e4f1";

module.exports = {
    azure1V: {url: azureUrlVision, key: azureVisionKey1},
    azure2V: {url: azureUrlVision, key: azureVisionKey2},
    azure1F: {url: azureUrlFace, key: azureFaceKey1},
    azure2F: {url: azureUrlFace, key: azureFaceKey2}
};